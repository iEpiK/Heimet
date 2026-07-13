"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { slettKommentar } from "@/server/innlegg";
import { KommentarSkjema } from "./KommentarSkjema";

export function KommentarHandlinger({
  innleggId,
  kommentarId,
  parentId,
  kanSlette,
  kanSvare,
}: {
  innleggId: string;
  kommentarId: string;
  parentId: string;
  kanSlette: boolean;
  kanSvare: boolean;
}) {
  const router = useRouter();
  const [svarer, setSvarer] = useState(false);
  const [, startTransition] = useTransition();

  function slett() {
    if (!confirm("Slette kommentaren?")) return;
    startTransition(async () => {
      await slettKommentar(kommentarId);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center gap-2 text-xs text-dus">
        {kanSvare && (
          <button
            onClick={() => setSvarer((v) => !v)}
            className="hover:text-primar cursor-pointer"
          >
            Svar
          </button>
        )}
        {kanSlette && (
          <button onClick={slett} className="hover:text-negativ cursor-pointer">
            Slett
          </button>
        )}
      </div>
      {svarer && (
        <div className="mt-2 w-full">
          <KommentarSkjema
            innleggId={innleggId}
            parentId={parentId}
            autoFokus
            vedSendt={() => setSvarer(false)}
          />
        </div>
      )}
    </>
  );
}
