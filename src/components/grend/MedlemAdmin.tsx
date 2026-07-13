"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  behandleMedlemskap,
  endreGrendRolle,
  fjernGrendMedlem,
  inviterTilGrend,
} from "@/server/grender";
import { Knapp } from "@/components/ui/Knapp";

type Resultat = { ok: true } | { feil: string };

export function MedlemAdmin({
  medlemskapId,
  modus,
  erAdmin,
  rolle,
  erMeg,
}: {
  medlemskapId: string;
  modus: "godkjenning" | "medlem";
  erAdmin: boolean;
  rolle: "MEDLEM" | "MODERATOR" | "ADMIN";
  erMeg: boolean;
}) {
  const router = useRouter();
  const [venter, startTransition] = useTransition();
  const [feil, setFeil] = useState<string | null>(null);

  function kjor(handling: () => Promise<Resultat>) {
    setFeil(null);
    startTransition(async () => {
      const res = await handling();
      if ("feil" in res) setFeil(res.feil);
      router.refresh();
    });
  }

  if (modus === "godkjenning") {
    return (
      <div className="flex items-center gap-2">
        <Knapp disabled={venter} onClick={() => kjor(() => behandleMedlemskap(medlemskapId, true))}>
          Godkjenn
        </Knapp>
        <Knapp variant="sekundar" disabled={venter} onClick={() => kjor(() => behandleMedlemskap(medlemskapId, false))}>
          Avslå
        </Knapp>
        {feil && <p className="w-full text-sm text-negativ">{feil}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {erAdmin && (
        <select
          defaultValue={rolle}
          disabled={venter}
          onChange={(e) =>
            kjor(() => endreGrendRolle(medlemskapId, e.target.value as "MEDLEM" | "MODERATOR" | "ADMIN"))
          }
          className="rounded-lg border border-kant bg-flate px-2 py-1 text-xs text-dus"
        >
          <option value="MEDLEM">Medlem</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMIN">Admin</option>
        </select>
      )}
      {!erMeg && rolle !== "ADMIN" && (
        <button
          disabled={venter}
          onClick={() => confirm("Fjerne medlemmet fra grenda?") && kjor(() => fjernGrendMedlem(medlemskapId))}
          className="text-xs text-negativ hover:underline cursor-pointer"
        >
          Fjern
        </button>
      )}
      {feil && <p className="w-full text-sm text-negativ">{feil}</p>}
    </div>
  );
}

export function InviterSkjema({ grendId }: { grendId: string }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [venter, startTransition] = useTransition();
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null);

  function send(e: React.FormEvent) {
    e.preventDefault();
    setMelding(null);
    startTransition(async () => {
      const res = await inviterTilGrend(grendId, ref.current?.value ?? "");
      if ("feil" in res) return setMelding({ ok: false, tekst: res.feil });
      setMelding({ ok: true, tekst: "Lagt til!" });
      if (ref.current) ref.current.value = "";
      router.refresh();
    });
  }

  return (
    <form onSubmit={send} className="flex items-center gap-2">
      <input
        ref={ref}
        required
        placeholder="brukernavn"
        className="flex-1 rounded-lg border border-kant bg-flate px-3 py-2 text-sm placeholder:text-dus focus:outline-none focus:ring-2 focus:ring-primar/40"
      />
      <Knapp type="submit" variant="sekundar" disabled={venter}>
        {venter ? "…" : "Inviter"}
      </Knapp>
      {melding && (
        <p className={`w-full text-sm ${melding.ok ? "text-positiv" : "text-negativ"}`}>
          {melding.tekst}
        </p>
      )}
    </form>
  );
}
