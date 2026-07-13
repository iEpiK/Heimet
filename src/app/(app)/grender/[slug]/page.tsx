import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { hentVennIder } from "@/lib/venner";
import { hentUkasBal } from "@/lib/bal";
import { innleggInclude, kanGiFeedbackSync } from "@/lib/innlegg";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";
import { Merkelapp } from "@/components/ui/Merkelapp";
import { GrendMedlemKnapp } from "@/components/grend/GrendMedlemKnapp";
import { BalPanel } from "@/components/grend/BalPanel";
import { InnleggKort } from "@/components/innlegg/InnleggKort";
import { InnleggSkjema } from "@/components/innlegg/InnleggSkjema";

export default async function GrendSide({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meg = await krevBruker();

  const grend = await prisma.grend.findUnique({
    where: { slug },
    include: {
      _count: { select: { medlemmer: { where: { status: "GODKJENT" } } } },
    },
  });
  if (!grend) notFound();

  const medlemskap = await prisma.grendMedlemskap.findUnique({
    where: { grendId_brukerId: { grendId: grend.id, brukerId: meg.id } },
  });
  const erMedlem = medlemskap?.status === "GODKJENT";
  const erStyrer = erMedlem && medlemskap!.rolle !== "MEDLEM";

  // Skjulte grender er usynlige for ikke-medlemmer
  if (grend.type === "SKJULT" && !erMedlem) notFound();

  const kanSeInnhold = erMedlem || grend.type === "AAPEN";

  const innleggene = kanSeInnhold
    ? await prisma.innlegg.findMany({
        where: {
          grendId: grend.id,
          ...(erMedlem ? {} : { synlighet: "OFFENTLIG" }),
          forfatter: { slettesAt: null },
        },
        include: innleggInclude(meg.id),
        orderBy: { opprettetAt: "desc" },
        take: 30,
      })
    : [];

  const bal = kanSeInnhold ? await hentUkasBal(grend.id) : null;
  const mineVenner = new Set(await hentVennIder(meg.id));

  const kommendeStevner = kanSeInnhold
    ? await prisma.stevne.findMany({
        where: { grendId: grend.id, start: { gte: new Date() } },
        orderBy: { start: "asc" },
        take: 5,
      })
    : [];

  return (
    <div className="space-y-4 heim-inn">
      <Kort className="overflow-hidden">
        <div
          className="h-36 bg-primar/15 bg-cover bg-center"
          style={grend.coverbilde ? { backgroundImage: `url(${grend.coverbilde})` } : undefined}
        />
        <div className="flex flex-wrap items-start justify-between gap-3 p-6">
          <div>
            <h1 className="text-2xl font-semibold">🏘️ {grend.navn}</h1>
            <div className="mt-1 flex flex-wrap gap-2">
              <Merkelapp>
                {grend.type === "AAPEN" ? "Åpen grend" : grend.type === "LUKKET" ? "Lukket grend" : "Skjult grend"}
              </Merkelapp>
              <Merkelapp>👥 {grend._count.medlemmer} medlemmer</Merkelapp>
              {grend.kommune && <Merkelapp>📍 {grend.kommune}</Merkelapp>}
            </div>
            {grend.beskrivelse && (
              <p className="mt-3 max-w-lg text-sm text-dus">{grend.beskrivelse}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <GrendMedlemKnapp
              grendId={grend.id}
              status={medlemskap ? medlemskap.status : "ikke_medlem"}
            />
            {erStyrer && (
              <Link href={`/grender/${slug}/medlemmer`}>
                <Knapp variant="flat">⚙️ Administrer</Knapp>
              </Link>
            )}
          </div>
        </div>
      </Kort>

      {!kanSeInnhold ? (
        <Kort className="p-8 text-center">
          <div className="text-4xl">🚪</div>
          <p className="mt-3 text-sm text-dus">
            Dette er en lukket grend — be om medlemskap for å se innholdet.
          </p>
        </Kort>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            {bal && <BalPanel bal={bal} megId={meg.id} erMedlem={erMedlem} />}
            {erMedlem && (
              <InnleggSkjema
                standardSynlighet="GREND"
                standardFeedback={meg.standardFeedback}
                grendId={grend.id}
                grendErAapen={grend.type === "AAPEN"}
                plassholder={`Del noe med ${grend.navn}…`}
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
              <p className="py-4 text-center text-sm text-dus">Ingen innlegg i grenda ennå.</p>
            )}
          </div>
          <aside className="space-y-4">
            <Kort className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">📅 Stevner</h2>
                {erMedlem && (
                  <Link
                    href={`/stevner/nytt?grend=${grend.id}`}
                    className="text-xs text-primar hover:underline"
                  >
                    + Nytt
                  </Link>
                )}
              </div>
              {kommendeStevner.length === 0 ? (
                <p className="mt-3 text-sm text-dus">Ingen planlagte stevner.</p>
              ) : (
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
              )}
            </Kort>
          </aside>
        </div>
      )}
    </div>
  );
}
