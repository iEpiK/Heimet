"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startSamtale } from "@/server/meldinger";
import { Knapp } from "@/components/ui/Knapp";

export function MeldingKnapp({ brukernavn }: { brukernavn: string }) {
  const router = useRouter();
  const [venter, startTransition] = useTransition();
  const [feil, setFeil] = useState<string | null>(null);

  function start() {
    setFeil(null);
    startTransition(async () => {
      const res = await startSamtale(brukernavn);
      if ("feil" in res) return setFeil(res.feil);
      router.push(`/meldinger/${res.id}`);
    });
  }

  return (
    <>
      <Knapp variant="sekundar" disabled={venter} onClick={start}>
        ✉️ Melding
      </Knapp>
      {feil && <p className="w-full text-sm text-negativ">{feil}</p>}
    </>
  );
}
