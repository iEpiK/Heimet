"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authFeil } from "@/lib/auth-feil";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";
import { Inputfelt } from "@/components/ui/Felt";

function TilbakestillSkjema() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [passord, setPassord] = useState("");
  const [feil, setFeil] = useState<string | null>(null);
  const [laster, setLaster] = useState(false);

  async function tilbakestill(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return setFeil("Lenken mangler token. Be om en ny.");
    setFeil(null);
    setLaster(true);
    const { error } = await authClient.resetPassword({
      newPassword: passord,
      token,
    });
    setLaster(false);
    if (error) return setFeil(authFeil(error));
    router.push("/logg-inn?tilbakestilt=1");
  }

  return (
    <Kort className="p-8">
      <h1 className="text-2xl font-semibold">Velg nytt passord</h1>
      <form onSubmit={tilbakestill} className="mt-6 space-y-4">
        <Inputfelt
          etikett="Nytt passord (minst 10 tegn)"
          type="password"
          value={passord}
          onChange={(e) => setPassord(e.target.value)}
          required
          minLength={10}
          autoComplete="new-password"
        />
        {feil && <p className="text-sm text-negativ">{feil}</p>}
        <Knapp type="submit" disabled={laster} className="w-full">
          {laster ? "Lagrer…" : "Lagre nytt passord"}
        </Knapp>
      </form>
    </Kort>
  );
}

export default function TilbakestillPassordSide() {
  return (
    <Suspense>
      <TilbakestillSkjema />
    </Suspense>
  );
}
