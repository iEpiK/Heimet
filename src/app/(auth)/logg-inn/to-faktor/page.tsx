"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authFeil } from "@/lib/auth-feil";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";
import { Inputfelt } from "@/components/ui/Felt";

export default function ToFaktorSide() {
  const router = useRouter();
  const [kode, setKode] = useState("");
  const [brukBackup, setBrukBackup] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const [laster, setLaster] = useState(false);

  async function bekreft(e: React.FormEvent) {
    e.preventDefault();
    setFeil(null);
    setLaster(true);
    const { error } = brukBackup
      ? await authClient.twoFactor.verifyBackupCode({ code: kode.trim() })
      : await authClient.twoFactor.verifyTotp({ code: kode.trim() });
    setLaster(false);
    if (error) return setFeil(authFeil(error));
    router.push("/tunet");
    router.refresh();
  }

  return (
    <Kort className="p-8">
      <h1 className="text-2xl font-semibold">Tofaktor-bekreftelse</h1>
      <p className="mt-1 text-sm text-dus">
        {brukBackup
          ? "Skriv inn en av reservekodene dine."
          : "Skriv inn koden fra autentiserings-appen din."}
      </p>
      <form onSubmit={bekreft} className="mt-6 space-y-4">
        <Inputfelt
          etikett={brukBackup ? "Reservekode" : "Engangskode"}
          value={kode}
          onChange={(e) => setKode(e.target.value)}
          required
          inputMode={brukBackup ? "text" : "numeric"}
          autoComplete="one-time-code"
          placeholder={brukBackup ? "" : "123456"}
        />
        {feil && <p className="text-sm text-negativ">{feil}</p>}
        <Knapp type="submit" disabled={laster} className="w-full">
          {laster ? "Bekrefter…" : "Bekreft"}
        </Knapp>
      </form>
      <button
        type="button"
        onClick={() => setBrukBackup((v) => !v)}
        className="mt-4 w-full text-center text-sm text-dus hover:text-primar cursor-pointer"
      >
        {brukBackup ? "Bruk kode fra appen i stedet" : "Mistet appen? Bruk reservekode"}
      </button>
    </Kort>
  );
}
