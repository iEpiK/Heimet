import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { Navigasjon } from "@/components/skall/Navigasjon";
import { TemaVeksler } from "@/components/skall/TemaVeksler";
import { BrukerMeny } from "@/components/skall/BrukerMeny";
import { SanntidLytter } from "@/components/skall/SanntidLytter";

async function antallUlesteSamtaler(brukerId: string) {
  const medlemskap = await prisma.samtaleMedlem.findMany({
    where: { brukerId },
    select: { samtaleId: true, sistLest: true },
  });
  if (medlemskap.length === 0) return 0;
  const teller = await Promise.all(
    medlemskap.map((m) =>
      prisma.melding.count({
        where: {
          samtaleId: m.samtaleId,
          avsenderId: { not: brukerId },
          ...(m.sistLest && { opprettetAt: { gt: m.sistLest } }),
        },
        take: 1,
      })
    )
  );
  return teller.filter((t) => t > 0).length;
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bruker = await krevBruker();
  const [ulesteVarsler, ulesteSamtaler] = await Promise.all([
    prisma.varsel.count({ where: { mottakerId: bruker.id, lest: false } }),
    antallUlesteSamtaler(bruker.id),
  ]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-kant bg-flate/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
          <Link
            href="/tunet"
            className="text-xl font-semibold shrink-0"
            style={{ fontFamily: "var(--font-display)" }}
          >
            🏔️ <span className="hidden sm:inline">Heimet</span>
          </Link>
          <Navigasjon ulesteSamtaler={ulesteSamtaler} />
          <div className="flex items-center gap-1">
            <Link
              href="/sok"
              title="Søk"
              className="rounded-lg p-2 text-lg hover:bg-flate-dyp transition-colors"
            >
              🔍
            </Link>
            <Link
              href="/varsler"
              title="Varsler"
              className="relative rounded-lg p-2 text-lg hover:bg-flate-dyp transition-colors"
            >
              🔔
              {ulesteVarsler > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-aksent px-1 text-[10px] font-bold text-white">
                  {ulesteVarsler > 9 ? "9+" : ulesteVarsler}
                </span>
              )}
            </Link>
            <TemaVeksler />
            <BrukerMeny
              navn={bruker.name}
              brukernavn={bruker.username ?? ""}
              bilde={bruker.image}
              erModerator={bruker.rolle !== "BRUKER"}
            />
          </div>
        </div>
      </header>
      {bruker.slettesAt && (
        <div className="border-b border-aksent/40 bg-aksent-myk px-4 py-2 text-center text-sm">
          ⚠️ Kontoen din er skjult og slettes permanent{" "}
          {bruker.slettesAt.toLocaleDateString("nb-NO", { day: "numeric", month: "long" })}.{" "}
          <Link href="/innstillinger/personvern" className="font-medium underline">
            Angre slettingen
          </Link>
        </div>
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <SanntidLytter />
    </div>
  );
}
