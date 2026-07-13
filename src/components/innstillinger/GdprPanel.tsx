"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { slettKonto, angreSletting } from "@/server/konto";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";

export function GdprPanel({ slettesAt }: { slettesAt: string | null }) {
  const router = useRouter();
  const [bekreft, setBekreft] = useState("");
  const [venter, startTransition] = useTransition();

  function slett() {
    startTransition(async () => {
      await slettKonto();
      router.refresh();
    });
  }

  function angre() {
    startTransition(async () => {
      await angreSletting();
      router.refresh();
    });
  }

  return (
    <Kort className="p-6">
      <h2 className="text-lg font-semibold">GDPR og dataene dine</h2>

      <div className="mt-4 space-y-5">
        <div>
          <h3 className="text-sm font-medium">📥 Last ned dataene dine</h3>
          <p className="mt-1 text-sm text-dus">
            Alt du har delt på Heimet, samlet i én JSON-fil.
          </p>
          <a href="/api/eksport" download className="mt-2 inline-block">
            <Knapp variant="sekundar">Last ned eksport</Knapp>
          </a>
        </div>

        <div className="border-t border-kant pt-5">
          <h3 className="text-sm font-medium text-negativ">🗑️ Slett kontoen din</h3>
          {slettesAt ? (
            <div className="mt-2">
              <p className="text-sm">
                Kontoen din er skjult for alle andre og slettes permanent{" "}
                <strong>{new Date(slettesAt).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })}</strong>.
              </p>
              <Knapp onClick={angre} disabled={venter} className="mt-3">
                Angre slettingen
              </Knapp>
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm text-dus">
                Kontoen skjules umiddelbart og slettes permanent etter 30 dager.
                Innen da kan du angre ved å logge inn igjen.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={bekreft}
                  onChange={(e) => setBekreft(e.target.value)}
                  placeholder="Skriv SLETT for å bekrefte"
                  className="rounded-lg border border-kant bg-flate px-3 py-2 text-sm placeholder:text-dus focus:outline-none focus:ring-2 focus:ring-negativ/40"
                />
                <Knapp
                  variant="farlig"
                  disabled={venter || bekreft !== "SLETT"}
                  onClick={slett}
                >
                  {venter ? "Sletter…" : "Slett kontoen min"}
                </Knapp>
              </div>
            </>
          )}
        </div>
      </div>
    </Kort>
  );
}
