import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GDPR: permanent sletting av kontoer der angrefristen (30 dager) er ute.
 * Kjøres daglig av en cron-jobb med Authorization: Bearer $CRON_SECRET.
 * Prisma-skjemaets onDelete: Cascade rydder alt brukeren eier.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse(null, { status: 401 });
  }

  const resultat = await prisma.user.deleteMany({
    where: { slettesAt: { not: null, lte: new Date() } },
  });

  return NextResponse.json({ slettet: resultat.count });
}
