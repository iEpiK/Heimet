import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Avatar } from "@/components/ui/Avatar";
import { FyrstikkRad } from "./FyrstikkRad";
import { KommentarHandlinger } from "./KommentarHandlinger";
import type { FyrstikkType } from "@/generated/prisma/enums";

export type KommentarMedRelasjoner = {
  id: string;
  innleggId: string;
  innhold: string;
  parentId: string | null;
  opprettetAt: Date;
  forfatterId: string;
  forfatter: { id: string; name: string; username: string | null; image: string | null };
  fyrstikker: { type: FyrstikkType; brukerId: string }[];
};

function EnKommentar({
  kommentar,
  megId,
  kanSlette,
  kanReagere,
  kanSvare,
  barn,
}: {
  kommentar: KommentarMedRelasjoner;
  megId: string;
  kanSlette: boolean;
  kanReagere: boolean;
  kanSvare: boolean;
  barn?: React.ReactNode;
}) {
  const antall: Partial<Record<FyrstikkType, number>> = {};
  let min: FyrstikkType | null = null;
  for (const f of kommentar.fyrstikker) {
    antall[f.type] = (antall[f.type] ?? 0) + 1;
    if (f.brukerId === megId) min = f.type;
  }

  return (
    <div className="flex gap-2.5">
      <Link href={`/profil/${kommentar.forfatter.username}`} className="shrink-0 pt-0.5">
        <Avatar bilde={kommentar.forfatter.image} navn={kommentar.forfatter.name} storrelse="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="rounded-xl bg-flate-dyp px-3 py-2">
          <div className="flex items-baseline gap-2">
            <Link
              href={`/profil/${kommentar.forfatter.username}`}
              className="text-sm font-semibold hover:underline"
            >
              {kommentar.forfatter.name}
            </Link>
            <span className="text-xs text-dus">
              {formatDistanceToNow(kommentar.opprettetAt, { addSuffix: true, locale: nb })}
            </span>
          </div>
          <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">{kommentar.innhold}</p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <FyrstikkRad
            mal={{ kommentarId: kommentar.id }}
            antall={antall}
            min={min}
            kanReagere={kanReagere}
          />
          <KommentarHandlinger
            innleggId={kommentar.innleggId}
            kommentarId={kommentar.id}
            parentId={kommentar.parentId ?? kommentar.id}
            kanSlette={kanSlette}
            kanSvare={kanSvare}
          />
        </div>
        {barn}
      </div>
    </div>
  );
}

export function KommentarTre({
  kommentarer,
  megId,
  megRolle,
  innleggForfatterId,
  kanReagere,
  kanSvare,
}: {
  kommentarer: KommentarMedRelasjoner[];
  megId: string;
  megRolle: "BRUKER" | "MODERATOR" | "ADMIN";
  innleggForfatterId: string;
  kanReagere: boolean;
  kanSvare: boolean;
}) {
  const topp = kommentarer.filter((k) => !k.parentId);
  const svarTil = new Map<string, KommentarMedRelasjoner[]>();
  for (const k of kommentarer) {
    if (k.parentId) {
      const liste = svarTil.get(k.parentId) ?? [];
      liste.push(k);
      svarTil.set(k.parentId, liste);
    }
  }

  const kanSlette = (k: KommentarMedRelasjoner) =>
    k.forfatterId === megId || innleggForfatterId === megId || megRolle !== "BRUKER";

  return (
    <div className="space-y-4">
      {topp.map((k) => (
        <EnKommentar
          key={k.id}
          kommentar={k}
          megId={megId}
          kanSlette={kanSlette(k)}
          kanReagere={kanReagere}
          kanSvare={kanSvare}
          barn={
            (svarTil.get(k.id) ?? []).length > 0 && (
              <div className="mt-3 space-y-3 border-l-2 border-kant pl-3">
                {(svarTil.get(k.id) ?? []).map((svar) => (
                  <EnKommentar
                    key={svar.id}
                    kommentar={svar}
                    megId={megId}
                    kanSlette={kanSlette(svar)}
                    kanReagere={kanReagere}
                    kanSvare={kanSvare}
                  />
                ))}
              </div>
            )
          }
        />
      ))}
    </div>
  );
}
