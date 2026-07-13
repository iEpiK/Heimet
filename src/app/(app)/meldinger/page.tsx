import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";
import { Avatar } from "@/components/ui/Avatar";

export const metadata = { title: "Meldinger" };

export default async function MeldingerSide() {
  const meg = await krevBruker();

  const samtaler = await prisma.samtale.findMany({
    where: { medlemmer: { some: { brukerId: meg.id } } },
    include: {
      medlemmer: {
        include: { bruker: { select: { id: true, name: true, username: true, image: true } } },
      },
      meldinger: { orderBy: { opprettetAt: "desc" }, take: 1 },
    },
    orderBy: { sisteAktivitet: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-xl space-y-4 heim-inn">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meldinger</h1>
        <Link href="/meldinger/ny">
          <Knapp>✉️ Ny samtale</Knapp>
        </Link>
      </div>

      {samtaler.length === 0 ? (
        <Kort className="p-8 text-center">
          <div className="text-4xl">🕊️</div>
          <p className="mt-3 text-sm text-dus">
            Ingen samtaler ennå — send noen en hyggelig melding!
          </p>
        </Kort>
      ) : (
        <Kort className="divide-y divide-kant overflow-hidden p-0">
          {samtaler.map((s) => {
            const mittMedlemskap = s.medlemmer.find((m) => m.brukerId === meg.id)!;
            const andre = s.medlemmer.filter((m) => m.brukerId !== meg.id);
            const siste = s.meldinger[0];
            const ulest =
              !!siste &&
              siste.avsenderId !== meg.id &&
              (!mittMedlemskap.sistLest || siste.opprettetAt > mittMedlemskap.sistLest);
            const tittel = s.erGruppe
              ? (s.navn ?? "Gruppesamtale")
              : (andre[0]?.bruker.name ?? "Slettet bruker");

            return (
              <Link
                key={s.id}
                href={`/meldinger/${s.id}`}
                className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-flate-dyp ${
                  ulest ? "bg-primar/5" : ""
                }`}
              >
                {s.erGruppe ? (
                  <span className="flex size-10 items-center justify-center rounded-full bg-primar/15 text-lg">
                    👥
                  </span>
                ) : (
                  <Avatar bilde={andre[0]?.bruker.image} navn={tittel} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`truncate text-sm ${ulest ? "font-bold" : "font-medium"}`}>
                      {tittel}
                    </span>
                    {siste && (
                      <span className="shrink-0 text-xs text-dus">
                        {formatDistanceToNow(siste.opprettetAt, { addSuffix: true, locale: nb })}
                      </span>
                    )}
                  </div>
                  <p className={`truncate text-sm ${ulest ? "text-tekst" : "text-dus"}`}>
                    {siste
                      ? `${siste.avsenderId === meg.id ? "Du: " : ""}${siste.innhold}`
                      : "Ingen meldinger ennå"}
                  </p>
                </div>
                {ulest && <span className="size-2 shrink-0 rounded-full bg-aksent" />}
              </Link>
            );
          })}
        </Kort>
      )}
    </div>
  );
}
