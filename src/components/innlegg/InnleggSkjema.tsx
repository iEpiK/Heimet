"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { opprettInnlegg } from "@/server/innlegg";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";

export function InnleggSkjema({
  standardSynlighet,
  standardFeedback,
  grendId,
  stoveId,
  grendErAapen,
  plassholder = "Hva skjer på tunet ditt?",
}: {
  standardSynlighet: "OFFENTLIG" | "VENNER" | "GREND";
  standardFeedback: "ALLE" | "VENNER" | "INGEN";
  grendId?: string;
  stoveId?: string;
  grendErAapen?: boolean;
  plassholder?: string;
}) {
  const router = useRouter();
  const skjemaRef = useRef<HTMLFormElement>(null);
  const [venter, startTransition] = useTransition();
  const [feil, setFeil] = useState<string | null>(null);
  const [antallBilder, setAntallBilder] = useState(0);

  function send(skjema: FormData) {
    setFeil(null);
    if (grendId) skjema.set("grendId", grendId);
    if (stoveId) skjema.set("stoveId", stoveId);
    startTransition(async () => {
      const res = await opprettInnlegg(skjema);
      if ("feil" in res) return setFeil(res.feil);
      skjemaRef.current?.reset();
      setAntallBilder(0);
      router.refresh();
    });
  }

  // I grend-kontekst: åpne grender kan velge offentlig; ellers låst til grenda.
  // I stove-kontekst: alltid offentlig.
  const synlighetsvalg = stoveId
    ? [{ verdi: "OFFENTLIG", tekst: "🌍 Alle (stover er offentlige)" }]
    : grendId
      ? grendErAapen
        ? [
            { verdi: "GREND", tekst: "🏘️ Kun grenda" },
            { verdi: "OFFENTLIG", tekst: "🌍 Alle på Heimet" },
          ]
        : [{ verdi: "GREND", tekst: "🏘️ Kun grenda" }]
      : [
          { verdi: "VENNER", tekst: "🤝 Kun venner" },
          { verdi: "OFFENTLIG", tekst: "🌍 Alle på Heimet" },
        ];

  const standardValg = synlighetsvalg.some((v) => v.verdi === standardSynlighet)
    ? standardSynlighet
    : synlighetsvalg[0].verdi;

  return (
    <Kort className="p-5">
      <form ref={skjemaRef} action={send} className="space-y-3">
        <textarea
          name="innhold"
          rows={3}
          required
          maxLength={5000}
          placeholder={plassholder}
          className="w-full resize-y rounded-lg border border-kant bg-flate px-3 py-2 text-[15px] placeholder:text-dus focus:outline-none focus:ring-2 focus:ring-primar/40 focus:border-primar"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            name="synlighet"
            defaultValue={standardValg}
            title="Hvem ser innlegget?"
            className="rounded-lg border border-kant bg-flate px-2 py-1.5 text-xs text-dus focus:outline-none"
          >
            {synlighetsvalg.map((v) => (
              <option key={v.verdi} value={v.verdi}>
                {v.tekst}
              </option>
            ))}
          </select>
          <select
            name="feedbackPolicy"
            defaultValue={standardFeedback}
            title="Hvem kan reagere og kommentere?"
            className="rounded-lg border border-kant bg-flate px-2 py-1.5 text-xs text-dus focus:outline-none"
          >
            <option value="ALLE">💬 Alle kan svare</option>
            <option value="VENNER">💬 Kun venner kan svare</option>
            <option value="INGEN">💬 Ingen feedback</option>
          </select>
          <label className="cursor-pointer rounded-lg border border-kant bg-flate px-2 py-1.5 text-xs text-dus hover:border-primar">
            📷 {antallBilder > 0 ? `${antallBilder} bilde${antallBilder > 1 ? "r" : ""}` : "Bilder"}
            <input
              type="file"
              name="bilder"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => setAntallBilder(e.target.files?.length ?? 0)}
            />
          </label>
          <div className="flex-1" />
          <Knapp type="submit" disabled={venter}>
            {venter ? "Deler…" : "Del"}
          </Knapp>
        </div>
        {feil && <p className="text-sm text-negativ">{feil}</p>}
      </form>
    </Kort>
  );
}
