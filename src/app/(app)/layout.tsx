import Link from "next/link";
import { krevBruker } from "@/lib/session";
import { Navigasjon } from "@/components/skall/Navigasjon";
import { TemaVeksler } from "@/components/skall/TemaVeksler";
import { BrukerMeny } from "@/components/skall/BrukerMeny";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bruker = await krevBruker();

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
          <Navigasjon />
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
              className="rounded-lg p-2 text-lg hover:bg-flate-dyp transition-colors"
            >
              🔔
            </Link>
            <TemaVeksler />
            <BrukerMeny
              navn={bruker.name}
              brukernavn={bruker.username ?? ""}
              bilde={bruker.image}
            />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
