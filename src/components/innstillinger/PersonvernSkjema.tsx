"use client";

import { useState, useTransition } from "react";
import { oppdaterPersonvern } from "@/server/profil";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";
import { Velger } from "@/components/ui/Felt";

export function PersonvernSkjema({
  start,
}: {
  start: {
    standardSynlighet: "OFFENTLIG" | "VENNER";
    standardFeedback: "ALLE" | "VENNER" | "INGEN";
    bursdagSynlighet: "ALLE" | "VENNER" | "SKJULT";
    ukesbrev: boolean;
  };
}) {
  const [venter, startTransition] = useTransition();
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null);

  function send(skjema: FormData) {
    setMelding(null);
    startTransition(async () => {
      const res = await oppdaterPersonvern(skjema);
      if ("feil" in res) setMelding({ ok: false, tekst: res.feil });
      else setMelding({ ok: true, tekst: "Personverninnstillingene er lagret!" });
    });
  }

  return (
    <div className="space-y-4">
      <Kort className="p-6">
        <h2 className="text-lg font-semibold">Personvern</h2>
        <p className="mt-1 text-sm text-dus">
          Du bestemmer — og du kan overstyre alt dette per innlegg.
        </p>
        <form action={send} className="mt-6 space-y-4">
          <Velger
            etikett="Hvem ser innleggene dine? (standard)"
            name="standardSynlighet"
            defaultValue={start.standardSynlighet}
            hjelp="Forhåndsvalgt synlighet når du skriver et nytt innlegg."
          >
            <option value="VENNER">Kun venner</option>
            <option value="OFFENTLIG">Alle på Heimet</option>
          </Velger>
          <Velger
            etikett="Hvem kan reagere og kommentere? (standard)"
            name="standardFeedback"
            defaultValue={start.standardFeedback}
            hjelp="Gjelder nye innlegg — alle, kun venner, eller ingen."
          >
            <option value="ALLE">Alle som ser innlegget</option>
            <option value="VENNER">Kun venner</option>
            <option value="INGEN">Ingen (bare del, uten feedback)</option>
          </Velger>
          <Velger
            etikett="Hvem ser bursdagen din?"
            name="bursdagSynlighet"
            defaultValue={start.bursdagSynlighet}
          >
            <option value="VENNER">Kun venner</option>
            <option value="ALLE">Alle på Heimet</option>
            <option value="SKJULT">Ingen</option>
          </Velger>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="ukesbrev"
              defaultChecked={start.ukesbrev}
              className="size-4 accent-(--primar)"
            />
            Send meg ukesbrevet — en ukentlig e-post med det jeg gikk glipp av
          </label>
          {melding && (
            <p className={`text-sm ${melding.ok ? "text-positiv" : "text-negativ"}`}>
              {melding.tekst}
            </p>
          )}
          <Knapp type="submit" disabled={venter}>
            {venter ? "Lagrer…" : "Lagre"}
          </Knapp>
        </form>
      </Kort>

      <Kort className="p-6">
        <h2 className="text-lg font-semibold">Vårt løfte</h2>
        <ul className="mt-3 space-y-2 text-sm text-dus">
          <li>🚫 Vi selger aldri dataene dine — til noen, noensinne.</li>
          <li>📣 Ingen annonser, ingen sporing på tvers av nettsteder.</li>
          <li>📥 Du kan laste ned alt du har delt (kommer under «GDPR og data»).</li>
          <li>🗑️ Du kan slette kontoen din når som helst.</li>
        </ul>
      </Kort>
    </div>
  );
}
