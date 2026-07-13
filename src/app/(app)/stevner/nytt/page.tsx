import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { StevneSkjema } from "@/components/stevne/StevneSkjema";

export const metadata = { title: "Nytt stevne" };

export default async function NyttStevneSide({
  searchParams,
}: {
  searchParams: Promise<{ grend?: string; stove?: string }>;
}) {
  const meg = await krevBruker();
  const { grend: grendId, stove: stoveId } = await searchParams;

  const grend = grendId
    ? await prisma.grend.findUnique({ where: { id: grendId }, select: { id: true, navn: true, type: true } })
    : null;
  const stove = stoveId
    ? await prisma.stove.findUnique({ where: { id: stoveId }, select: { id: true, navn: true } })
    : null;

  return (
    <div className="mx-auto max-w-xl heim-inn">
      <StevneSkjema
        grend={grend}
        stove={stove}
        standardSynlighet={meg.standardSynlighet === "OFFENTLIG" ? "OFFENTLIG" : "VENNER"}
      />
    </div>
  );
}
