"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { behandleRapport } from "@/server/rapporter";
import { Knapp } from "@/components/ui/Knapp";

export function RapportHandlinger({
  rapportId,
  status,
}: {
  rapportId: string;
  status: "NY" | "UNDER_BEHANDLING" | "LUKKET";
}) {
  const router = useRouter();
  const [notat, setNotat] = useState("");
  const [venter, startTransition] = useTransition();

  function oppdater(nyStatus: "UNDER_BEHANDLING" | "LUKKET") {
    startTransition(async () => {
      await behandleRapport(rapportId, nyStatus, notat);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "NY" && (
        <Knapp
          variant="sekundar"
          disabled={venter}
          onClick={() => oppdater("UNDER_BEHANDLING")}
          className="px-3 py-1.5 text-xs"
        >
          Ta saken
        </Knapp>
      )}
      <input
        value={notat}
        onChange={(e) => setNotat(e.target.value)}
        placeholder="Notat (valgfritt)"
        className="rounded-lg border border-kant bg-flate px-2.5 py-1.5 text-xs placeholder:text-dus focus:outline-none"
      />
      <Knapp
        disabled={venter}
        onClick={() => oppdater("LUKKET")}
        className="px-3 py-1.5 text-xs"
      >
        Lukk saken
      </Knapp>
    </div>
  );
}
