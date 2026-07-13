"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Holder en SSE-tilkobling åpen og oppdaterer serverkomponentene
 * (varseltellere, meldingslister) når noe skjer. Debouncer refresh
 * så en strøm av hendelser ikke gir refresh-storm.
 */
export function SanntidLytter() {
  const router = useRouter();
  const tidsur = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const kilde = new EventSource("/api/sse");
    kilde.onmessage = (e) => {
      try {
        const hendelse = JSON.parse(e.data);
        if (hendelse.type === "tilkoblet") return;
      } catch {
        return;
      }
      if (tidsur.current) clearTimeout(tidsur.current);
      tidsur.current = setTimeout(() => router.refresh(), 300);
    };
    return () => {
      if (tidsur.current) clearTimeout(tidsur.current);
      kilde.close();
    };
  }, [router]);

  return null;
}
