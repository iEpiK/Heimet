"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authFeil } from "@/lib/auth-feil";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";
import { Inputfelt } from "@/components/ui/Felt";

export default function LoggInnSide() {
  const router = useRouter();
  const [identifikator, setIdentifikator] = useState("");
  const [passord, setPassord] = useState("");
  const [feil, setFeil] = useState<string | null>(null);
  const [laster, setLaster] = useState(false);

  async function loggInn(e: React.FormEvent) {
    e.preventDefault();
    setFeil(null);
    setLaster(true);
    const id = identifikator.trim();
    const { error } = id.includes("@")
      ? await authClient.signIn.email({ email: id, password: passord })
      : await authClient.signIn.username({
          username: id.toLowerCase(),
          password: passord,
        });
    setLaster(false);
    if (error) return setFeil(authFeil(error));
    router.push("/tunet");
    router.refresh();
  }

  async function loggInnMedPasskey() {
    setFeil(null);
    const res = await authClient.signIn.passkey();
    if (res?.error) return setFeil(authFeil(res.error));
    router.push("/tunet");
    router.refresh();
  }

  return (
    <Kort className="p-8">
      <h1 className="text-2xl font-semibold">Velkommen heim</h1>
      <p className="mt-1 text-sm text-dus">Logg inn for å komme til tunet.</p>
      <form onSubmit={loggInn} className="mt-6 space-y-4">
        <Inputfelt
          etikett="E-post eller brukernavn"
          value={identifikator}
          onChange={(e) => setIdentifikator(e.target.value)}
          required
          autoComplete="username"
        />
        <div className="space-y-1.5">
          <Inputfelt
            etikett="Passord"
            type="password"
            value={passord}
            onChange={(e) => setPassord(e.target.value)}
            required
            autoComplete="current-password"
          />
          <div className="text-right">
            <Link href="/glemt-passord" className="text-xs text-dus hover:text-primar">
              Glemt passordet?
            </Link>
          </div>
        </div>
        {feil && <p className="text-sm text-negativ">{feil}</p>}
        <Knapp type="submit" disabled={laster} className="w-full">
          {laster ? "Logger inn…" : "Logg inn"}
        </Knapp>
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-dus">
        <span className="h-px flex-1 bg-kant" />
        eller
        <span className="h-px flex-1 bg-kant" />
      </div>
      <Knapp variant="sekundar" onClick={loggInnMedPasskey} className="w-full">
        🔑 Logg inn med passnøkkel
      </Knapp>
      <p className="mt-4 text-center text-sm text-dus">
        Ny her?{" "}
        <Link href="/registrer" className="text-primar hover:underline">
          Opprett konto
        </Link>
      </p>
    </Kort>
  );
}
