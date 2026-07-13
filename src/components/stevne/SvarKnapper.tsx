"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { svarPaStevne, slettStevne, inviterTilStevne } from "@/server/stevner";
import { Knapp } from "@/components/ui/Knapp";
import type { StevneSvarType } from "@/generated/prisma/enums";

const valg: { svar: StevneSvarType; tekst: string; emoji: string }[] = [
  { svar: "KOMMER", tekst: "Kommer!", emoji: "✅" },
  { svar: "KANSKJE", tekst: "Kanskje", emoji: "🤔" },
  { svar: "KAN_IKKE", tekst: "Kan ikke", emoji: "😢" },
];

export function SvarKnapper({
  stevneId,
  mittSvar,
}: {
  stevneId: string;
  mittSvar: StevneSvarType | null;
}) {
  const router = useRouter();
  const [venter, startTransition] = useTransition();
  const [feil, setFeil] = useState<string | null>(null);

  function svar(s: StevneSvarType) {
    setFeil(null);
    startTransition(async () => {
      const res = await svarPaStevne(stevneId, s);
      if ("feil" in res) setFeil(res.feil);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {valg.map((v) => (
          <Knapp
            key={v.svar}
            variant={mittSvar === v.svar ? "primar" : "sekundar"}
            disabled={venter}
            onClick={() => svar(v.svar)}
          >
            {v.emoji} {v.tekst}
          </Knapp>
        ))}
      </div>
      {feil && <p className="mt-2 text-sm text-negativ">{feil}</p>}
    </div>
  );
}

export function InviterTilStevne({ stevneId }: { stevneId: string }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [venter, startTransition] = useTransition();
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null);

  function send(e: React.FormEvent) {
    e.preventDefault();
    setMelding(null);
    startTransition(async () => {
      const res = await inviterTilStevne(stevneId, ref.current?.value ?? "");
      if ("feil" in res) return setMelding({ ok: false, tekst: res.feil });
      setMelding({ ok: true, tekst: "Invitasjon sendt!" });
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
        className="min-w-0 flex-1 rounded-lg border border-kant bg-flate px-3 py-1.5 text-sm placeholder:text-dus focus:outline-none focus:ring-2 focus:ring-primar/40"
      />
      <Knapp type="submit" variant="sekundar" disabled={venter} className="px-3 py-1.5">
        {venter ? "…" : "Inviter"}
      </Knapp>
      {melding && (
        <p className={`w-full text-xs ${melding.ok ? "text-positiv" : "text-negativ"}`}>
          {melding.tekst}
        </p>
      )}
    </form>
  );
}

export function AvlysKnapp({ stevneId }: { stevneId: string }) {
  const router = useRouter();
  const [venter, startTransition] = useTransition();

  function avlys() {
    if (!confirm("Avlyse stevnet? Dette kan ikke angres.")) return;
    startTransition(async () => {
      await slettStevne(stevneId);
      router.push("/stevner");
      router.refresh();
    });
  }

  return (
    <Knapp variant="farlig" disabled={venter} onClick={avlys}>
      Avlys
    </Knapp>
  );
}
