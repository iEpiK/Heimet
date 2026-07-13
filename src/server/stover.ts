"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hentBruker } from "@/lib/session";
import { lagSlug } from "@/lib/slug";
import { lagreBilde } from "@/lib/lagring";
import { STOVE_KATEGORIER } from "@/lib/kategorier";

type Resultat = { ok: true; slug?: string } | { feil: string };

const stoveSkjema = z.object({
  navn: z.string().trim().min(2, "Navnet må ha minst 2 tegn.").max(60, "Maks 60 tegn."),
  kategori: z.enum(STOVE_KATEGORIER),
  beskrivelse: z.string().trim().max(1000, "Maks 1000 tegn."),
});

async function erStoveAdmin(stoveId: string, brukerId: string) {
  const rolle = await prisma.stoveRolle.findUnique({
    where: { stoveId_brukerId: { stoveId, brukerId } },
  });
  return rolle?.rolle === "ADMIN";
}

export async function opprettStove(skjema: FormData): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const parsed = stoveSkjema.safeParse({
    navn: skjema.get("navn") ?? "",
    kategori: skjema.get("kategori") ?? "Annet",
    beskrivelse: skjema.get("beskrivelse") ?? "",
  });
  if (!parsed.success) return { feil: parsed.error.issues[0].message };

  let coverUrl: string | undefined;
  const cover = skjema.get("cover");
  try {
    if (cover instanceof File && cover.size > 0) {
      coverUrl = (await lagreBilde(cover, "cover")).url;
    }
  } catch (e) {
    return { feil: e instanceof Error ? e.message : "Kunne ikke lagre bildet." };
  }

  const stove = await prisma.stove.create({
    data: {
      navn: parsed.data.navn,
      slug: lagSlug(parsed.data.navn),
      kategori: parsed.data.kategori,
      beskrivelse: parsed.data.beskrivelse || null,
      coverbilde: coverUrl,
      roller: { create: { brukerId: meg.id, rolle: "ADMIN" } },
      folgere: { create: { brukerId: meg.id } },
    },
  });

  revalidatePath("/stover");
  return { ok: true, slug: stove.slug };
}

export async function folgStove(stoveId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const stove = await prisma.stove.findUnique({ where: { id: stoveId } });
  if (!stove) return { feil: "Fant ikke stova." };

  await prisma.stoveFolging.upsert({
    where: { stoveId_brukerId: { stoveId, brukerId: meg.id } },
    create: { stoveId, brukerId: meg.id },
    update: {},
  });
  revalidatePath(`/stover/${stove.slug}`);
  return { ok: true };
}

export async function avfolgStove(stoveId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  const stove = await prisma.stove.findUnique({ where: { id: stoveId } });
  if (!stove) return { feil: "Fant ikke stova." };

  await prisma.stoveFolging.deleteMany({ where: { stoveId, brukerId: meg.id } });
  revalidatePath(`/stover/${stove.slug}`);
  return { ok: true };
}

export async function leggTilStoveRedaktor(
  stoveId: string,
  brukernavn: string
): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  if (!(await erStoveAdmin(stoveId, meg.id))) return { feil: "Kun admin kan legge til redaktører." };

  const bruker = await prisma.user.findUnique({
    where: { username: brukernavn.trim().toLowerCase() },
  });
  if (!bruker || bruker.slettesAt) return { feil: "Fant ingen bruker med det brukernavnet." };

  const stove = await prisma.stove.findUnique({ where: { id: stoveId } });
  await prisma.stoveRolle.upsert({
    where: { stoveId_brukerId: { stoveId, brukerId: bruker.id } },
    create: { stoveId, brukerId: bruker.id, rolle: "REDAKTOR" },
    update: {},
  });
  revalidatePath(`/stover/${stove?.slug}`);
  return { ok: true };
}

export async function fjernStoveRedaktor(rolleId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const rolle = await prisma.stoveRolle.findUnique({
    where: { id: rolleId },
    include: { stove: true },
  });
  if (!rolle) return { feil: "Fant ikke rollen." };
  if (!(await erStoveAdmin(rolle.stoveId, meg.id))) return { feil: "Kun admin kan fjerne redaktører." };
  if (rolle.rolle === "ADMIN") {
    const andreAdminer = await prisma.stoveRolle.count({
      where: { stoveId: rolle.stoveId, rolle: "ADMIN", NOT: { id: rolleId } },
    });
    if (andreAdminer === 0) return { feil: "Stova må ha minst én admin." };
  }

  await prisma.stoveRolle.delete({ where: { id: rolleId } });
  revalidatePath(`/stover/${rolle.stove.slug}`);
  return { ok: true };
}
