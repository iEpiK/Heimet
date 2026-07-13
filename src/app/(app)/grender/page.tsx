import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";
import { Merkelapp } from "@/components/ui/Merkelapp";

export const metadata = { title: "Grender" };

function GrendKort({
  grend,
  medlemsstatus,
}: {
  grend: {
    slug: string;
    navn: string;
    beskrivelse: string | null;
    type: string;
    kommune: string | null;
    coverbilde: string | null;
    _count: { medlemmer: number };
  };
  medlemsstatus?: string;
}) {
  return (
    <Link href={`/grender/${grend.slug}`}>
      <Kort className="h-full overflow-hidden transition-colors hover:border-primar">
        <div
          className="h-20 bg-primar/15 bg-cover bg-center"
          style={grend.coverbilde ? { backgroundImage: `url(${grend.coverbilde})` } : undefined}
        />
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold truncate">🏘️ {grend.navn}</h3>
            {medlemsstatus === "VENTER" && <Merkelapp>venter</Merkelapp>}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-dus">
            <span>
              {grend.type === "AAPEN" ? "Åpen" : grend.type === "LUKKET" ? "Lukket" : "Skjult"} ·{" "}
              {grend._count.medlemmer} medlemmer
            </span>
            {grend.kommune && <span>· 📍 {grend.kommune}</span>}
          </div>
          {grend.beskrivelse && (
            <p className="mt-2 line-clamp-2 text-sm text-dus">{grend.beskrivelse}</p>
          )}
        </div>
      </Kort>
    </Link>
  );
}

export default async function GrenderSide() {
  const meg = await krevBruker();

  const mineMedlemskap = await prisma.grendMedlemskap.findMany({
    where: { brukerId: meg.id },
    include: {
      grend: { include: { _count: { select: { medlemmer: { where: { status: "GODKJENT" } } } } } },
    },
    orderBy: { opprettetAt: "desc" },
  });
  const mineGrendIder = mineMedlemskap.map((m) => m.grendId);

  const oppdagelser = await prisma.grend.findMany({
    where: { type: { not: "SKJULT" }, id: { notIn: mineGrendIder } },
    include: { _count: { select: { medlemmer: { where: { status: "GODKJENT" } } } } },
    orderBy: { opprettetAt: "desc" },
    take: 24,
  });

  return (
    <div className="space-y-8 heim-inn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Grender</h1>
          <p className="text-sm text-dus">
            Små fellesskap — for bygda di, hobbyen din eller folka dine.
          </p>
        </div>
        <Link href="/grender/ny">
          <Knapp>🏗️ Ny grend</Knapp>
        </Link>
      </div>

      {mineMedlemskap.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Grendene mine</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mineMedlemskap.map((m) => (
              <GrendKort key={m.id} grend={m.grend} medlemsstatus={m.status} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Utforsk</h2>
        {oppdagelser.length === 0 ? (
          <p className="text-sm text-dus">
            Ingen flere grender å utforske — kanskje du vil starte en?
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {oppdagelser.map((g) => (
              <GrendKort key={g.id} grend={g} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
