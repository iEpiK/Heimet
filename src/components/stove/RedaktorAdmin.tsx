"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { leggTilStoveRedaktor, fjernStoveRedaktor } from "@/server/stover";
import { Knapp } from "@/components/ui/Knapp";

export function RedaktorAdmin({
  stoveId,
  roller,
}: {
  stoveId: string;
  roller: { id: string; navn: string; rolle: "REDAKTOR" | "ADMIN" }[];
}) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [venter, startTransition] = useTransition();
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null);

  function leggTil(e: React.FormEvent) {
    e.preventDefault();
    setMelding(null);
    startTransition(async () => {
      const res = await leggTilStoveRedaktor(stoveId, ref.current?.value ?? "");
      if ("feil" in res) return setMelding({ ok: false, tekst: res.feil });
      setMelding({ ok: true, tekst: "Redaktør lagt til!" });
      if (ref.current) ref.current.value = "";
      router.refresh();
    });
  }

  function fjern(rolleId: string) {
    if (!confirm("Fjerne redaktøren?")) return;
    startTransition(async () => {
      const res = await fjernStoveRedaktor(rolleId);
      if ("feil" in res) setMelding({ ok: false, tekst: res.feil });
      router.refresh();
    });
  }

  return (
    <div className="border-t border-kant pt-3">
      <form onSubmit={leggTil} className="flex items-center gap-2">
        <input
          ref={ref}
          required
          placeholder="brukernavn"
          className="min-w-0 flex-1 rounded-lg border border-kant bg-flate px-2.5 py-1.5 text-sm placeholder:text-dus focus:outline-none focus:ring-2 focus:ring-primar/40"
        />
        <Knapp type="submit" variant="sekundar" disabled={venter} className="px-3 py-1.5">
          {venter ? "…" : "➕"}
        </Knapp>
      </form>
      {roller.filter((r) => r.rolle === "REDAKTOR").length > 0 && (
        <ul className="mt-2 space-y-1">
          {roller
            .filter((r) => r.rolle === "REDAKTOR")
            .map((r) => (
              <li key={r.id} className="flex items-center justify-between text-xs text-dus">
                <span>✏️ {r.navn}</span>
                <button onClick={() => fjern(r.id)} className="text-negativ hover:underline cursor-pointer">
                  fjern
                </button>
              </li>
            ))}
        </ul>
      )}
      {melding && (
        <p className={`mt-2 text-xs ${melding.ok ? "text-positiv" : "text-negativ"}`}>
          {melding.tekst}
        </p>
      )}
    </div>
  );
}
