"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { opprettStove } from "@/server/stover";
import { STOVE_KATEGORIER } from "@/lib/kategorier";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";
import { Inputfelt, Tekstfelt, Velger } from "@/components/ui/Felt";

export function StoveSkjema() {
  const router = useRouter();
  const [feil, setFeil] = useState<string | null>(null);
  const [venter, startTransition] = useTransition();

  function send(skjema: FormData) {
    setFeil(null);
    startTransition(async () => {
      const res = await opprettStove(skjema);
      if ("feil" in res) return setFeil(res.feil);
      router.push(`/stover/${res.slug}`);
    });
  }

  return (
    <Kort className="p-6">
      <h1 className="text-xl font-semibold">Reis en ny stove</h1>
      <p className="mt-1 text-sm text-dus">
        En stove er en offentlig side — for laget, foreninga, bedriften eller bandet ditt.
      </p>
      <form action={send} className="mt-6 space-y-4">
        <Inputfelt etikett="Navn" name="navn" required maxLength={60} placeholder="F.eks. Voss IL" />
        <Velger etikett="Kategori" name="kategori" defaultValue="Lag og forening">
          {STOVE_KATEGORIER.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </Velger>
        <Tekstfelt
          etikett="Beskrivelse"
          name="beskrivelse"
          rows={3}
          maxLength={1000}
          placeholder="Hva handler stova om?"
        />
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
          {venter ? "Reiser stova…" : "Opprett stove"}
        </Knapp>
      </form>
    </Kort>
  );
}
