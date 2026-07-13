import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { hentVennIder } from "@/lib/venner";
import { sendEpost, epostRamme } from "@/lib/epost";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Ukesbrevet — kjøres ukentlig av en cron-jobb:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://…/api/cron/ukesbrev
 * Sender en oppsummering til alle som har takket ja (opt-in).
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse(null, { status: 401 });
  }

  const enUkeSiden = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const omEnUke = new Date(Date.now() + 7 * 24 * 3600 * 1000);

  const mottakere = await prisma.user.findMany({
    where: { ukesbrev: true, emailVerified: true, slettesAt: null },
  });

  let sendt = 0;
  for (const bruker of mottakere) {
    try {
      const vennIder = await hentVennIder(bruker.id);
      const grendIder = (
        await prisma.grendMedlemskap.findMany({
          where: { brukerId: bruker.id, status: "GODKJENT" },
          select: { grendId: true },
        })
      ).map((g) => g.grendId);

      const [nyeInnleggVenner, nyeInnleggGrender, kommendeStevner, venner] =
        await Promise.all([
          prisma.innlegg.count({
            where: { forfatterId: { in: vennIder }, opprettetAt: { gte: enUkeSiden } },
          }),
          prisma.innlegg.count({
            where: { grendId: { in: grendIder }, opprettetAt: { gte: enUkeSiden } },
          }),
          prisma.stevne.findMany({
            where: {
              start: { gte: new Date(), lte: omEnUke },
              OR: [
                { grendId: { in: grendIder } },
                { svar: { some: { brukerId: bruker.id } } },
              ],
            },
            orderBy: { start: "asc" },
            take: 5,
          }),
          prisma.user.findMany({
            where: {
              id: { in: vennIder },
              fodselsdato: { not: null },
              bursdagSynlighet: { not: "SKJULT" },
            },
            select: { name: true, fodselsdato: true },
          }),
        ]);

      const naa = new Date();
      const bursdager = venner.filter((v) => {
        const f = v.fodselsdato!;
        const neste = new Date(naa.getFullYear(), f.getUTCMonth(), f.getUTCDate());
        return neste >= naa && neste <= omEnUke;
      });

      // Hopp over helt stille uker
      if (
        nyeInnleggVenner + nyeInnleggGrender === 0 &&
        kommendeStevner.length === 0 &&
        bursdager.length === 0
      ) {
        continue;
      }

      const linjer = [
        nyeInnleggVenner > 0 && `🤝 ${nyeInnleggVenner} nye innlegg fra vennene dine`,
        nyeInnleggGrender > 0 && `🏘️ ${nyeInnleggGrender} nye innlegg i grendene dine`,
        ...kommendeStevner.map(
          (s) => `📅 ${s.tittel} — ${format(s.start, "EEEE d. MMM", { locale: nb })}`
        ),
        ...bursdager.map((b) => `🎂 ${b.name} har bursdag denne uka!`),
      ].filter(Boolean) as string[];

      await sendEpost({
        til: bruker.email,
        emne: "Ukesbrevet fra Heimet 🏔️",
        tekst: `Hei ${bruker.name}!\n\nDette skjedde på Heimet denne uka:\n\n${linjer.join("\n")}\n\nKom heim og se: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/tunet`,
        html: epostRamme(
          "Uka på Heimet",
          `<p>Hei ${bruker.name}!</p>
           <ul style="padding-left:18px;line-height:1.8;">${linjer.map((l) => `<li>${l}</li>`).join("")}</ul>
           <p style="text-align:center;margin:24px 0;"><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/tunet" style="background:#1f3d2b;color:#fffdf8;padding:12px 24px;border-radius:8px;text-decoration:none;">Kom heim 🏡</a></p>
           <p style="font-size:12px;color:#8a8171;">Du får denne fordi du har skrudd på ukesbrevet. Skru av under Innstillinger → Personvern.</p>`
        ),
      });
      sendt++;
    } catch (feil) {
      console.error(`ukesbrev til ${bruker.id} feilet:`, feil);
    }
  }

  return NextResponse.json({ mottakere: mottakere.length, sendt });
}
