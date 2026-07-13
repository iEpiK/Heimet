"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { oppdaterProfil } from "@/server/profil";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";
import { Inputfelt, Tekstfelt } from "@/components/ui/Felt";
import { Avatar } from "@/components/ui/Avatar";

export function ProfilSkjema({
  start,
}: {
  start: {
    navn: string;
    bio: string;
    kommune: string;
    fodselsdato: string;
    avatar?: string | null;
    cover?: string | null;
  };
}) {
  const router = useRouter();
  const [venter, startTransition] = useTransition();
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null);

  function send(skjema: FormData) {
    setMelding(null);
    startTransition(async () => {
      const res = await oppdaterProfil(skjema);
      if ("feil" in res) setMelding({ ok: false, tekst: res.feil });
      else {
        setMelding({ ok: true, tekst: "Profilen er oppdatert!" });
        router.refresh();
      }
    });
  }

  return (
    <Kort className="p-6">
      <h2 className="text-lg font-semibold">Profil</h2>
      <p className="mt-1 text-sm text-dus">
        Slik ser andre deg på Heimet.
      </p>
      <form action={send} className="mt-6 space-y-4">
        <div className="flex items-center gap-4">
          <Avatar bilde={start.avatar} navn={start.navn} storrelse="lg" />
          <div className="flex-1">
            <label className="block text-sm font-medium">Profilbilde</label>
            <input
              type="file"
              name="avatar"
              accept="image/*"
              className="mt-1.5 block w-full text-sm text-dus file:mr-3 file:rounded-lg file:border file:border-kant file:bg-flate file:px-3 file:py-1.5 file:text-sm file:text-tekst file:cursor-pointer"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Forsidebilde</label>
          <input
            type="file"
            name="cover"
            accept="image/*"
            className="mt-1.5 block w-full text-sm text-dus file:mr-3 file:rounded-lg file:border file:border-kant file:bg-flate file:px-3 file:py-1.5 file:text-sm file:text-tekst file:cursor-pointer"
          />
        </div>
        <Inputfelt etikett="Fullt navn" name="navn" defaultValue={start.navn} required maxLength={80} />
        <Tekstfelt
          etikett="Om meg"
          name="bio"
          defaultValue={start.bio}
          rows={4}
          maxLength={500}
          placeholder="Fortell litt om deg selv…"
        />
        <Inputfelt
          etikett="Kommune"
          name="kommune"
          defaultValue={start.kommune}
          maxLength={60}
          placeholder="F.eks. Voss"
        />
        <Inputfelt
          etikett="Fødselsdato (for bursdagshilsener 🎂)"
          type="date"
          name="fodselsdato"
          defaultValue={start.fodselsdato}
        />
        {melding && (
          <p className={`text-sm ${melding.ok ? "text-positiv" : "text-negativ"}`}>
            {melding.tekst}
          </p>
        )}
        <Knapp type="submit" disabled={venter}>
          {venter ? "Lagrer…" : "Lagre profil"}
        </Knapp>
      </form>
    </Kort>
  );
}
