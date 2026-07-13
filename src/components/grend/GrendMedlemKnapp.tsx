"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bliMedIGrend, forlatGrend } from "@/server/grender";
import { Knapp } from "@/components/ui/Knapp";

export function GrendMedlemKnapp({
  grendId,
  status,
}: {
  grendId: string;
  status: "ikke_medlem" | "VENTER" | "GODKJENT";
}) {
  const router = useRouter();
  const [venter, startTransition] = useTransition();
  const [feil, setFeil] = useState<string | null>(null);

  function kjor(handling: () => Promise<{ ok: true } | { feil: string }>) {
    setFeil(null);
    startTransition(async () => {
      const res = await handling();
      if ("feil" in res) setFeil(res.feil);
      router.refresh();
    });
  }

  return (
    <div>
      {status === "ikke_medlem" && (
        <Knapp disabled={venter} onClick={() => kjor(() => bliMedIGrend(grendId))}>
          🏘️ Bli med
        </Knapp>
      )}
      {status === "VENTER" && (
        <Knapp variant="sekundar" disabled={venter} onClick={() => kjor(() => forlatGrend(grendId))}>
          ⏳ Venter på godkjenning — trekk
        </Knapp>
      )}
      {status === "GODKJENT" && (
        <Knapp variant="sekundar" disabled={venter} onClick={() => kjor(() => forlatGrend(grendId))}>
          ✓ Medlem — forlat
        </Knapp>
      )}
      {feil && <p className="mt-2 text-sm text-negativ">{feil}</p>}
    </div>
  );
}
