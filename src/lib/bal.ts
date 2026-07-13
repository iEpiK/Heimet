import { getISOWeek, getISOWeekYear } from "date-fns";
import { prisma } from "./prisma";

// Spørsmålsbank for Ukas bål — lavterskel samtalestartere rundt bålet.
const SPORSMAL = [
  "Hva er det beste turmålet i nærheten av deg?",
  "Hvilken norsk matrett kunne du spist hver dag?",
  "Hva er ditt beste hyttetriks?",
  "Kvikk Lunsj eller melkesjokolade på tur?",
  "Hva er den fineste årstiden der du bor — og hvorfor?",
  "Hvilket sted i Norge vil du anbefale alle å besøke?",
  "Hva er ditt beste minne fra en 17. mai?",
  "Fjell eller fjord — og hvorfor?",
  "Hva er den beste boka du har lest i det siste?",
  "Hvilken lokal tradisjon burde flere kjenne til?",
  "Hva gleder du deg mest til denne måneden?",
  "Hva er ditt beste råd for mørketida?",
  "Hvilken ferdighet skulle du ønske du lærte som barn?",
  "Hva er den beste konserten eller festivalen du har vært på?",
  "Brunost på vaffel — ja eller nei? Begrunn svaret!",
  "Hva er det hyggeligste noen har gjort for deg i det siste?",
  "Hvis grenda vår skulle hatt en dugnad, hva burde vi fikse først?",
  "Hva er din beste sopp- eller bærplass? (Du må ikke røpe den!)",
  "Hvilket norsk ord eller uttrykk er ditt favorittord?",
  "Sommerferie i Norge eller utlandet — hva velger du?",
  "Hva er ditt beste sparetips i hverdagen?",
  "Hvem i grenda fortjener en ekstra takk denne uka?",
  "Hva er den rareste væromslaget du har opplevd?",
  "Påske på fjellet eller påske i hagen?",
  "Hva ville du gjort med en helt fri lørdag uten planer?",
  "Hvilken TV-serie har du sett på repeat?",
] as const;

function velgSporsmal(grendId: string, ar: number, uke: number) {
  // Deterministisk, men ulikt per grend og uke
  let hash = 0;
  const nokkel = `${grendId}-${ar}-${uke}`;
  for (let i = 0; i < nokkel.length; i++) {
    hash = (hash * 31 + nokkel.charCodeAt(i)) >>> 0;
  }
  return SPORSMAL[hash % SPORSMAL.length];
}

/** Henter (eller tenner) ukas bål for grenda. */
export async function hentUkasBal(grendId: string) {
  const naa = new Date();
  const uke = getISOWeek(naa);
  const ar = getISOWeekYear(naa);

  return prisma.ukasBal.upsert({
    where: { grendId_ar_uke: { grendId, ar, uke } },
    create: { grendId, ar, uke, sporsmal: velgSporsmal(grendId, ar, uke) },
    update: {},
    include: {
      svar: {
        orderBy: { opprettetAt: "asc" },
        include: {
          bruker: { select: { id: true, name: true, username: true, image: true } },
        },
      },
    },
  });
}
