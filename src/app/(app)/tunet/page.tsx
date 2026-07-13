import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { hentVennIder } from "@/lib/venner";
import { innleggInclude, synligForWhere, kanGiFeedbackSync } from "@/lib/innlegg";
import { hentSesong } from "@/lib/aarshjul";
import { InnleggKort } from "@/components/innlegg/InnleggKort";
import { InnleggSkjema } from "@/components/innlegg/InnleggSkjema";
import { Kort } from "@/components/ui/Kort";
import { Avatar } from "@/components/ui/Avatar";

export const metadata = { title: "Tunet" };

const SIDESTORRELSE = 20;

const filtre = [
  { id: "alt", tekst: "Alt" },
  { id: "venner", tekst: "Venner" },
  { id: "grender", tekst: "Grender" },
] as const;

export default async function TunetSide({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; til?: string }>;
}) {
  const meg = await krevBruker();
  const { filter = "alt", til } = await searchParams;

  const vennIder = await hentVennIder(meg.id);
  const mineVenner = new Set(vennIder);
  const synlig = await synligForWhere(meg.id);

  const filterWhere =
    filter === "venner"
      ? { grendId: null, stoveId: null, forfatterId: { in: [...vennIder, meg.id] } }
      : filter === "grender"
        ? { grendId: { not: null } }
        : {};

  const innleggene = await prisma.innlegg.findMany({
    where: {
      AND: [
        synlig,
        filterWhere,
        ...(til ? [{ opprettetAt: { lt: new Date(Number(til)) } }] : []),
      ],
    },
    include: innleggInclude(meg.id),
    orderBy: { opprettetAt: "desc" },
    take: SIDESTORRELSE + 1,
  });
  const harFlere = innleggene.length > SIDESTORRELSE;
  const side = innleggene.slice(0, SIDESTORRELSE);

  // Bursdager i dag: venner med synlig bursdag
  const naa = new Date();
  const venner = await prisma.user.findMany({
    where: {
      id: { in: vennIder },
      slettesAt: null,
      fodselsdato: { not: null },
      bursdagSynlighet: { not: "SKJULT" },
    },
    select: { id: true, name: true, username: true, image: true, fodselsdato: true },
  });
  const bursdagsbarn = venner.filter(
    (v) =>
      v.fodselsdato &&
      v.fodselsdato.getUTCDate() === naa.getDate() &&
      v.fodselsdato.getUTCMonth() === naa.getMonth()
  );

  // Kommende stevner (neste 5 jeg kan se)
  const mineGrender = await prisma.grendMedlemskap.findMany({
    where: { brukerId: meg.id, status: "GODKJENT" },
    select: { grendId: true },
  });
  const stevner = await prisma.stevne.findMany({
    where: {
      start: { gte: naa },
      OR: [
        { synlighet: "OFFENTLIG" },
        { grendId: { in: mineGrender.map((g) => g.grendId) } },
        { synlighet: "VENNER", arrangorId: { in: [...vennIder, meg.id] } },
        { svar: { some: { brukerId: meg.id } } },
      ],
    },
    orderBy: { start: "asc" },
    take: 5,
    include: { grend: { select: { navn: true } } },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="mx-auto w-full max-w-xl space-y-4">
        {(() => {
          const sesong = hentSesong();
          return (
            <div className="flex items-center gap-3 rounded-xl border border-kant bg-gradient-to-r from-primar/10 to-transparent px-4 py-3">
              <span className="text-2xl" aria-hidden>
                {sesong.emoji}
              </span>
              <div>
                <p className="text-sm font-semibold">{sesong.navn}</p>
                <p className="text-xs text-dus">{sesong.hilsen}</p>
              </div>
            </div>
          );
        })()}
        <InnleggSkjema
          standardSynlighet={meg.standardSynlighet}
          standardFeedback={meg.standardFeedback}
        />

        <div className="flex items-center gap-1">
          {filtre.map((f) => (
            <Link
              key={f.id}
              href={f.id === "alt" ? "/tunet" : `/tunet?filter=${f.id}`}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                filter === f.id
                  ? "bg-primar text-pa-primar"
                  : "text-dus hover:bg-flate-dyp hover:text-tekst"
              }`}
            >
              {f.tekst}
            </Link>
          ))}
          <span className="ml-auto text-xs text-dus" title="Ingen algoritme — nyeste øverst">
            🕰️ kronologisk
          </span>
        </div>

        {side.length === 0 ? (
          <Kort className="p-8 text-center">
            <div className="text-4xl">🌲</div>
            <p className="mt-3 text-sm text-dus">
              Stille på tunet. Finn{" "}
              <Link href="/sok" className="text-primar hover:underline">
                venner
              </Link>{" "}
              eller en{" "}
              <Link href="/grender" className="text-primar hover:underline">
                grend
              </Link>{" "}
              — eller del noe selv!
            </p>
          </Kort>
        ) : (
          side.map((i) => (
            <InnleggKort
              key={i.id}
              innlegg={i}
              megId={meg.id}
              megRolle={meg.rolle}
              kanReagere={kanGiFeedbackSync(i, meg.id, mineVenner)}
            />
          ))
        )}

        {harFlere && (
          <div className="text-center">
            <Link
              href={`/tunet?${new URLSearchParams({
                ...(filter !== "alt" && { filter }),
                til: String(side[side.length - 1].opprettetAt.getTime()),
              })}`}
              className="inline-block rounded-lg border border-kant bg-flate px-4 py-2 text-sm text-dus hover:text-primar hover:border-primar transition-colors"
            >
              Eldre innlegg ↓
            </Link>
          </div>
        )}
      </div>

      <aside className="hidden space-y-4 lg:block">
        {bursdagsbarn.length > 0 && (
          <Kort className="p-5">
            <h2 className="font-semibold">🎂 Bursdager i dag</h2>
            <ul className="mt-3 space-y-2">
              {bursdagsbarn.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/profil/${v.username}`}
                    className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-flate-dyp transition-colors"
                  >
                    <Avatar bilde={v.image} navn={v.name} storrelse="sm" />
                    <span className="text-sm">{v.name}</span>
                    <span className="ml-auto">🎉</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Kort>
        )}

        <Kort className="p-5">
          <h2 className="font-semibold">📅 Kommende stevner</h2>
          {stevner.length === 0 ? (
            <p className="mt-3 text-sm text-dus">
              Ingen stevner på kalenderen.{" "}
              <Link href="/stevner/nytt" className="text-primar hover:underline">
                Arranger et!
              </Link>
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {stevner.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/stevner/${s.id}`}
                    className="block rounded-lg p-1.5 hover:bg-flate-dyp transition-colors"
                  >
                    <div className="text-sm font-medium">{s.tittel}</div>
                    <div className="text-xs text-dus">
                      {format(s.start, "EEEE d. MMM 'kl.' HH:mm", { locale: nb })}
                      {s.grend && ` · ${s.grend.navn}`}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Kort>

        <p className="px-2 text-xs leading-relaxed text-dus">
          Heimet viser aldri annonser og selger aldri dataene dine. Tunet er
          kronologisk — det du ser er det som faktisk skjedde. 🇳🇴
        </p>
      </aside>
    </div>
  );
}
