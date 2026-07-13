"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { redigerInnlegg } from "@/server/innlegg";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";

export function RedigerSkjema({
  innleggId,
  innhold,
}: {
  innleggId: string;
  innhold: string;
}) {
  const router = useRouter();
  const [tekst, setTekst] = useState(innhold);
  const [feil, setFeil] = useState<string | null>(null);
  const [venter, startTransition] = useTransition();

  function lagre(e: React.FormEvent) {
    e.preventDefault();
    setFeil(null);
    startTransition(async () => {
      const res = await redigerInnlegg(innleggId, tekst);
      if ("feil" in res) return setFeil(res.feil);
      router.push(`/innlegg/${innleggId}`);
      router.refresh();
    });
  }

  return (
    <Kort className="p-5">
      <h1 className="text-lg font-semibold">Rediger innlegg</h1>
      <form onSubmit={lagre} className="mt-4 space-y-3">
        <textarea
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          rows={6}
          required
          maxLength={5000}
          className="w-full resize-y rounded-lg border border-kant bg-flate px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-primar/40"
        />
        {feil && <p className="text-sm text-negativ">{feil}</p>}
        <div className="flex gap-2">
          <Knapp type="submit" disabled={venter}>
            {venter ? "Lagrer…" : "Lagre"}
          </Knapp>
          <Knapp type="button" variant="sekundar" onClick={() => router.back()}>
            Avbryt
          </Knapp>
        </div>
      </form>
    </Kort>
  );
}
