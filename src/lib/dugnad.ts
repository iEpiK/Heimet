import { prisma } from "./prisma";
import { opprettVarsel } from "./varsler";

// Dugnadsånd: poeng for bidrag til fellesskapet — aldri for likes eller følgere.
export const HANDLINGER = {
  svarte_bal: { poeng: 5, tekst: "Svarte rundt bålet" },
  arrangerte_stevne: { poeng: 20, tekst: "Arrangerte et stevne" },
  opprettet_grend: { poeng: 25, tekst: "Startet en grend" },
  kom_pa_stevne: { poeng: 5, tekst: "Meldte seg på et stevne" },
} as const;

export type DugnadHandling = keyof typeof HANDLINGER;

const MERKER: { type: string; navn: string; sjekk: (opts: { handling: DugnadHandling; total: number; antallAvHandling: number }) => boolean }[] = [
  { type: "baltenner", navn: "Båltenner", sjekk: (o) => o.handling === "svarte_bal" && o.antallAvHandling === 1 },
  { type: "vertskap", navn: "Vertskap", sjekk: (o) => o.handling === "arrangerte_stevne" && o.antallAvHandling === 1 },
  { type: "grunnlegger", navn: "Grunnlegger", sjekk: (o) => o.handling === "opprettet_grend" && o.antallAvHandling === 1 },
  { type: "ildsjel", navn: "Ildsjel", sjekk: (o) => o.total >= 100 },
];

export const MERKE_NAVN: Record<string, { navn: string; forklaring: string }> = {
  baltenner: { navn: "Båltenner", forklaring: "Svarte på sitt første Ukas bål" },
  vertskap: { navn: "Vertskap", forklaring: "Arrangerte sitt første stevne" },
  grunnlegger: { navn: "Grunnlegger", forklaring: "Startet en grend" },
  ildsjel: { navn: "Ildsjel", forklaring: "Over 100 dugnadspoeng" },
};

/** Gi dugnadspoeng og del ut merker når terskler nås. Feiler aldri kallstedet. */
export async function giDugnadspoeng(
  brukerId: string,
  handling: DugnadHandling,
  ref?: { refType: string; refId: string }
) {
  try {
    await prisma.dugnadspoeng.create({
      data: {
        brukerId,
        handling,
        poeng: HANDLINGER[handling].poeng,
        refType: ref?.refType,
        refId: ref?.refId,
      },
    });

    const [sum, antall] = await Promise.all([
      prisma.dugnadspoeng.aggregate({ where: { brukerId }, _sum: { poeng: true } }),
      prisma.dugnadspoeng.count({ where: { brukerId, handling } }),
    ]);
    const total = sum._sum.poeng ?? 0;

    for (const merke of MERKER) {
      if (merke.sjekk({ handling, total, antallAvHandling: antall })) {
        const eksisterende = await prisma.merke.findUnique({
          where: { brukerId_type: { brukerId, type: merke.type } },
        });
        if (!eksisterende) {
          await prisma.merke.create({ data: { brukerId, type: merke.type } });
          await opprettVarsel({
            mottakerId: brukerId,
            type: "merke",
            tekst: merke.navn,
          });
        }
      }
    }
  } catch (feil) {
    console.error("dugnadspoeng feilet:", feil);
  }
}

export async function hentDugnadssum(brukerId: string) {
  const sum = await prisma.dugnadspoeng.aggregate({
    where: { brukerId },
    _sum: { poeng: true },
  });
  return sum._sum.poeng ?? 0;
}
