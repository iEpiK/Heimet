"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { opprettGrend } from "@/server/grender";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";
import { Inputfelt, Tekstfelt, Velger } from "@/components/ui/Felt";

export function GrendSkjema() {
  const router = useRouter();
  const [feil, setFeil] = useState<string | null>(null);
  const [venter, startTransition] = useTransition();

  function send(skjema: FormData) {
    setFeil(null);
    startTransition(async () => {
      const res = await opprettGrend(skjema);
      if ("feil" in res) return setFeil(res.feil);
      router.push(`/grender/${res.slug}`);
    });
  }

  return (
    <Kort className="p-6">
      <h1 className="text-xl font-semibold">Start en ny grend</h1>
      <p className="mt-1 text-sm text-dus">
        En grend er et lite fellesskap — du blir automatisk admin.
      </p>
      <form action={send} className="mt-6 space-y-4">
        <Inputfelt etikett="Navn" name="navn" required maxLength={60} placeholder="F.eks. Turgjengen i Voss" />
        <Tekstfelt
          etikett="Beskrivelse"
          name="beskrivelse"
          rows={3}
          maxLength={1000}
          placeholder="Hva samles dere om?"
        />
        <Velger
          etikett="Type"
          name="type"
          defaultValue="AAPEN"
          hjelp="Åpen: alle kan bli med. Lukket: medlemskap må godkjennes. Skjult: kun på invitasjon, vises ikke i lister."
        >
          <option value="AAPEN">Åpen</option>
          <option value="LUKKET">Lukket</option>
          <option value="SKJULT">Skjult</option>
        </Velger>
        <Inputfelt etikett="Kommune (valgfritt)" name="kommune" maxLength={60} placeholder="F.eks. Voss" />
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
          {venter ? "Oppretter…" : "Opprett grend"}
        </Knapp>
      </form>
    </Kort>
  );
}
