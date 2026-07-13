"use client";

import { useState, useTransition } from "react";
import { rapporter } from "@/server/rapporter";
import { Knapp } from "@/components/ui/Knapp";

export function RapporterKnapp({
  refType,
  refId,
  somMenypunkt = false,
}: {
  refType: "innlegg" | "kommentar" | "bruker" | "grend" | "stove";
  refId: string;
  somMenypunkt?: boolean;
}) {
  const [apen, setApen] = useState(false);
  const [arsak, setArsak] = useState("");
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null);
  const [venter, startTransition] = useTransition();

  function send(e: React.FormEvent) {
    e.preventDefault();
    setMelding(null);
    startTransition(async () => {
      const res = await rapporter({ refType, refId, arsak });
      if ("feil" in res) return setMelding({ ok: false, tekst: res.feil });
      setMelding({ ok: true, tekst: "Takk — rapporten er sendt til moderatorene." });
      setArsak("");
    });
  }

  return (
    <>
      <button
        onClick={() => setApen(true)}
        className={
          somMenypunkt
            ? "block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-flate-dyp cursor-pointer"
            : "text-xs text-dus hover:text-negativ cursor-pointer"
        }
      >
        🚩 Rapporter
      </button>
      {apen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setApen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-kant bg-flate p-5 shadow-heim heim-inn"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold">Rapporter til moderatorene</h2>
            <p className="mt-1 text-xs text-dus">
              Rapporten er anonym for den det gjelder.
            </p>
            <form onSubmit={send} className="mt-3 space-y-3">
              <textarea
                value={arsak}
                onChange={(e) => setArsak(e.target.value)}
                rows={3}
                required
                minLength={5}
                maxLength={1000}
                placeholder="Hva er galt?"
                className="w-full resize-y rounded-lg border border-kant bg-flate px-3 py-2 text-sm placeholder:text-dus focus:outline-none focus:ring-2 focus:ring-primar/40"
              />
              {melding && (
                <p className={`text-sm ${melding.ok ? "text-positiv" : "text-negativ"}`}>
                  {melding.tekst}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Knapp type="button" variant="sekundar" onClick={() => setApen(false)}>
                  {melding?.ok ? "Lukk" : "Avbryt"}
                </Knapp>
                {!melding?.ok && (
                  <Knapp type="submit" disabled={venter}>
                    {venter ? "Sender…" : "Send rapport"}
                  </Knapp>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
