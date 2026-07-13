"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Avatar } from "@/components/ui/Avatar";

export function BrukerMeny({
  navn,
  brukernavn,
  bilde,
}: {
  navn: string;
  brukernavn: string;
  bilde?: string | null;
}) {
  const [apen, setApen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function lukk(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setApen(false);
    }
    document.addEventListener("mousedown", lukk);
    return () => document.removeEventListener("mousedown", lukk);
  }, []);

  async function loggUt() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setApen((v) => !v)}
        className="flex items-center gap-2 rounded-lg p-1 hover:bg-flate-dyp transition-colors cursor-pointer"
      >
        <Avatar bilde={bilde} navn={navn} storrelse="sm" />
      </button>
      {apen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-kant bg-flate p-1.5 shadow-heim heim-inn">
          <div className="px-3 py-2">
            <div className="text-sm font-semibold truncate">{navn}</div>
            <div className="text-xs text-dus truncate">@{brukernavn}</div>
          </div>
          <hr className="my-1 border-kant" />
          <Link
            href={`/profil/${brukernavn}`}
            onClick={() => setApen(false)}
            className="block rounded-lg px-3 py-2 text-sm hover:bg-flate-dyp"
          >
            Min profil
          </Link>
          <Link
            href="/innstillinger"
            onClick={() => setApen(false)}
            className="block rounded-lg px-3 py-2 text-sm hover:bg-flate-dyp"
          >
            Innstillinger
          </Link>
          <hr className="my-1 border-kant" />
          <button
            onClick={loggUt}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-negativ hover:bg-flate-dyp cursor-pointer"
          >
            Logg ut
          </button>
        </div>
      )}
    </div>
  );
}
