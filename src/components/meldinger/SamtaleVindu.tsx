"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendMelding, markerSamtaleLest } from "@/server/meldinger";
import { Avatar } from "@/components/ui/Avatar";
import { Knapp } from "@/components/ui/Knapp";

type Melding = {
  id: string;
  innhold: string;
  opprettetAt: string;
  avsender: { id: string; name: string; username: string | null; image: string | null };
};

export function SamtaleVindu({
  samtaleId,
  megId,
  erGruppe,
  meldinger,
}: {
  samtaleId: string;
  megId: string;
  erGruppe: boolean;
  meldinger: Melding[];
}) {
  const router = useRouter();
  const bunn = useRef<HTMLDivElement>(null);
  const felt = useRef<HTMLTextAreaElement>(null);
  const [feil, setFeil] = useState<string | null>(null);
  const [venter, startTransition] = useTransition();

  // Rull til bunnen ved nye meldinger, og marker som lest
  useEffect(() => {
    bunn.current?.scrollIntoView({ block: "end" });
    markerSamtaleLest(samtaleId);
  }, [samtaleId, meldinger.length]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const innhold = felt.current?.value ?? "";
    if (!innhold.trim()) return;
    setFeil(null);
    startTransition(async () => {
      const res = await sendMelding(samtaleId, innhold);
      if ("feil" in res) return setFeil(res.feil);
      if (felt.current) felt.current.value = "";
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {meldinger.length === 0 && (
          <p className="py-8 text-center text-sm text-dus">
            Ingen meldinger ennå — si hei! 👋
          </p>
        )}
        {meldinger.map((m) => {
          const erMeg = m.avsender.id === megId;
          return (
            <div key={m.id} className={`flex gap-2 ${erMeg ? "justify-end" : ""}`}>
              {!erMeg && (
                <Link href={`/profil/${m.avsender.username}`} className="shrink-0 self-end">
                  <Avatar bilde={m.avsender.image} navn={m.avsender.name} storrelse="xs" />
                </Link>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                  erMeg
                    ? "rounded-br-sm bg-primar text-pa-primar"
                    : "rounded-bl-sm bg-flate-dyp"
                }`}
              >
                {erGruppe && !erMeg && (
                  <p className="text-xs font-semibold opacity-80">{m.avsender.name}</p>
                )}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.innhold}</p>
                <p className={`mt-0.5 text-right text-[10px] ${erMeg ? "opacity-70" : "text-dus"}`}>
                  {new Date(m.opprettetAt).toLocaleTimeString("nb-NO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bunn} />
      </div>
      <form onSubmit={send} className="flex items-end gap-2 border-t border-kant p-3">
        <textarea
          ref={felt}
          rows={1}
          required
          maxLength={5000}
          placeholder="Skriv en melding…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-kant bg-flate px-3.5 py-2 text-sm placeholder:text-dus focus:outline-none focus:ring-2 focus:ring-primar/40"
        />
        <Knapp type="submit" disabled={venter} className="px-3.5">
          {venter ? "…" : "Send"}
        </Knapp>
        {feil && <p className="w-full text-sm text-negativ">{feil}</p>}
      </form>
    </>
  );
}
