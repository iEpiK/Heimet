"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { slettInnlegg } from "@/server/innlegg";

export function InnleggMeny({
  innleggId,
  erForfatter,
}: {
  innleggId: string;
  erForfatter: boolean;
}) {
  const [apen, setApen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const sti = usePathname();
  const [, startTransition] = useTransition();

  useEffect(() => {
    function lukk(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setApen(false);
    }
    document.addEventListener("mousedown", lukk);
    return () => document.removeEventListener("mousedown", lukk);
  }, []);

  function slett() {
    if (!confirm("Vil du slette innlegget? Dette kan ikke angres.")) return;
    startTransition(async () => {
      await slettInnlegg(innleggId);
      if (sti.startsWith("/innlegg/")) router.push("/tunet");
      else router.refresh();
    });
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setApen((v) => !v)}
        className="rounded-lg px-2 py-1 text-dus hover:bg-flate-dyp cursor-pointer"
        title="Alternativer"
      >
        …
      </button>
      {apen && (
        <div className="absolute right-0 top-full z-40 mt-1 w-40 rounded-xl border border-kant bg-flate p-1.5 shadow-heim heim-inn">
          {erForfatter && (
            <button
              onClick={() => router.push(`/innlegg/${innleggId}/rediger`)}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-flate-dyp cursor-pointer"
            >
              ✏️ Rediger
            </button>
          )}
          <button
            onClick={slett}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-negativ hover:bg-flate-dyp cursor-pointer"
          >
            🗑️ Slett
          </button>
        </div>
      )}
    </div>
  );
}
