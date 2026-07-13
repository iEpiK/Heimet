"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { forlatSamtale } from "@/server/meldinger";

export function ForlatSamtaleKnapp({ samtaleId }: { samtaleId: string }) {
  const router = useRouter();
  const [venter, startTransition] = useTransition();

  function forlat() {
    if (!confirm("Forlate gruppesamtalen?")) return;
    startTransition(async () => {
      await forlatSamtale(samtaleId);
      router.push("/meldinger");
      router.refresh();
    });
  }

  return (
    <button
      onClick={forlat}
      disabled={venter}
      className="text-xs text-negativ hover:underline cursor-pointer"
    >
      Forlat
    </button>
  );
}
