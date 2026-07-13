"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  sendVenneforesporsel,
  godtaVenneforesporsel,
  avslaVenneforesporsel,
  trekkVenneforesporsel,
  fjernVenn,
  blokkerBruker,
  avblokkerBruker,
} from "@/server/venner";
import type { VennskapStatus } from "@/lib/venner";
import { Knapp } from "@/components/ui/Knapp";

export function VennKnapp({
  andreId,
  status,
  vennskapId,
}: {
  andreId: string;
  status: VennskapStatus;
  vennskapId?: string;
}) {
  const router = useRouter();
  const [venter, startTransition] = useTransition();
  const [feil, setFeil] = useState<string | null>(null);

  function kjor(handling: () => Promise<{ ok: true } | { feil: string }>) {
    setFeil(null);
    startTransition(async () => {
      const res = await handling();
      if ("feil" in res) setFeil(res.feil);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "ingen" && (
        <Knapp disabled={venter} onClick={() => kjor(() => sendVenneforesporsel(andreId))}>
          🤝 Legg til venn
        </Knapp>
      )}
      {status === "sendt" && (
        <Knapp variant="sekundar" disabled={venter} onClick={() => kjor(() => trekkVenneforesporsel(andreId))}>
          Trekk forespørsel
        </Knapp>
      )}
      {status === "mottatt" && vennskapId && (
        <>
          <Knapp disabled={venter} onClick={() => kjor(() => godtaVenneforesporsel(vennskapId))}>
            Godta forespørsel
          </Knapp>
          <Knapp variant="sekundar" disabled={venter} onClick={() => kjor(() => avslaVenneforesporsel(vennskapId))}>
            Avslå
          </Knapp>
        </>
      )}
      {status === "venner" && (
        <Knapp variant="sekundar" disabled={venter} onClick={() => kjor(() => fjernVenn(andreId))}>
          ✓ Venner
        </Knapp>
      )}
      {status === "blokkert_av_meg" ? (
        <Knapp variant="sekundar" disabled={venter} onClick={() => kjor(() => avblokkerBruker(andreId))}>
          Opphev blokkering
        </Knapp>
      ) : (
        status !== "blokkert" && (
          <Knapp variant="farlig" disabled={venter} onClick={() => kjor(() => blokkerBruker(andreId))}>
            Blokker
          </Knapp>
        )
      )}
      {feil && <p className="w-full text-sm text-negativ">{feil}</p>}
    </div>
  );
}
