"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hentBruker } from "@/lib/session";
import { kanGiFeedback, kanForvalteInnlegg, erGrendMedlem } from "@/lib/authz";
import { lagreBilde } from "@/lib/lagring";
import { opprettVarsel } from "@/lib/varsler";
import type { FyrstikkType } from "@/generated/prisma/enums";

type Resultat = { ok: true; id?: string } | { feil: string };

const innleggSkjema = z.object({
  innhold: z.string().trim().min(1, "Innlegget kan ikke være tomt.").max(5000, "Maks 5000 tegn."),
  synlighet: z.enum(["OFFENTLIG", "VENNER", "GREND"]),
  feedbackPolicy: z.enum(["ALLE", "VENNER", "INGEN"]),
  grendId: z.string().optional(),
  stoveId: z.string().optional(),
});

export async function opprettInnlegg(skjema: FormData): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const parsed = innleggSkjema.safeParse({
    innhold: skjema.get("innhold") ?? "",
    synlighet: skjema.get("synlighet") ?? "VENNER",
    feedbackPolicy: skjema.get("feedbackPolicy") ?? "ALLE",
    grendId: skjema.get("grendId")?.toString() || undefined,
    stoveId: skjema.get("stoveId")?.toString() || undefined,
  });
  if (!parsed.success) return { feil: parsed.error.issues[0].message };
  const data = parsed.data;

  let synlighet = data.synlighet;

  if (data.grendId) {
    const grend = await prisma.grend.findUnique({ where: { id: data.grendId } });
    if (!grend) return { feil: "Fant ikke grenda." };
    if (!(await erGrendMedlem(meg.id, grend.id))) {
      return { feil: "Du må være medlem av grenda for å dele der." };
    }
    // I lukkede/skjulte grender er innlegg alltid kun for medlemmer
    if (grend.type !== "AAPEN" || synlighet !== "OFFENTLIG") synlighet = "GREND";
  } else if (data.stoveId) {
    const rolle = await prisma.stoveRolle.findUnique({
      where: { stoveId_brukerId: { stoveId: data.stoveId, brukerId: meg.id } },
    });
    if (!rolle) return { feil: "Du har ikke redaktørtilgang til denne stova." };
    synlighet = "OFFENTLIG"; // stover er offentlige sider
  } else if (synlighet === "GREND") {
    synlighet = "VENNER";
  }

  const bilder = skjema.getAll("bilder").filter((b): b is File => b instanceof File && b.size > 0);
  if (bilder.length > 4) return { feil: "Maks 4 bilder per innlegg." };

  const media: { type: string; url: string; bredde: number; hoyde: number }[] = [];
  try {
    for (const bilde of bilder) {
      const lagret = await lagreBilde(bilde, "innlegg");
      media.push({ type: "bilde", url: lagret.url, bredde: lagret.bredde, hoyde: lagret.hoyde });
    }
  } catch (e) {
    return { feil: e instanceof Error ? e.message : "Kunne ikke lagre bildet." };
  }

  const innlegg = await prisma.innlegg.create({
    data: {
      forfatterId: meg.id,
      innhold: data.innhold,
      synlighet,
      feedbackPolicy: data.feedbackPolicy,
      grendId: data.grendId,
      stoveId: data.stoveId,
      media: { create: media },
    },
  });

  revalidatePath("/tunet");
  return { ok: true, id: innlegg.id };
}

export async function redigerInnlegg(innleggId: string, innhold: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  const innlegg = await prisma.innlegg.findUnique({ where: { id: innleggId } });
  if (!innlegg || innlegg.forfatterId !== meg.id) return { feil: "Fant ikke innlegget." };

  const trimmet = innhold.trim();
  if (!trimmet || trimmet.length > 5000) return { feil: "Innlegget må ha 1–5000 tegn." };

  await prisma.innlegg.update({
    where: { id: innleggId },
    data: { innhold: trimmet, redigertAt: new Date() },
  });
  revalidatePath(`/innlegg/${innleggId}`);
  revalidatePath("/tunet");
  return { ok: true };
}

export async function slettInnlegg(innleggId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  const innlegg = await prisma.innlegg.findUnique({ where: { id: innleggId } });
  if (!innlegg || !(await kanForvalteInnlegg(innlegg, meg))) {
    return { feil: "Du kan ikke slette dette innlegget." };
  }
  await prisma.innlegg.delete({ where: { id: innleggId } });
  revalidatePath("/tunet");
  return { ok: true };
}

