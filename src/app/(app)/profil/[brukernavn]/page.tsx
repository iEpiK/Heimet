import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { hentVennskapStatus, hentVennIder, erVenner } from "@/lib/venner";
import { innleggInclude, synligForWhere, kanGiFeedbackSync } from "@/lib/innlegg";
import { hentDugnadssum, MERKE_NAVN } from "@/lib/dugnad";
import { InnleggKort } from "@/components/innlegg/InnleggKort";
import { InnleggSkjema } from "@/components/innlegg/InnleggSkjema";
import { Avatar } from "@/components/ui/Avatar";
import { Kort } from "@/components/ui/Kort";
import { Merkelapp } from "@/components/ui/Merkelapp";
import { Knapp } from "@/components/ui/Knapp";
import { VennKnapp } from "@/components/profil/VennKnapp";
import { MeldingKnapp } from "@/components/profil/MeldingKnapp";

export default async function ProfilSide({
  params,
}: {
  params: Promise<{ brukernavn: string }>;
}) {
  const { brukernavn } = await params;
  const meg = await krevBruker();

  const bruker = await prisma.user.findUnique({
    where: { username: decodeURIComponent(brukernavn).toLowerCase() },
  });
  if (!bruker || bruker.slettesAt) notFound();

  const erMeg = bruker.id === meg.id;
  const status = erMeg ? null : await hentVennskapStatus(meg.id, bruker.id);
  if (status === "blokkert") notFound(); // den andre har blokkert meg

  const vennskapId =
    status === "mottatt"
      ? (
          await prisma.vennskap.findUnique({
            where: { fraId_tilId: { fraId: bruker.id, tilId: meg.id } },
          })
        )?.id
      : undefined;

  const vennIder = await hentVennIder(bruker.id);
  const erVennerViOgsa = erMeg || status === "venner";

  const venner = erVennerViOgsa
    ? await prisma.user.findMany({
        where: { id: { in: vennIder }, slettesAt: null },
        take: 12,
        select: { id: true, name: true, username: true, image: true },
      })
    : [];

  const visBursdag =
    bruker.fodselsdato &&
    (erMeg ||
      bruker.bursdagSynlighet === "ALLE" ||
      (bruker.bursdagSynlighet === "VENNER" && (await erVenner(meg.id, bruker.id))));

  const [merker, dugnadssum] = await Promise.all([
    prisma.merke.findMany({
      where: { brukerId: bruker.id },
      orderBy: { tildeltAt: "asc" },
    }),
    hentDugnadssum(bruker.id),
  ]);

  const innleggene = await prisma.innlegg.findMany({
    where: {
      AND: [{ forfatterId: bruker.id, stoveId: null }, await synligForWhere(meg.id)],
    },
    include: innleggInclude(meg.id),
    orderBy: { opprettetAt: "desc" },
    take: 30,
  });
  const mineVenner = new Set(await hentVennIder(meg.id));

  return (
    <div className="mx-auto max-w-3xl space-y-4 heim-inn">
      <Kort className="overflow-hidden">
        <div
          className="h-40 bg-primar/20 bg-cover bg-center"
          style={bruker.coverbilde ? { backgroundImage: `url(${bruker.coverbilde})` } : undefined}
        />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end justify-between gap-4">
            <Avatar bilde={bruker.image} navn={bruker.name} storrelse="xl" className="ring-4 ring-flate" />
            <div className="pb-2">
              {erMeg ? (
                <Link href="/innstillinger/profil">
                  <Knapp variant="sekundar">Rediger profil</Knapp>
                </Link>
              ) : (
                status && (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {status !== "blokkert_av_meg" && (
                      <MeldingKnapp brukernavn={bruker.username ?? ""} />
                    )}
                    <VennKnapp andreId={bruker.id} status={status} vennskapId={vennskapId} />
                  </div>
                )
              )}
            </div>
          </div>
          <h1 className="mt-3 text-2xl font-semibold">{bruker.name}</h1>
          <p className="text-sm text-dus">@{bruker.username}</p>
          {bruker.bio && <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{bruker.bio}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {bruker.kommune && <Merkelapp>📍 {bruker.kommune}</Merkelapp>}
            {visBursdag && bruker.fodselsdato && (
              <Merkelapp>🎂 {format(bruker.fodselsdato, "d. MMMM", { locale: nb })}</Merkelapp>
            )}
            <Merkelapp>
              🏡 Med siden {format(bruker.createdAt, "MMMM yyyy", { locale: nb })}
            </Merkelapp>
            <Merkelapp>🤝 {vennIder.length} venner</Merkelapp>
            {dugnadssum > 0 && (
              <Merkelapp title="Dugnadspoeng — for bidrag til fellesskapet">
                🔨 {dugnadssum} dugnadspoeng
              </Merkelapp>
            )}
          </div>
          {merker.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {merker.map((m) => (
                <Merkelapp
                  key={m.id}
                  className="border-gull/50 text-gull"
                  title={MERKE_NAVN[m.type]?.forklaring}
                >
                  🏅 {MERKE_NAVN[m.type]?.navn ?? m.type}
                </Merkelapp>
              ))}
            </div>
          )}
        </div>
      </Kort>

      {erVennerViOgsa && venner.length > 0 && (
        <Kort className="p-6">
          <h2 className="text-lg font-semibold">Venner</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {venner.map((v) => (
              <Link
                key={v.id}
                href={`/profil/${v.username}`}
                className="flex items-center gap-2 rounded-lg p-2 hover:bg-flate-dyp transition-colors"
              >
                <Avatar bilde={v.image} navn={v.name} storrelse="sm" />
                <span className="truncate text-sm">{v.name}</span>
              </Link>
            ))}
          </div>
        </Kort>
      )}

      {erMeg && (
        <InnleggSkjema
          standardSynlighet={meg.standardSynlighet}
          standardFeedback={meg.standardFeedback}
        />
      )}

      {innleggene.length > 0 ? (
        <div className="space-y-4">
          {innleggene.map((i) => (
            <InnleggKort
              key={i.id}
              innlegg={i}
              megId={meg.id}
              megRolle={meg.rolle}
              kanReagere={kanGiFeedbackSync(i, meg.id, mineVenner)}
            />
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-dus">
          {erMeg ? "Du har ikke delt noe ennå." : "Ingen innlegg å vise."}
        </p>
      )}
    </div>
  );
}
