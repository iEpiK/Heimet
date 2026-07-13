import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hentBruker } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GDPR: full eksport av brukerens data som JSON. */
export async function GET() {
  const meg = await hentBruker();
  if (!meg) return new NextResponse(null, { status: 401 });

  const [
    innlegg,
    kommentarer,
    fyrstikker,
    vennskap,
    grendMedlemskap,
    stoveFolginger,
    stevner,
    stevneSvar,
    meldinger,
    varsler,
    dugnadspoeng,
    merker,
    balsvar,
  ] = await Promise.all([
    prisma.innlegg.findMany({ where: { forfatterId: meg.id }, include: { media: true } }),
    prisma.kommentar.findMany({ where: { forfatterId: meg.id } }),
    prisma.fyrstikk.findMany({ where: { brukerId: meg.id } }),
    prisma.vennskap.findMany({
      where: { OR: [{ fraId: meg.id }, { tilId: meg.id }], status: "GODTATT" },
    }),
    prisma.grendMedlemskap.findMany({
      where: { brukerId: meg.id },
      include: { grend: { select: { navn: true } } },
    }),
    prisma.stoveFolging.findMany({
      where: { brukerId: meg.id },
      include: { stove: { select: { navn: true } } },
    }),
    prisma.stevne.findMany({ where: { arrangorId: meg.id } }),
    prisma.stevneSvar.findMany({ where: { brukerId: meg.id } }),
    prisma.melding.findMany({ where: { avsenderId: meg.id } }),
    prisma.varsel.findMany({ where: { mottakerId: meg.id } }),
    prisma.dugnadspoeng.findMany({ where: { brukerId: meg.id } }),
    prisma.merke.findMany({ where: { brukerId: meg.id } }),
    prisma.balSvar.findMany({ where: { brukerId: meg.id } }),
  ]);

  const eksport = {
    eksportertAt: new Date().toISOString(),
    profil: {
      navn: meg.name,
      brukernavn: meg.username,
      epost: meg.email,
      bio: meg.bio,
      kommune: meg.kommune,
      fodselsdato: meg.fodselsdato,
      opprettetAt: meg.createdAt,
      innstillinger: {
        standardSynlighet: meg.standardSynlighet,
        standardFeedback: meg.standardFeedback,
        bursdagSynlighet: meg.bursdagSynlighet,
        ukesbrev: meg.ukesbrev,
      },
    },
    innlegg,
    kommentarer,
    fyrstikker,
    vennskap,
    grendMedlemskap,
    stoveFolginger,
    stevner,
    stevneSvar,
    meldinger,
    varsler,
    dugnadspoeng,
    merker,
    balsvar,
  };

  return new NextResponse(JSON.stringify(eksport, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="heimet-eksport-${meg.username}.json"`,
    },
  });
}