/** Slår av/på en fyrstikk. Samme type fjerner; annen type bytter. */
export async function giFyrstikk(
  mal: { innleggId: string } | { kommentarId: string },
  type: FyrstikkType
): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  let innlegg;
  let kommentarForfatterId: string | null = null;
  if ("innleggId" in mal) {
    innlegg = await prisma.innlegg.findUnique({ where: { id: mal.innleggId } });
  } else {
    const kommentar = await prisma.kommentar.findUnique({
      where: { id: mal.kommentarId },
      include: { innlegg: true },
    });
    innlegg = kommentar?.innlegg;
    kommentarForfatterId = kommentar?.forfatterId ?? null;
  }
  if (!innlegg) return { feil: "Fant ikke innlegget." };
  if (!(await kanGiFeedback(innlegg, meg.id))) {
    return { feil: "Forfatteren har begrenset hvem som kan reagere her." };
  }

  const hvor =
    "innleggId" in mal
      ? { brukerId_innleggId: { brukerId: meg.id, innleggId: mal.innleggId } }
      : { brukerId_kommentarId: { brukerId: meg.id, kommentarId: mal.kommentarId } };

  const eksisterende = await prisma.fyrstikk.findUnique({ where: hvor });
  if (eksisterende?.type === type) {
    await prisma.fyrstikk.delete({ where: { id: eksisterende.id } });
  } else if (eksisterende) {
    await prisma.fyrstikk.update({ where: { id: eksisterende.id }, data: { type } });
  } else {
    await prisma.fyrstikk.create({
      data: {
        brukerId: meg.id,
        type,
        ...("innleggId" in mal ? { innleggId: mal.innleggId } : { kommentarId: mal.kommentarId }),
      },
    });
    await opprettVarsel({
      mottakerId: kommentarForfatterId ?? innlegg.forfatterId,
      aktorId: meg.id,
      type: "fyrstikk",
      refType: "innlegg",
      refId: innlegg.id,
    });
  }

  revalidatePath(`/innlegg/${innlegg.id}`);
  return { ok: true };
}

const kommentarSkjema = z.object({
  innhold: z.string().trim().min(1, "Kommentaren kan ikke være tom.").max(2000, "Maks 2000 tegn."),
  parentId: z.string().optional(),
});

export async function opprettKommentar(
  innleggId: string,
  verdier: { innhold: string; parentId?: string }
): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const parsed = kommentarSkjema.safeParse(verdier);
  if (!parsed.success) return { feil: parsed.error.issues[0].message };

  const innlegg = await prisma.innlegg.findUnique({ where: { id: innleggId } });
  if (!innlegg) return { feil: "Fant ikke innlegget." };
  if (!(await kanGiFeedback(innlegg, meg.id))) {
    return { feil: "Forfatteren har begrenset hvem som kan kommentere her." };
  }

  let parent = null;
  if (parsed.data.parentId) {
    parent = await prisma.kommentar.findUnique({ where: { id: parsed.data.parentId } });
    if (!parent || parent.innleggId !== innleggId) return { feil: "Fant ikke kommentaren du svarer på." };
  }

  const kommentar = await prisma.kommentar.create({
    data: {
      innleggId,
      forfatterId: meg.id,
      innhold: parsed.data.innhold,
      parentId: parsed.data.parentId,
    },
  });

  await opprettVarsel({
    mottakerId: innlegg.forfatterId,
    aktorId: meg.id,
    type: "kommentar",
    refType: "innlegg",
    refId: innleggId,
  });
  if (parent && parent.forfatterId !== innlegg.forfatterId) {
    await opprettVarsel({
      mottakerId: parent.forfatterId,
      aktorId: meg.id,
      type: "kommentar_svar",
      refType: "innlegg",
      refId: innleggId,
    });
  }

  revalidatePath(`/innlegg/${innleggId}`);
  return { ok: true, id: kommentar.id };
}

export async function slettKommentar(kommentarId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  const kommentar = await prisma.kommentar.findUnique({
    where: { id: kommentarId },
    include: { innlegg: { select: { forfatterId: true, id: true } } },
  });
  if (!kommentar) return { feil: "Fant ikke kommentaren." };
  const kanSlette =
    kommentar.forfatterId === meg.id ||
    kommentar.innlegg.forfatterId === meg.id ||
    meg.rolle !== "BRUKER";
  if (!kanSlette) return { feil: "Du kan ikke slette denne kommentaren." };

  await prisma.kommentar.delete({ where: { id: kommentarId } });
  revalidatePath(`/innlegg/${kommentar.innlegg.id}`);
  return { ok: true };
}
