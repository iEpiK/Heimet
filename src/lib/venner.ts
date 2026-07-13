import { prisma } from "./prisma";

/** Er a og b venner (godtatt vennskap i en av retningene)? */
export async function erVenner(aId: string, bId: string) {
  if (aId === bId) return false;
  const vennskap = await prisma.vennskap.findFirst({
    where: {
      status: "GODTATT",
      OR: [
        { fraId: aId, tilId: bId },
        { fraId: bId, tilId: aId },
      ],
    },
    select: { id: true },
  });
  return !!vennskap;
}

/** Finnes det en blokkering i en av retningene? */
export async function erBlokkert(aId: string, bId: string) {
  const blokkering = await prisma.blokkering.findFirst({
    where: {
      OR: [
        { blokkererId: aId, blokkertId: bId },
        { blokkererId: bId, blokkertId: aId },
      ],
    },
    select: { id: true },
  });
  return !!blokkering;
}

export type VennskapStatus =
  | "ingen"
  | "venner"
  | "sendt"     // jeg har sendt forespørsel
  | "mottatt"   // jeg har mottatt forespørsel
  | "blokkert_av_meg"
  | "blokkert";

/** Relasjonen mellom meg og en annen bruker, sett fra meg. */
export async function hentVennskapStatus(megId: string, andreId: string): Promise<VennskapStatus> {
  const [blokkering, vennskap] = await Promise.all([
    prisma.blokkering.findFirst({
      where: {
        OR: [
          { blokkererId: megId, blokkertId: andreId },
          { blokkererId: andreId, blokkertId: megId },
        ],
      },
    }),
    prisma.vennskap.findFirst({
      where: {
        OR: [
          { fraId: megId, tilId: andreId },
          { fraId: andreId, tilId: megId },
        ],
      },
    }),
  ]);
  if (blokkering) {
    return blokkering.blokkererId === megId ? "blokkert_av_meg" : "blokkert";
  }
  if (!vennskap) return "ingen";
  if (vennskap.status === "GODTATT") return "venner";
  return vennskap.fraId === megId ? "sendt" : "mottatt";
}

/** Id-ene til alle vennene til en bruker. */
export async function hentVennIder(brukerId: string): Promise<string[]> {
  const vennskap = await prisma.vennskap.findMany({
    where: {
      status: "GODTATT",
      OR: [{ fraId: brukerId }, { tilId: brukerId }],
    },
    select: { fraId: true, tilId: true },
  });
  return vennskap.map((v) => (v.fraId === brukerId ? v.tilId : v.fraId));
}
