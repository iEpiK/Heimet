"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hentBruker } from "@/lib/session";
import { erBlokkert } from "@/lib/venner";
import { publiser } from "@/lib/sse";

type Resultat = { ok: true; id?: string } | { feil: string };

/** Finner eksisterende 1:1-samtale eller starter en ny. */
export async function startSamtale(brukernavn: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const andre = await prisma.user.findUnique({
    where: { username: brukernavn.trim().toLowerCase() },
  });
  if (!andre || andre.slettesAt) return { feil: "Fant ingen bruker med det brukernavnet." };
  if (andre.id === meg.id) return { feil: "Du kan ikke sende melding til deg selv." };
  if (await erBlokkert(meg.id, andre.id)) return { feil: "Kan ikke starte samtale." };

  const eksisterende = await prisma.samtale.findFirst({
    where: {
      erGruppe: false,
      AND: [
        { medlemmer: { some: { brukerId: meg.id } } },
        { medlemmer: { some: { brukerId: andre.id } } },
      ],
    },
  });
  if (eksisterende) return { ok: true, id: eksisterende.id };

  const samtale = await prisma.samtale.create({
    data: {
      erGruppe: false,
      medlemmer: { create: [{ brukerId: meg.id }, { brukerId: andre.id }] },
    },
  });
  return { ok: true, id: samtale.id };
}

export async function startGruppesamtale(
  navn: string,
  brukernavnListe: string[]
): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const trimmetNavn = navn.trim();
  if (!trimmetNavn || trimmetNavn.length > 60) return { feil: "Gruppa må ha et navn (maks 60 tegn)." };

  const brukere = await prisma.user.findMany({
    where: {
      username: { in: brukernavnListe.map((b) => b.trim().toLowerCase()).filter(Boolean) },
      slettesAt: null,
      id: { not: meg.id },
    },
  });
  if (brukere.length === 0) return { feil: "Fant ingen av brukerne." };

  for (const b of brukere) {
    if (await erBlokkert(meg.id, b.id)) return { feil: `Kan ikke legge til @${b.username}.` };
  }

  const samtale = await prisma.samtale.create({
    data: {
      navn: trimmetNavn,
      erGruppe: true,
      medlemmer: {
        create: [{ brukerId: meg.id }, ...brukere.map((b) => ({ brukerId: b.id }))],
      },
    },
  });
  return { ok: true, id: samtale.id };
}

export async function sendMelding(samtaleId: string, innhold: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const trimmet = innhold.trim();
  if (!trimmet || trimmet.length > 5000) return { feil: "Meldingen må ha 1–5000 tegn." };

  const medlemskap = await prisma.samtaleMedlem.findUnique({
    where: { samtaleId_brukerId: { samtaleId, brukerId: meg.id } },
    include: { samtale: { include: { medlemmer: true } } },
  });
  if (!medlemskap) return { feil: "Du er ikke med i samtalen." };

  // I 1:1-samtaler stopper blokkering nye meldinger
  if (!medlemskap.samtale.erGruppe) {
    const andre = medlemskap.samtale.medlemmer.find((m) => m.brukerId !== meg.id);
    if (andre && (await erBlokkert(meg.id, andre.brukerId))) {
      return { feil: "Kan ikke sende melding i denne samtalen." };
    }
  }

  const melding = await prisma.melding.create({
    data: { samtaleId, avsenderId: meg.id, innhold: trimmet },
  });
  await prisma.$transaction([
    prisma.samtale.update({
      where: { id: samtaleId },
      data: { sisteAktivitet: melding.opprettetAt },
    }),
    prisma.samtaleMedlem.update({
      where: { id: medlemskap.id },
      data: { sistLest: melding.opprettetAt },
    }),
  ]);

  for (const m of medlemskap.samtale.medlemmer) {
    if (m.brukerId !== meg.id) {
      publiser(m.brukerId, { type: "melding", refId: samtaleId });
    }
  }

  revalidatePath(`/meldinger/${samtaleId}`);
  return { ok: true, id: melding.id };
}

export async function markerSamtaleLest(samtaleId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  await prisma.samtaleMedlem.updateMany({
    where: { samtaleId, brukerId: meg.id },
    data: { sistLest: new Date() },
  });
  return { ok: true };
}

export async function forlatSamtale(samtaleId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  const medlemskap = await prisma.samtaleMedlem.findUnique({
    where: { samtaleId_brukerId: { samtaleId, brukerId: meg.id } },
    include: { samtale: true },
  });
  if (!medlemskap) return { feil: "Du er ikke med i samtalen." };
  if (!medlemskap.samtale.erGruppe) return { feil: "1:1-samtaler kan ikke forlates." };

  await prisma.samtaleMedlem.delete({ where: { id: medlemskap.id } });
  revalidatePath("/meldinger");
  return { ok: true };
}

export async function markerAlleVarslerLest(): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  await prisma.varsel.updateMany({
    where: { mottakerId: meg.id, lest: false },
    data: { lest: true },
  });
  revalidatePath("/varsler");
  return { ok: true };
}
