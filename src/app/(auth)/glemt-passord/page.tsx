"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { authFeil } from "@/lib/auth-feil";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";
import { Inputfelt } from "@/components/ui/Felt";

export default function GlemtPassordSide() {
  const [epost, setEpost] = useState("");
  const [feil, setFeil] = useState<string | null>(null);
  const [laster, setLaster] = useState(false);
  const [sendt, setSendt] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setFeil(null);
    setLaster(true);
    const { error } = await authClient.requestPasswordReset({
      email: epost.trim(),
      redirectTo: "/tilbakestill-passord",
    });
    setLaster(false);
    if (error) return setFeil(authFeil(error));
    setSendt(true);
  }

  if (sendt) {
    return (
      <Kort className="p-8 text-center">
        <div className="text-4xl">📬</div>
        <h1 className="mt-4 text-xl font-semibold">Sjekk innboksen din</h1>
        <p className="mt-2 text-sm text-dus">
          Hvis det finnes en konto for <strong>{epost}</strong>, har vi sendt en
          lenke for å tilbakestille passordet.
        </p>
      </Kort>
    );
  }

  return (
    <Kort className="p-8">
      <h1 className="text-2xl font-semibold">Glemt passordet?</h1>
      <p className="mt-1 text-sm text-dus">
        Ikke noe stress — vi sender deg en lenke så du kan velge et nytt.
      </p>
      <form onSubmit={send} className="mt-6 space-y-4">
        <Inputfelt
          etikett="E-post"
          type="email"
          value={epost}
          onChange={(e) => setEpost(e.target.value)}
          required
          autoComplete="email"
        />
        {feil && <p className="text-sm text-negativ">{feil}</p>}
        <Knapp type="submit" disabled={laster} className="w-full">
          {laster ? "Sender…" : "Send lenke"}
        </Knapp>
      </form>
    </Kort>
  );
}
