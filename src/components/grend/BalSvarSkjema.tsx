"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { svarPaBal } from "@/server/grender";
import { Knapp } from "@/components/ui/Knapp";

export function BalSvarSkjema({ balId, harSvart }: { balId: string; harSvart: boolean }) {
  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [feil, setFeil] = useState<string | null>(null);
  const [venter, startTransition] = useTransition();

  function send(e: React.FormEvent) {
    e.preventDefault();
    setFeil(null);
    startTransition(async () => {
      const res = await svarPaBal(balId, ref.current?.value ?? "");
      if ("feil" in res) return setFeil(res.feil);
      if (ref.current) ref.current.value = "";
      router.refresh();
    });
  }

  return (
    <form onSubmit={send} className="flex items-start gap-2">
      <textarea
        ref={ref}
        rows={1}
        required
        maxLength={1000}
        placeholder={harSvart ? "Legg til enda et svar…" : "Ditt svar rundt bålet…"}
        className="min-h-9 flex-1 resize-y rounded-lg border border-kant bg-flate px-3 py-1.5 text-sm placeholder:text-dus focus:outline-none focus:ring-2 focus:ring-primar/40"
      />
      <Knapp type="submit" variant="sekundar" disabled={venter} className="px-3 py-1.5">
        {venter ? "…" : "🔥 Svar"}
      </Knapp>
      {feil && <p className="w-full text-sm text-negativ">{feil}</p>}
    </form>
  );
}
