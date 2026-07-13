import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { Kort } from "@/components/ui/Kort";
import { Avatar } from "@/components/ui/Avatar";
import { Merkelapp } from "@/components/ui/Merkelapp";

export const metadata = { title: "Søk" };

export default async function SokSide({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const meg = await krevBruker();
  const { q = "" } = await searchParams;
  const sok = q.trim();

  const [brukere, grender, stover, stevner] = sok
    ? await Promise.all([
        prisma.user.findMany({
          where: {
            slettesAt: null,
            OR: [
              { name: { contains: sok, mode: "insensitive" } },
              { username: { contains: sok, mode: "insensitive" } },
            ],
            // Skjul folk som har blokkert meg / jeg har blokkert
            NOT: {
              OR: [
                { blokkeringer: { some: { blokkertId: meg.id } } },
                { blokkertAv: { some: { blokkererId: meg.id } } },
              ],
            },
          },
          select: { id: true, name: true, username: true, image: true, kommune: true },
          take: 10,
        }),
        prisma.grend.findMany({
          where: {
            type: { not: "SKJULT" },
            OR: [
              { navn: { contains: sok, mode: "insensitive" } },
              { beskrivelse: { contains: sok, mode: "insensitive" } },
              { kommune: { contains: sok, mode: "insensitive" } },
            ],
          },
          include: { _count: { select: { medlemmer: { where: { status: "GODKJENT" } } } } },
          take: 10,
        }),
        prisma.stove.findMany({
          where: {
            OR: [
              { navn: { contains: sok, mode: "insensitive" } },
              { beskrivelse: { contains: sok, mode: "insensitive" } },
              { kategori: { contains: sok, mode: "insensitive" } },
            ],
          },
          include: { _count: { select: { folgere: true } } },
          take: 10,
        }),
        prisma.stevne.findMany({
          where: {
            synlighet: "OFFENTLIG",
            start: { gte: new Date() },
            OR: [
              { tittel: { contains: sok, mode: "insensitive" } },
              { sted: { contains: sok, mode: "insensitive" } },
            ],
          },
          take: 10,
          orderBy: { start: "asc" },
        }),
      ])
    : [[], [], [], []];

  const ingenTreff =
    sok && brukere.length + grender.length + stover.length + stevner.length === 0;

  return (
    <div className="mx-auto max-w-xl space-y-4 heim-inn">
      <h1 className="text-2xl font-semibold">Søk</h1>
      <form action="/sok" method="get">
        <input
          type="search"
          name="q"
          defaultValue={sok}
          autoFocus
          placeholder="Søk etter folk, grender, stover og stevner…"
          className="w-full rounded-xl border border-kant bg-flate px-4 py-3 text-[15px] placeholder:text-dus focus:outline-none focus:ring-2 focus:ring-primar/40 focus:border-primar"
        />
      </form>

      {ingenTreff && (
        <Kort className="p-8 text-center">
          <div className="text-4xl">🔎</div>
          <p className="mt-3 text-sm text-dus">Ingen treff på «{sok}».</p>
        </Kort>
      )}

      {brukere.length > 0 && (
        <Kort className="p-5">
          <h2 className="font-semibold">Folk</h2>
          <ul className="mt-3 space-y-1">
            {brukere.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/profil/${b.username}`}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-flate-dyp transition-colors"
                >
                  <Avatar bilde={b.image} navn={b.name} storrelse="sm" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{b.name}</div>
                    <div className="truncate text-xs text-dus">
                      @{b.username}
                      {b.kommune ? ` · ${b.kommune}` : ""}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Kort>
      )}

      {grender.length > 0 && (
        <Kort className="p-5">
          <h2 className="font-semibold">Grender</h2>
          <ul className="mt-3 space-y-1">
            {grender.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/grender/${g.slug}`}
                  className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-flate-dyp transition-colors"
                >
                  <span className="truncate text-sm font-medium">🏘️ {g.navn}</span>
                  <Merkelapp>{g._count.medlemmer} medlemmer</Merkelapp>
                </Link>
              </li>
            ))}
          </ul>
        </Kort>
      )}

      {stover.length > 0 && (
        <Kort className="p-5">
          <h2 className="font-semibold">Stover</h2>
          <ul className="mt-3 space-y-1">
            {stover.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/stover/${s.slug}`}
                  className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-flate-dyp transition-colors"
                >
                  <span className="truncate text-sm font-medium">🪵 {s.navn}</span>
                  <Merkelapp>{s.kategori}</Merkelapp>
                </Link>
              </li>
            ))}
          </ul>
        </Kort>
      )}

      {stevner.length > 0 && (
        <Kort className="p-5">
          <h2 className="font-semibold">Stevner</h2>
          <ul className="mt-3 space-y-1">
            {stevner.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/stevner/${s.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-flate-dyp transition-colors"
                >
                  <span className="truncate text-sm font-medium">📅 {s.tittel}</span>
                  <span className="shrink-0 text-xs text-dus">
                    {format(s.start, "d. MMM", { locale: nb })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Kort>
      )}
    </div>
  );
}
