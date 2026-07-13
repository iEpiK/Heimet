"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { opprettStevne } from "@/server/stevner";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";
import { Inputfelt, Tekstfelt, Velger } from "@/components/ui/Felt";

export function StevneSkjema({
  grend,
  stove,
  standardSynlighet,
}: {
  grend: { id: string; navn: string; type: string } | null;
  stove: { id: string; navn: string } | null;
  standardSynlighet: "OFFENTLIG" | "VENNER";
}) {
  const router = useRouter();
  const [feil, setFeil] = useState<string | null>(null);
  const [venter, startTransition] = useTransition();

  function send(skjema: FormData) {
    setFeil(null);
    if (grend) skjema.set("grendId", grend.id);
    if (stove) skjema.set("stoveId", stove.id);
    startTransition(async () => {
      const res = await opprettStevne(skjema);
      if ("feil" in res) return setFeil(res.feil);
      router.push(`/stevner/${res.id}`);
    });
  }

  return (
    <Kort className="p-6">
      <h1 className="text-xl font-semibold">Arranger et stevne</h1>
      <p className="mt-1 text-sm text-dus">
        {grend
          ? `Stevnet knyttes til grenda ${grend.navn}.`
          : stove
            ? `Stevnet publiseres via stova ${stove.navn}.`
            : "Alt fra kaffeslabberas til fjelltur."}
      </p>
      <form action={send} className="mt-6 space-y-4">
        <Inputfelt etikett="Tittel" name="tittel" required maxLength={100} placeholder="F.eks. Søndagstur til Hanguren" />
        <Tekstfelt etikett="Beskrivelse" name="beskrivelse" rows={3} maxLength={2000} placeholder="Hva skjer? Ta med niste?" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Inputfelt etikett="Start" type="datetime-local" name="start" required />
          <Inputfelt etikett="Slutt (valgfritt)" type="datetime-local" name="slutt" />
        </div>
        <Inputfelt etikett="Sted" name="sted" maxLength={120} placeholder="F.eks. Voss stasjon" />
        {!stove && (
          <Velger
            etikett="Hvem kan se stevnet?"
            name="synlighet"
            defaultValue={grend ? "GREND" : standardSynlighet}
          >
            {grend ? (
              <>
                <option value="GREND">🏘️ Kun grenda</option>
                {grend.type === "AAPEN" && <option value="OFFENTLIG">🌍 Alle på Heimet</option>}
              </>
            ) : (
              <>
                <option value="VENNER">🤝 Kun venner</option>
                <option value="OFFENTLIG">🌍 Alle på Heimet</option>
              </>
            )}
          </Velger>
        )}
        <div>
          <label className="block text-sm font-medium">Forsidebilde (valgfritt)</label>
          <input
            type="file"
            name="cover"
            accept="image/*"
            className="mt-1.5 block w-full text-sm text-dus file:mr-3 file:rounded-lg file:border file:border-kant file:bg-flate file:px-3 file:py-1.5 file:text-sm file:text-tekst file:cursor-pointer"
          />
        </div>
        {feil && <p className="text-sm text-negativ">{feil}</p>}
        <Knapp type="submit" disabled={venter}>
          {venter ? "Oppretter…" : "Opprett stevne"}
        </Knapp>
      </form>
    </Kort>
  );
}
