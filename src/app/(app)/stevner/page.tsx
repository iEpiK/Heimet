import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { hentVennIder } from "@/lib/venner";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";
import { Avatar } from "@/components/ui/Avatar";
import { Merkelapp } from "@/components/ui/Merkelapp";

export const metadata = { title: "Stevner" };

export default async function StevnerSide() {
  const meg = await krevBruker();
  const naa = new Date();

  const [vennIder, mineGrender] = await Promise.all([
    hentVennIder(meg.id),
    prisma.grendMedlemskap.findMany({
      where: { brukerId: meg.id, status: "GODKJENT" },
      select: { grendId: true },
    }),
  ]);

  const stevner = await prisma.stevne.findMany({
    where: {
      start: { gte: naa },
      OR: [
        { arrangorId: meg.id },
        { synlighet: "OFFENTLIG" },
        { grendId: { in: mineGrender.map((g) => g.grendId) } },
        { synlighet: "VENNER", arrangorId: { in: vennIder } },
        { svar: { some: { brukerId: meg.id } } },
      ],
    },
    include: {
      grend: { select: { navn: true, slug: true } },
      stove: { select: { navn: true, slug: true } },
      arrangor: { select: { name: true, username: true } },
      svar: { where: { brukerId: meg.id } },
      _count: { select: { svar: { where: { svar: "KOMMER" } } } },
    },
    orderBy: { start: "asc" },
    take: 50,
  });

  // Venners bursdager de neste 30 dagene
  const venner = await prisma.user.findMany({
    where: {
      id: { in: vennIder },
      slettesAt: null,
      fodselsdato: { not: null },
      bursdagSynlighet: { not: "SKJULT" },
    },
    select: { id: true, name: true, username: true, image: true, fodselsdato: true },
  });
  const kommendeBursdager = venner
    .map((v) => {
      const f = v.fodselsdato!;
      const neste = new Date(naa.getFullYear(), f.getUTCMonth(), f.getUTCDate());
      if (neste < new Date(naa.getFullYear(), naa.getMonth(), naa.getDate())) {
        neste.setFullYear(neste.getFullYear() + 1);
      }
      return { ...v, neste };
    })
    .filter((v) => v.neste.getTime() - naa.getTime() < 30 * 24 * 3600 * 1000)
    .sort((a, b) => a.neste.getTime() - b.neste.getTime());

  return (
    <div className="space-y-6 heim-inn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Stevner</h1>
          <p className="text-sm text-dus">Alt fra skitur og dugnad til rakfisklag.</p>
        </div>
        <Link href="/stevner/nytt">
          <Knapp>📅 Nytt stevne</Knapp>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          {stevner.length === 0 ? (
            <Kort className="p-8 text-center">
              <div className="text-4xl">🗓️</div>
              <p className="mt-3 text-sm text-dus">
                Ingen kommende stevner — kanskje du vil arrangere det første?
              </p>
            </Kort>
          ) : (
            stevner.map((s) => (
              <Link key={s.id} href={`/stevner/${s.id}`} className="block">
                <Kort className="flex gap-4 p-4 transition-colors hover:border-primar">
                  <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primar/10 py-2 text-primar">
                    <span className="text-xs font-medium uppercase">
                      {format(s.start, "MMM", { locale: nb })}
                    </span>
                    <span className="text-xl font-bold leading-none">{format(s.start, "d")}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{s.tittel}</h3>
                    <p className="text-xs text-dus">
                      {format(s.start, "EEEE 'kl.' HH:mm", { locale: nb })}
                      {s.sted && ` · 📍 ${s.sted}`}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {s.grend && <Merkelapp>🏘️ {s.grend.navn}</Merkelapp>}
                      {s.stove && <Merkelapp>🪵 {s.stove.navn}</Merkelapp>}
                      <Merkelapp>✓ {s._count.svar} kommer</Merkelapp>
                      {s.svar[0] && (
                        <Merkelapp className="border-primar/40 text-primar">
                          {s.svar[0].svar === "KOMMER"
                            ? "Du kommer"
                            : s.svar[0].svar === "KANSKJE"
                              ? "Kanskje"
                              : "Kan ikke"}
                        </Merkelapp>
                      )}
                    </div>
                  </div>
                </Kort>
              </Link>
            ))
          )}
        </div>

        <aside>
          <Kort className="p-5">
            <h2 className="font-semibold">🎂 Bursdager fremover</h2>
            {kommendeBursdager.length === 0 ? (
              <p className="mt-3 text-sm text-dus">Ingen bursdager blant vennene dine de neste 30 dagene.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {kommendeBursdager.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/profil/${v.username}`}
                      className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-flate-dyp transition-colors"
                    >
                      <Avatar bilde={v.image} navn={v.name} storrelse="sm" />
                      <div className="min-w-0">
                        <div className="truncate text-sm">{v.name}</div>
                        <div className="text-xs text-dus">
                          {format(v.neste, "EEEE d. MMMM", { locale: nb })}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Kort>
        </aside>
      </div>
    </div>
  );
}
