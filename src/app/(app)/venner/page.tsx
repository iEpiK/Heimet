import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { hentVennIder } from "@/lib/venner";
import { Avatar } from "@/components/ui/Avatar";
import { Kort } from "@/components/ui/Kort";
import { VennKnapp } from "@/components/profil/VennKnapp";

export const metadata = { title: "Venner" };

export default async function VennerSide() {
  const meg = await krevBruker();

  const [mottatte, sendte, vennIder, blokkerte] = await Promise.all([
    prisma.vennskap.findMany({
      where: { tilId: meg.id, status: "VENTER" },
      include: { fra: { select: { id: true, name: true, username: true, image: true } } },
      orderBy: { opprettetAt: "desc" },
    }),
    prisma.vennskap.findMany({
      where: { fraId: meg.id, status: "VENTER" },
      include: { til: { select: { id: true, name: true, username: true, image: true } } },
      orderBy: { opprettetAt: "desc" },
    }),
    hentVennIder(meg.id),
    prisma.blokkering.findMany({
      where: { blokkererId: meg.id },
      include: { blokkert: { select: { id: true, name: true, username: true, image: true } } },
    }),
  ]);

  const venner = await prisma.user.findMany({
    where: { id: { in: vennIder }, slettesAt: null },
    select: { id: true, name: true, username: true, image: true, kommune: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4 heim-inn">
      <h1 className="text-2xl font-semibold">Venner</h1>

      {mottatte.length > 0 && (
        <Kort className="p-6">
          <h2 className="text-lg font-semibold">
            Forespørsler til deg <span className="text-aksent">({mottatte.length})</span>
          </h2>
          <ul className="mt-4 space-y-3">
            {mottatte.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3">
                <Link href={`/profil/${f.fra.username}`} className="flex items-center gap-3 hover:underline">
                  <Avatar bilde={f.fra.image} navn={f.fra.name} />
                  <div>
                    <div className="text-sm font-medium">{f.fra.name}</div>
                    <div className="text-xs text-dus">@{f.fra.username}</div>
                  </div>
                </Link>
                <VennKnapp andreId={f.fra.id} status="mottatt" vennskapId={f.id} />
              </li>
            ))}
          </ul>
        </Kort>
      )}

      {sendte.length > 0 && (
        <Kort className="p-6">
          <h2 className="text-lg font-semibold">Sendte forespørsler</h2>
          <ul className="mt-4 space-y-3">
            {sendte.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3">
                <Link href={`/profil/${f.til.username}`} className="flex items-center gap-3 hover:underline">
                  <Avatar bilde={f.til.image} navn={f.til.name} />
                  <div>
                    <div className="text-sm font-medium">{f.til.name}</div>
                    <div className="text-xs text-dus">@{f.til.username}</div>
                  </div>
                </Link>
                <VennKnapp andreId={f.til.id} status="sendt" />
              </li>
            ))}
          </ul>
        </Kort>
      )}

      <Kort className="p-6">
        <h2 className="text-lg font-semibold">Vennene dine ({venner.length})</h2>
        {venner.length === 0 ? (
          <p className="mt-3 text-sm text-dus">
            Ingen venner ennå. Finn folk via{" "}
            <Link href="/sok" className="text-primar hover:underline">
              søket
            </Link>{" "}
            eller en grend!
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {venner.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/profil/${v.username}`}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-flate-dyp transition-colors"
                >
                  <Avatar bilde={v.image} navn={v.name} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{v.name}</div>
                    <div className="truncate text-xs text-dus">
                      @{v.username}
                      {v.kommune ? ` · ${v.kommune}` : ""}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Kort>

      {blokkerte.length > 0 && (
        <Kort className="p-6">
          <h2 className="text-lg font-semibold">Blokkerte</h2>
          <ul className="mt-4 space-y-3">
            {blokkerte.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar bilde={b.blokkert.image} navn={b.blokkert.name} />
                  <div>
                    <div className="text-sm font-medium">{b.blokkert.name}</div>
                    <div className="text-xs text-dus">@{b.blokkert.username}</div>
                  </div>
                </div>
                <VennKnapp andreId={b.blokkert.id} status="blokkert_av_meg" />
              </li>
            ))}
          </ul>
        </Kort>
      )}
    </div>
  );
}
