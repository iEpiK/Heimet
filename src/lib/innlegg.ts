import { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { hentVennIder } from "./venner";

/** Relasjonene et innleggskort trenger for å rendres. */
export const innleggInclude = (leserId: string) =>
  ({
    forfatter: { select: { id: true, name: true, username: true, image: true } },
    grend: { select: { id: true, navn: true, slug: true } },
    stove: { select: { id: true, navn: true, slug: true } },
    media: true,
    fyrstikker: { select: { type: true, brukerId: true } },
    _count: { select: { kommentarer: true } },
  }) satisfies Prisma.InnleggInclude;

export type InnleggMedRelasjoner = Prisma.InnleggGetPayload<{
  include: ReturnType<typeof innleggInclude>;
}>;

/**
 * Synkron variant av kanGiFeedback for lister der vennesettet
 * allerede er hentet — unngår én spørring per innlegg i feeden.
 */
export function kanGiFeedbackSync(
  innlegg: { forfatterId: string; feedbackPolicy: "ALLE" | "VENNER" | "INGEN" },
  megId: string,
  vennIder: ReadonlySet<string>
) {
  if (innlegg.feedbackPolicy === "INGEN") return false;
  if (innlegg.forfatterId === megId) return true;
  if (innlegg.feedbackPolicy === "ALLE") return true;
  return vennIder.has(innlegg.forfatterId);
}

/**
 * WHERE-klausul som kun matcher innlegg leseren har lov til å se.
 * Speiler kanSeInnlegg, men på spørringsnivå så feeden aldri
 * henter noe som må filtreres bort etterpå.
 */
export async function synligForWhere(leserId: string): Promise<Prisma.InnleggWhereInput> {
  const [vennIder, grendIder, blokkerte] = await Promise.all([
    hentVennIder(leserId),
    prisma.grendMedlemskap
      .findMany({ where: { brukerId: leserId, status: "GODKJENT" }, select: { grendId: true } })
      .then((m) => m.map((x) => x.grendId)),
    prisma.blokkering
      .findMany({
        where: { OR: [{ blokkererId: leserId }, { blokkertId: leserId }] },
        select: { blokkererId: true, blokkertId: true },
      })
      .then((b) => b.map((x) => (x.blokkererId === leserId ? x.blokkertId : x.blokkererId))),
  ]);

  return {
    forfatter: { slettesAt: null },
    ...(blokkerte.length > 0 && { forfatterId: { notIn: blokkerte } }),
    OR: [
      { forfatterId: leserId },
      { synlighet: "GREND", grendId: { in: grendIder } },
      { stoveId: { not: null } },
      { synlighet: "OFFENTLIG", grendId: null },
      { synlighet: "VENNER", grendId: null, forfatterId: { in: vennIder } },
      // Åpne grender: offentlige innlegg i grend er synlige for alle
      { synlighet: "OFFENTLIG", grend: { type: "AAPEN" } },
    ],
  };
}
