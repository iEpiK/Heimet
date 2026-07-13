import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { RedigerSkjema } from "@/components/innlegg/RedigerSkjema";

export const metadata = { title: "Rediger innlegg" };

export default async function RedigerInnleggSide({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meg = await krevBruker();
  const innlegg = await prisma.innlegg.findUnique({ where: { id } });
  if (!innlegg || innlegg.forfatterId !== meg.id) notFound();

  return (
    <div className="mx-auto max-w-xl heim-inn">
      <RedigerSkjema innleggId={id} innhold={innlegg.innhold} />
    </div>
  );
}
