"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hentBruker } from "@/lib/session";
import { erGrendMedlem } from "@/lib/authz";
import { kanSeStevne } from "@/lib/stevner";
import { lagreBilde } from "@/lib/lagring";
import { opprettVarsel } from "@/lib/varsler";
import type { StevneSvarType } from "@/generated/prisma/enums";

type Resultat = { ok: true; id?: string } | { feil: string };

const stevneSkjema = z.object({
  tittel: z.string().trim().min(2, "Tittelen må ha minst 2 tegn.").max(100, "Maks 100 tegn."),
  beskrivelse: z.string().trim().max(2000, "Maks 2000 tegn."),
  sted: z.string().trim().max(120),
  start: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Ugyldig starttidspunkt."),
  slutt: z.string().refine((v) => !v || !Number.isNaN(Date.parse(v)), "Ugyldig sluttidspunkt."),
  synlighet: z.enum(["OFFENTLIG", "VENNER", "GREND"]),
  grendId: z.string().optional(),
  stoveId: z.string().optional(),
});

export async function opprettStevne(skjema: FormData): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const parsed = stevneSkjema.safeParse({
    tittel: skjema.get("tittel") ?? "",
    beskrivelse: skjema.get("beskrivelse") ?? "",
    sted: skjema.get("sted") ?? "",
    start: skjema.get("start") ?? "",
    slutt: skjema.get("slutt") ?? "",
    synlighet: skjema.get("synlighet") ?? "VENNER",
    grendId: skjema.get("grendId")?.toString() || undefined,
    stoveId: skjema.get("stoveId")?.toString() || undefined,
  });
  if (!parsed.success) return { feil: parsed.error.issues[0].message };
  const data = parsed.data;

  const start = new Date(data.start);
  const slutt = data.slutt ? new Date(data.slutt) : null;
  if (slutt && slutt <= start) return { feil: "Slutt må være etter start." };

  let synlighet = data.synlighet;
  if (data.grendId) {
    if (!(await erGrendMedlem(meg.id, data.grendId))) {
      return { feil: "Du må være medlem av grenda." };
    }
    const grend = await prisma.grend.findUnique({ where: { id: data.grendId } });
    if (grend?.type !== "AAPEN" || synlighet !== "OFFENTLIG") synlighet = "GREND";
  } else if (data.stoveId) {
    const rolle = await prisma.stoveRolle.findUnique({
      where: { stoveId_brukerId: { stoveId: data.stoveId, brukerId: meg.id } },
    });
    if (!rolle) return { feil: "Du har ikke redaktørtilgang til stova." };
    synlighet = "OFFENTLIG";
  } else if (synlighet === "GREND") {
    synlighet = "VENNER";
  }

  let coverUrl: string | undefined;
  const cover = skjema.get("cover");
  try {
    if (cover instanceof File && cover.size > 0) {
      coverUrl = (await lagreBilde(cover, "cover")).url;
    }
  } catch (e) {
    return { feil: e instanceof Error ? e.message : "Kunne ikke lagre bildet." };
  }

  const stevne = await prisma.stevne.create({
    data: {
      tittel: data.tittel,
      beskrivelse: data.beskrivelse || null,
      sted: data.sted || null,
      start,
      slutt,
      synlighet,
      arrangorId: meg.id,
      grendId: data.grendId,
      stoveId: data.stoveId,
      coverbilde: coverUrl,
      svar: { create: { brukerId: meg.id, svar: "KOMMER" } },
    },
  });

  revalidatePath("/stevner");
  return { ok: true, id: stevne.id };
}

export async function slettStevne(stevneId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  const stevne = await prisma.stevne.findUnique({ where: { id: stevneId } });
  if (!stevne) return { feil: "Fant ikke stevnet." };
  if (stevne.arrangorId !== meg.id && meg.rolle === "BRUKER") {
    return { feil: "Kun arrangøren kan avlyse stevnet." };
  }
  await prisma.stevne.delete({ where: { id: stevneId } });
  revalidatePath("/stevner");
  return { ok: true };
}

export async function svarPaStevne(stevneId: string, svar: StevneSvarType): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const stevne = await prisma.stevne.findUnique({ where: { id: stevneId } });
  if (!stevne || !(await kanSeStevne(stevne, meg.id))) return { feil: "Fant ikke stevnet." };

  const eksisterende = await prisma.stevneSvar.findUnique({
    where: { stevneId_brukerId: { stevneId, brukerId: meg.id } },
  });

  await prisma.stevneSvar.upsert({
    where: { stevneId_brukerId: { stevneId, brukerId: meg.id } },
    create: { stevneId, brukerId: meg.id, svar },
    update: { svar, svartAt: new Date() },
  });

  if (!eksisterende && svar === "KOMMER") {
    await opprettVarsel({
      mottakerId: stevne.arrangorId,
      aktorId: meg.id,
      type: "stevne_svar",
      refType: "stevne",
      refId: stevneId,
      tekst: stevne.tittel,
    });
  }

  revalidatePath(`/stevner/${stevneId}`);
  return { ok: true };
}

export async function inviterTilStevne(stevneId: string, brukernavn: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const stevne = await prisma.stevne.findUnique({ where: { id: stevneId } });
  if (!stevne || !(await kanSeStevne(stevne, meg.id))) return { feil: "Fant ikke stevnet." };

  const bruker = await prisma.user.findUnique({
    where: { username: brukernavn.trim().toLowerCase() },
  });
  if (!bruker || bruker.slettesAt) return { feil: "Fant ingen bruker med det brukernavnet." };
  if (bruker.id === meg.id) return { feil: "Du er allerede med!" };

  const eksisterende = await prisma.stevneSvar.findUnique({
    where: { stevneId_brukerId: { stevneId, brukerId: bruker.id } },
  });
  if (eksisterende) return { feil: "Brukeren er allerede invitert." };

  await prisma.stevneSvar.create({
    data: { stevneId, brukerId: bruker.id, svar: "KANSKJE" },
  });
  await opprettVarsel({
    mottakerId: bruker.id,
    aktorId: meg.id,
    type: "stevne_invitasjon",
    refType: "stevne",
    refId: stevneId,
    tekst: stevne.tittel,
  });

  revalidatePath(`/stevner/${stevneId}`);
  return { ok: true };
}
