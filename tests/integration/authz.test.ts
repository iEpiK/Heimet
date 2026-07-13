import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { kanSeInnlegg, kanGiFeedback } from "@/lib/authz";
import { synligForWhere } from "@/lib/innlegg";

// Integrasjonstest mot ekte database (DATABASE_URL).
// Verifiserer at authz-laget og feed-spørringen håndhever samme regler.

const suffix = `authz-${Date.now()}`;
let forfatter: string, venn: string, fremmed: string, blokkert: string;
let offentligId: string, vennerId: string, ingenFeedbackId: string;

async function lagBruker(navn: string) {
  const bruker = await prisma.user.create({
    data: {
      id: `test-${navn}-${suffix}`,
      name: navn,
      email: `${navn}-${suffix}@test.heimet.no`,
      username: `${navn}${suffix}`.toLowerCase().replace(/[^a-z0-9]/g, ""),
    },
  });
  return bruker.id;
}

beforeAll(async () => {
  forfatter = await lagBruker("forfatter");
  venn = await lagBruker("venn");
  fremmed = await lagBruker("fremmed");
  blokkert = await lagBruker("blokkert");

  await prisma.vennskap.create({
    data: { fraId: forfatter, tilId: venn, status: "GODTATT", godtattAt: new Date() },
  });
  await prisma.blokkering.create({
    data: { blokkererId: forfatter, blokkertId: blokkert },
  });

  offentligId = (
    await prisma.innlegg.create({
      data: { forfatterId: forfatter, innhold: "offentlig", synlighet: "OFFENTLIG", feedbackPolicy: "VENNER" },
    })
  ).id;
  vennerId = (
    await prisma.innlegg.create({
      data: { forfatterId: forfatter, innhold: "til venner", synlighet: "VENNER", feedbackPolicy: "ALLE" },
    })
  ).id;
  ingenFeedbackId = (
    await prisma.innlegg.create({
      data: { forfatterId: forfatter, innhold: "stille", synlighet: "OFFENTLIG", feedbackPolicy: "INGEN" },
    })
  ).id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [forfatter, venn, fremmed, blokkert] } } });
});

async function hent(id: string) {
  return (await prisma.innlegg.findUniqueOrThrow({ where: { id } }))!;
}

describe("kanSeInnlegg", () => {
  it("offentlige innlegg er synlige for alle unntatt blokkerte", async () => {
    const innlegg = await hent(offentligId);
    expect(await kanSeInnlegg(innlegg, fremmed)).toBe(true);
    expect(await kanSeInnlegg(innlegg, blokkert)).toBe(false);
  });

  it("venneinnlegg er kun synlige for venner og forfatter", async () => {
    const innlegg = await hent(vennerId);
    expect(await kanSeInnlegg(innlegg, forfatter)).toBe(true);
    expect(await kanSeInnlegg(innlegg, venn)).toBe(true);
    expect(await kanSeInnlegg(innlegg, fremmed)).toBe(false);
  });
});

describe("kanGiFeedback", () => {
  it("feedbackPolicy VENNER stopper fremmede selv på offentlige innlegg", async () => {
    const innlegg = await hent(offentligId);
    expect(await kanGiFeedback(innlegg, venn)).toBe(true);
    expect(await kanGiFeedback(innlegg, fremmed)).toBe(false);
  });

  it("feedbackPolicy INGEN stopper alle", async () => {
    const innlegg = await hent(ingenFeedbackId);
    expect(await kanGiFeedback(innlegg, venn)).toBe(false);
    expect(await kanGiFeedback(innlegg, forfatter)).toBe(false);
  });
});

describe("synligForWhere speiler kanSeInnlegg", () => {
  async function synligeIder(leserId: string) {
    const innlegg = await prisma.innlegg.findMany({
      where: {
        AND: [{ forfatterId: forfatter }, await synligForWhere(leserId)],
      },
      select: { id: true },
    });
    return new Set(innlegg.map((i) => i.id));
  }

  it("venn ser alle tre innleggene", async () => {
    const ider = await synligeIder(venn);
    expect(ider.has(offentligId)).toBe(true);
    expect(ider.has(vennerId)).toBe(true);
    expect(ider.has(ingenFeedbackId)).toBe(true);
  });

  it("fremmed ser kun de offentlige", async () => {
    const ider = await synligeIder(fremmed);
    expect(ider.has(offentligId)).toBe(true);
    expect(ider.has(vennerId)).toBe(false);
  });

  it("blokkert ser ingenting", async () => {
    const ider = await synligeIder(blokkert);
    expect(ider.size).toBe(0);
  });
});
