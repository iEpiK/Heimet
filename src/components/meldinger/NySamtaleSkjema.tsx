"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startSamtale, startGruppesamtale } from "@/server/meldinger";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";
import { Inputfelt } from "@/components/ui/Felt";

export function NySamtaleSkjema() {
  const router = useRouter();
  const [gruppe, setGruppe] = useState(false);
  const [navn, setNavn] = useState("");
  const [brukernavn, setBrukernavn] = useState("");
  const [feil, setFeil] = useState<string | null>(null);
  const [venter, startTransition] = useTransition();

  function send(e: React.FormEvent) {
    e.preventDefault();
    setFeil(null);
    startTransition(async () => {
      const res = gruppe
        ? await startGruppesamtale(
            navn,
            brukernavn.split(",").map((b) => b.trim())
          )
        : await startSamtale(brukernavn.trim());
      if ("feil" in res) return setFeil(res.feil);
      router.push(`/meldinger/${res.id}`);
    });
  }

  return (
    <Kort className="p-6">
      <h1 className="text-xl font-semibold">Ny samtale</h1>
      <div className="mt-4 flex gap-1 rounded-lg bg-flate-dyp p-1">
        <button
          type="button"
          onClick={() => setGruppe(false)}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            !gruppe ? "bg-flate shadow-heim" : "text-dus"
          }`}
        >
          ✉️ Én person
        </button>
        <button
          type="button"
          onClick={() => setGruppe(true)}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            gruppe ? "bg-flate shadow-heim" : "text-dus"
          }`}
        >
          👥 Gruppe
        </button>
      </div>
      <form onSubmit={send} className="mt-4 space-y-4">
        {gruppe && (
          <Inputfelt
            etikett="Gruppenavn"
            value={navn}
            onChange={(e) => setNavn(e.target.value)}
            required
            maxLength={60}
            placeholder="F.eks. Hyttegjengen"
          />
        )}
        <Inputfelt
          etikett={gruppe ? "Brukernavn (kommaseparert)" : "Brukernavn"}
          value={brukernavn}
          onChange={(e) => setBrukernavn(e.target.value)}
          required
          placeholder={gruppe ? "kari, ola, per" : "kari"}
        />
        {feil && <p className="text-sm text-negativ">{feil}</p>}
        <Knapp type="submit" disabled={venter} className="w-full">
          {venter ? "Starter…" : "Start samtale"}
        </Knapp>
      </form>
    </Kort>
  );
}
