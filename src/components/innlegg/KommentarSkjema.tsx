"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { opprettKommentar } from "@/server/innlegg";
import { Knapp } from "@/components/ui/Knapp";

export function KommentarSkjema({
  innleggId,
  parentId,
  vedSendt,
  autoFokus,
}: {
  innleggId: string;
  parentId?: string;
  vedSendt?: () => void;
  autoFokus?: boolean;
}) {
  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [venter, startTransition] = useTransition();
  const [feil, setFeil] = useState<string | null>(null);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const innhold = ref.current?.value ?? "";
    setFeil(null);
    startTransition(async () => {
      const res = await opprettKommentar(innleggId, { innhold, parentId });
      if ("feil" in res) return setFeil(res.feil);
      if (ref.current) ref.current.value = "";
      vedSendt?.();
      router.refresh();
    });
  }

  return (
    <form onSubmit={send} className="flex items-start gap-2">
      <textarea
        ref={ref}
        rows={1}
        required
        maxLength={2000}
        autoFocus={autoFokus}
        placeholder={parentId ? "Skriv et svar…" : "Skriv en kommentar…"}
        className="min-h-9 flex-1 resize-y rounded-lg border border-kant bg-flate px-3 py-1.5 text-sm placeholder:text-dus focus:outline-none focus:ring-2 focus:ring-primar/40"
      />
      <Knapp type="submit" variant="sekundar" disabled={venter} className="px-3 py-1.5">
        {venter ? "…" : "Svar"}
      </Knapp>
      {feil && <p className="w-full text-sm text-negativ">{feil}</p>}
    </form>
  );
}
