"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hentBruker } from "@/lib/session";
import { erBlokkert } from "@/lib/venner";
import { opprettVarsel } from "@/lib/varsler";

type Resultat = { ok: true } | { feil: string };

export async function sendVenneforesporsel(tilId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  if (meg.id === tilId) return { feil: "Du kan ikke bli venn med deg selv." };

  const til = await prisma.user.findUnique({ where: { id: tilId } });
  if (!til || til.slettesAt) return { feil: "Fant ikke brukeren." };
  if (await erBlokkert(meg.id, tilId)) return { feil: "Kan ikke sende forespørsel." };

  const eksisterende = await prisma.vennskap.findFirst({
    where: {
      OR: [
        { fraId: meg.id, tilId },
        { fraId: tilId, tilId: meg.id },
      ],
    },
  });
  if (eksisterende) {
    if (eksisterende.status === "GODTATT") return { feil: "Dere er allerede venner." };
    // Motparten har allerede sendt til meg → godta i stedet
    if (eksisterende.fraId === tilId) return godtaVenneforesporsel(eksisterende.id);
    return { feil: "Forespørselen er allerede sendt." };
  }

  await prisma.vennskap.create({ data: { fraId: meg.id, tilId } });
  await opprettVarsel({
    mottakerId: tilId,
    aktorId: meg.id,
    type: "venneforesporsel",
    refType: "bruker",
    refId: meg.id,
  });
  revalidatePath("/venner");
  return { ok: true };
}

export async function godtaVenneforesporsel(vennskapId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const vennskap = await prisma.vennskap.findUnique({ where: { id: vennskapId } });
  if (!vennskap || vennskap.tilId !== meg.id || vennskap.status !== "VENTER") {
    return { feil: "Fant ikke forespørselen." };
  }
  await prisma.vennskap.update({
    where: { id: vennskapId },
    data: { status: "GODTATT", godtattAt: new Date() },
  });
  await opprettVarsel({
    mottakerId: vennskap.fraId,
    aktorId: meg.id,
    type: "venneforesporsel_godtatt",
    refType: "bruker",
    refId: meg.id,
  });
  revalidatePath("/venner");
  return { ok: true };
}

export async function avslaVenneforesporsel(vennskapId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  const vennskap = await prisma.vennskap.findUnique({ where: { id: vennskapId } });
  if (!vennskap || vennskap.tilId !== meg.id || vennskap.status !== "VENTER") {
    return { feil: "Fant ikke forespørselen." };
  }
  await prisma.vennskap.delete({ where: { id: vennskapId } });
  revalidatePath("/venner");
  return { ok: true };
}

export async function trekkVenneforesporsel(tilId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  await prisma.vennskap.deleteMany({
    where: { fraId: meg.id, tilId, status: "VENTER" },
  });
  revalidatePath("/venner");
  return { ok: true };
}

export async function fjernVenn(andreId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  await prisma.vennskap.deleteMany({
    where: {
      status: "GODTATT",
      OR: [
        { fraId: meg.id, tilId: andreId },
        { fraId: andreId, tilId: meg.id },
      ],
    },
  });
  revalidatePath("/venner");
  return { ok: true };
}

export async function blokkerBruker(andreId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  if (meg.id === andreId) return { feil: "Du kan ikke blokkere deg selv." };

  await prisma.$transaction([
    // Blokkering fjerner også ethvert vennskap/forespørsel
    prisma.vennskap.deleteMany({
      where: {
        OR: [
          { fraId: meg.id, tilId: andreId },
          { fraId: andreId, tilId: meg.id },
        ],
      },
    }),
    prisma.blokkering.upsert({
      where: { blokkererId_blokkertId: { blokkererId: meg.id, blokkertId: andreId } },
      create: { blokkererId: meg.id, blokkertId: andreId },
      update: {},
    }),
  ]);
  revalidatePath("/venner");
  return { ok: true };
}

export async function avblokkerBruker(andreId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  await prisma.blokkering.deleteMany({
    where: { blokkererId: meg.id, blokkertId: andreId },
  });
  revalidatePath("/venner");
  return { ok: true };
}
