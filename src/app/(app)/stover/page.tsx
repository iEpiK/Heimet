import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";

export const metadata = { title: "Stover" };

function StoveKort({
  stove,
}: {
  stove: {
    slug: string;
    navn: string;
    kategori: string;
    beskrivelse: string | null;
    coverbilde: string | null;
    _count: { folgere: number };
  };
}) {
  return (
    <Link href={`/stover/${stove.slug}`}>
      <Kort className="h-full overflow-hidden transition-colors hover:border-primar">
        <div
          className="h-20 bg-aksent/15 bg-cover bg-center"
          style={stove.coverbilde ? { backgroundImage: `url(${stove.coverbilde})` } : undefined}
        />
        <div className="p-4">
          <h3 className="font-semibold truncate">🪵 {stove.navn}</h3>
          <p className="mt-1 text-xs text-dus">
            {stove.kategori} · {stove._count.folgere} følgere
          </p>
          {stove.beskrivelse && (
            <p className="mt-2 line-clamp-2 text-sm text-dus">{stove.beskrivelse}</p>
          )}
        </div>
      </Kort>
    </Link>
  );
}

export default async function StoverSide() {
  const meg = await krevBruker();

  const [mine, alle] = await Promise.all([
    prisma.stoveFolging.findMany({
      where: { brukerId: meg.id },
      include: { stove: { include: { _count: { select: { folgere: true } } } } },
      orderBy: { opprettetAt: "desc" },
    }),
    prisma.stove.findMany({
      include: { _count: { select: { folgere: true } } },
      orderBy: { opprettetAt: "desc" },
      take: 24,
    }),
  ]);
  const mineIder = new Set(mine.map((m) => m.stoveId));

  return (
    <div className="space-y-8 heim-inn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Stover</h1>
          <p className="text-sm text-dus">
            Offentlige sider for lag, foreninger, bedrifter og kulturliv.
          </p>
        </div>
        <Link href="/stover/ny">
          <Knapp>🪵 Ny stove</Knapp>
        </Link>
      </div>

      {mine.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Stover du følger</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((m) => (
              <StoveKort key={m.id} stove={m.stove} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Utforsk</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {alle
            .filter((s) => !mineIder.has(s.id))
            .map((s) => (
              <StoveKort key={s.id} stove={s} />
            ))}
        </div>
      </section>
    </div>
  );
}
