import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { hentVennIder } from "@/lib/venner";
import { innleggInclude, kanGiFeedbackSync } from "@/lib/innlegg";
import { Kort } from "@/components/ui/Kort";
import { Merkelapp } from "@/components/ui/Merkelapp";
import { Avatar } from "@/components/ui/Avatar";
import { FolgKnapp } from "@/components/stove/FolgKnapp";
import { RedaktorAdmin } from "@/components/stove/RedaktorAdmin";
import { InnleggKort } from "@/components/innlegg/InnleggKort";
import { InnleggSkjema } from "@/components/innlegg/InnleggSkjema";

export default async function StoveSide({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meg = await krevBruker();

  const stove = await prisma.stove.findUnique({
    where: { slug },
    include: {
      _count: { select: { folgere: true } },
      roller: {
        include: { bruker: { select: { id: true, name: true, username: true, image: true } } },
      },
    },
  });
  if (!stove) notFound();

  const minRolle = stove.roller.find((r) => r.brukerId === meg.id);
  const folger = !!(await prisma.stoveFolging.findUnique({
    where: { stoveId_brukerId: { stoveId: stove.id, brukerId: meg.id } },
  }));

  const innleggene = await prisma.innlegg.findMany({
    where: { stoveId: stove.id, forfatter: { slettesAt: null } },
    include: innleggInclude(meg.id),
    orderBy: { opprettetAt: "desc" },
    take: 30,
  });
  const mineVenner = new Set(await hentVennIder(meg.id));

  const kommendeStevner = await prisma.stevne.findMany({
    where: { stoveId: stove.id, start: { gte: new Date() } },
    orderBy: { start: "asc" },
    take: 5,
  });

  return (
    <div className="space-y-4 heim-inn">
      <Kort className="overflow-hidden">
        <div
          className="h-36 bg-aksent/15 bg-cover bg-center"
          style={stove.coverbilde ? { backgroundImage: `url(${stove.coverbilde})` } : undefined}
        />
        <div className="flex flex-wrap items-start justify-between gap-3 p-6">
          <div>
            <h1 className="text-2xl font-semibold">🪵 {stove.navn}</h1>
            <div className="mt-1 flex flex-wrap gap-2">
              <Merkelapp>{stove.kategori}</Merkelapp>
              <Merkelapp>👥 {stove._count.folgere} følgere</Merkelapp>
            </div>
            {stove.beskrivelse && (
              <p className="mt-3 max-w-lg text-sm text-dus">{stove.beskrivelse}</p>
            )}
          </div>
          <FolgKnapp stoveId={stove.id} folger={folger} />
        </div>
      </Kort>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {minRolle && (
            <InnleggSkjema
              standardSynlighet="OFFENTLIG"
              standardFeedback={meg.standardFeedback}
              stoveId={stove.id}
              plassholder={`Del noe fra ${stove.navn}…`}
            />
          )}
          {innleggene.map((i) => (
            <InnleggKort
              key={i.id}
              innlegg={i}
              megId={meg.id}
              megRolle={meg.rolle}
              kanReagere={kanGiFeedbackSync(i, meg.id, mineVenner)}
              visKontekst={false}
            />
          ))}
          {innleggene.length === 0 && (
            <p className="py-4 text-center text-sm text-dus">Ingen innlegg fra stova ennå.</p>
          )}
        </div>

        <aside className="space-y-4">
          <Kort className="p-5">
            <h2 className="font-semibold">Folka bak</h2>
            <ul className="mt-3 space-y-2">
              {stove.roller.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/profil/${r.bruker.username}`}
                    className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-flate-dyp transition-colors"
                  >
                    <Avatar bilde={r.bruker.image} navn={r.bruker.name} storrelse="sm" />
                    <span className="text-sm">{r.bruker.name}</span>
                    <span className="ml-auto text-xs text-dus">
                      {r.rolle === "ADMIN" ? "👑" : "✏️"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {minRolle?.rolle === "ADMIN" && (
              <div className="mt-3">
                <RedaktorAdmin stoveId={stove.id} roller={stove.roller.map((r) => ({ id: r.id, navn: r.bruker.name, rolle: r.rolle }))} />
              </div>
            )}
          </Kort>

          {kommendeStevner.length > 0 && (
            <Kort className="p-5">
              <h2 className="font-semibold">📅 Stevner</h2>
              <ul className="mt-3 space-y-2">
                {kommendeStevner.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/stevner/${s.id}`}
                      className="block rounded-lg p-1.5 text-sm hover:bg-flate-dyp transition-colors"
                    >
                      {s.tittel}
                      <span className="block text-xs text-dus">
                        {s.start.toLocaleDateString("nb-NO", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Kort>
          )}
        </aside>
      </div>
    </div>
  );
}
