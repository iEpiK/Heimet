import { Avatar } from "@/components/ui/Avatar";
import { Kort } from "@/components/ui/Kort";
import { BalSvarSkjema } from "./BalSvarSkjema";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";

export function BalPanel({
  bal,
  megId,
  erMedlem,
}: {
  bal: {
    id: string;
    sporsmal: string;
    uke: number;
    svar: {
      id: string;
      innhold: string;
      opprettetAt: Date;
      bruker: { id: string; name: string; username: string | null; image: string | null };
    }[];
  };
  megId: string;
  erMedlem: boolean;
}) {
  const harSvart = bal.svar.some((s) => s.bruker.id === megId);

  return (
    <Kort className="border-gull/40 p-5">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🔥</span>
        <div>
          <h2 className="font-semibold">Ukas bål — uke {bal.uke}</h2>
          <p className="text-xs text-dus">Et spørsmål i uka, rundt bålet. Alle svar teller like mye.</p>
        </div>
      </div>
      <p className="mt-3 text-[15px] font-medium">«{bal.sporsmal}»</p>

      {bal.svar.length > 0 && (
        <ul className="mt-4 space-y-3">
          {bal.svar.map((s) => (
            <li key={s.id} className="flex gap-2.5">
              <Link href={`/profil/${s.bruker.username}`} className="shrink-0 pt-0.5">
                <Avatar bilde={s.bruker.image} navn={s.bruker.name} storrelse="sm" />
              </Link>
              <div className="min-w-0 flex-1 rounded-xl bg-flate-dyp px-3 py-2">
                <div className="flex items-baseline gap-2">
                  <Link href={`/profil/${s.bruker.username}`} className="text-sm font-semibold hover:underline">
                    {s.bruker.name}
                  </Link>
                  <span className="text-xs text-dus">
                    {formatDistanceToNow(s.opprettetAt, { addSuffix: true, locale: nb })}
                  </span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm">{s.innhold}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {erMedlem ? (
        <div className="mt-4">
          <BalSvarSkjema balId={bal.id} harSvart={harSvart} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-dus">Bli medlem for å sette deg rundt bålet.</p>
      )}
    </Kort>
  );
}
