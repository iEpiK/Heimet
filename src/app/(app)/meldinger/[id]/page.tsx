import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { Avatar } from "@/components/ui/Avatar";
import { Kort } from "@/components/ui/Kort";
import { SamtaleVindu } from "@/components/meldinger/SamtaleVindu";
import { ForlatSamtaleKnapp } from "@/components/meldinger/ForlatSamtaleKnapp";

export const metadata = { title: "Samtale" };

export default async function SamtaleSide({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meg = await krevBruker();

  const samtale = await prisma.samtale.findUnique({
    where: { id },
    include: {
      medlemmer: {
        include: { bruker: { select: { id: true, name: true, username: true, image: true } } },
      },
      meldinger: {
        orderBy: { opprettetAt: "asc" },
        take: 200,
        include: { avsender: { select: { id: true, name: true, username: true, image: true } } },
      },
    },
  });
  if (!samtale || !samtale.medlemmer.some((m) => m.brukerId === meg.id)) notFound();

  const andre = samtale.medlemmer.filter((m) => m.brukerId !== meg.id);
  const tittel = samtale.erGruppe
    ? (samtale.navn ?? "Gruppesamtale")
    : (andre[0]?.bruker.name ?? "Slettet bruker");

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-xl flex-col heim-inn">
      <Kort className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <header className="flex items-center gap-3 border-b border-kant px-4 py-3">
          <Link href="/meldinger" className="text-dus hover:text-tekst" title="Tilbake">
            ←
          </Link>
          {samtale.erGruppe ? (
            <span className="flex size-8 items-center justify-center rounded-full bg-primar/15">👥</span>
          ) : (
            <Avatar bilde={andre[0]?.bruker.image} navn={tittel} storrelse="sm" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">{tittel}</h1>
            {samtale.erGruppe && (
              <p className="truncate text-xs text-dus">
                {samtale.medlemmer.map((m) => m.bruker.name.split(" ")[0]).join(", ")}
              </p>
            )}
          </div>
          {samtale.erGruppe && <ForlatSamtaleKnapp samtaleId={samtale.id} />}
        </header>
        <SamtaleVindu
          samtaleId={samtale.id}
          megId={meg.id}
          erGruppe={samtale.erGruppe}
          meldinger={samtale.meldinger.map((m) => ({
            id: m.id,
            innhold: m.innhold,
            opprettetAt: m.opprettetAt.toISOString(),
            avsender: m.avsender,
          }))}
        />
      </Kort>
    </div>
  );
}
