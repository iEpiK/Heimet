"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { authFeil } from "@/lib/auth-feil";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";
import { Inputfelt } from "@/components/ui/Felt";

export default function RegistrerSide() {
  const [navn, setNavn] = useState("");
  const [brukernavn, setBrukernavn] = useState("");
  const [epost, setEpost] = useState("");
  const [passord, setPassord] = useState("");
  const [feil, setFeil] = useState<string | null>(null);
  const [laster, setLaster] = useState(false);
  const [sendt, setSendt] = useState(false);

  async function registrer(e: React.FormEvent) {
    e.preventDefault();
    setFeil(null);
    setLaster(true);
    const { error } = await authClient.signUp.email({
      name: navn.trim(),
      username: brukernavn.trim().toLowerCase(),
      email: epost.trim(),
      password: passord,
      callbackURL: "/tunet",
    });
    setLaster(false);
    if (error) return setFeil(authFeil(error));
    setSendt(true);
  }

  if (sendt) {
    return (
      <Kort className="p-8 text-center">
        <div className="text-4xl">📬</div>
        <h1 className="mt-4 text-xl font-semibold">Sjekk innboksen din!</h1>
        <p className="mt-2 text-sm text-dus">
          Vi har sendt en bekreftelseslenke til <strong>{epost}</strong>. Klikk
          på den, så er du innenfor.
        </p>
      </Kort>
    );
  }

  return (
    <Kort className="p-8">
      <h1 className="text-2xl font-semibold">Bli med i Heimet</h1>
      <p className="mt-1 text-sm text-dus">
        Gratis, uten annonser — og dataene dine forblir dine.
      </p>
      <form onSubmit={registrer} className="mt-6 space-y-4">
        <Inputfelt
          etikett="Fullt navn"
          value={navn}
          onChange={(e) => setNavn(e.target.value)}
          required
          autoComplete="name"
          placeholder="Kari Nordmann"
        />
        <Inputfelt
          etikett="Brukernavn"
          value={brukernavn}
          onChange={(e) => setBrukernavn(e.target.value)}
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9._\-]+"
          autoComplete="username"
          placeholder="kari"
        />
        <Inputfelt
          etikett="E-post"
          type="email"
          value={epost}
          onChange={(e) => setEpost(e.target.value)}
          required
          autoComplete="email"
          placeholder="kari@example.no"
        />
        <Inputfelt
          etikett="Passord (minst 10 tegn)"
          type="password"
          value={passord}
          onChange={(e) => setPassord(e.target.value)}
          required
          minLength={10}
          autoComplete="new-password"
        />
        {feil && <p className="text-sm text-negativ">{feil}</p>}
        <Knapp type="submit" disabled={laster} className="w-full">
          {laster ? "Oppretter konto…" : "Opprett konto"}
        </Knapp>
      </form>
      <p className="mt-4 text-center text-sm text-dus">
        Har du konto fra før?{" "}
        <Link href="/logg-inn" className="text-primar hover:underline">
          Logg inn
        </Link>
      </p>
    </Kort>
  );
}
