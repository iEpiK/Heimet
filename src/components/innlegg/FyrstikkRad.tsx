"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { giFyrstikk } from "@/server/innlegg";
import { FYRSTIKKER } from "@/lib/fyrstikker";
import type { FyrstikkType } from "@/generated/prisma/enums";

export function FyrstikkRad({
  mal,
  antall,
  min,
  kanReagere,
}: {
  mal: { innleggId: string } | { kommentarId: string };
  antall: Partial<Record<FyrstikkType, number>>;
  min: FyrstikkType | null;
  kanReagere: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimistisk, settOptimistisk] = useOptimistic(
    { antall, min },
    (naa, nyType: FyrstikkType) => {
      const oppdatert = { ...naa.antall };
      if (naa.min) oppdatert[naa.min] = Math.max(0, (oppdatert[naa.min] ?? 1) - 1);
      if (naa.min === nyType) return { antall: oppdatert, min: null };
      oppdatert[nyType] = (oppdatert[nyType] ?? 0) + 1;
      return { antall: oppdatert, min: nyType };
    }
  );

  function reager(type: FyrstikkType) {
    startTransition(async () => {
      settOptimistisk(type);
      await giFyrstikk(mal, type);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {FYRSTIKKER.map((f) => {
        const n = optimistisk.antall[f.type] ?? 0;
        const valgt = optimistisk.min === f.type;
        return (
          <button
            key={f.type}
            type="button"
            title={kanReagere ? f.navn : "Forfatteren har begrenset hvem som kan reagere"}
            disabled={!kanReagere}
            onClick={() => reager(f.type)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm transition-colors ${
              valgt
                ? "border-primar bg-primar/10 text-primar"
                : "border-transparent text-dus hover:border-kant hover:bg-flate-dyp"
            } ${kanReagere ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
          >
            <span aria-hidden>{f.emoji}</span>
            {n > 0 && <span className="text-xs font-medium">{n}</span>}
          </button>
        );
      })}
    </div>
  );
}
