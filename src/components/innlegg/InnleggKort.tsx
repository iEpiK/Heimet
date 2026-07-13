import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Avatar } from "@/components/ui/Avatar";
import { Kort } from "@/components/ui/Kort";
import { FyrstikkRad } from "./FyrstikkRad";
import { InnleggMeny } from "./InnleggMeny";
import type { InnleggMedRelasjoner } from "@/lib/innlegg";
import type { FyrstikkType } from "@/generated/prisma/enums";

const synlighetIkon = {
  OFFENTLIG: { emoji: "🌍", tekst: "Alle på Heimet" },
  VENNER: { emoji: "🤝", tekst: "Kun venner" },
  GREND: { emoji: "🏘️", tekst: "Kun grenda" },
} as const;

export function InnleggKort({
  innlegg,
  megId,
  megRolle,
  kanReagere,
  visKontekst = true,
}: {
  innlegg: InnleggMedRelasjoner;
  megId: string;
  megRolle: "BRUKER" | "MODERATOR" | "ADMIN";
  kanReagere: boolean;
  visKontekst?: boolean;
}) {
  const antall: Partial<Record<FyrstikkType, number>> = {};
  let min: FyrstikkType | null = null;
  for (const f of innlegg.fyrstikker) {
    antall[f.type] = (antall[f.type] ?? 0) + 1;
    if (f.brukerId === megId) min = f.type;
  }

  const syn = synlighetIkon[innlegg.synlighet];
  const kanForvalte = innlegg.forfatterId === megId || megRolle !== "BRUKER";

  return (
    <Kort className="p-5 heim-inn">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/profil/${innlegg.forfatter.username}`}>
            <Avatar bilde={innlegg.forfatter.image} navn={innlegg.forfatter.name} />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-1.5 text-sm">
              <Link
                href={`/profil/${innlegg.forfatter.username}`}
                className="font-semibold hover:underline truncate"
              >
                {innlegg.forfatter.name}
              </Link>
              {visKontekst && innlegg.grend && (
                <>
                  <span className="text-dus">i</span>
                  <Link href={`/grender/${innlegg.grend.slug}`} className="text-primar hover:underline truncate">
                    🏘️ {innlegg.grend.navn}
                  </Link>
                </>
              )}
              {visKontekst && innlegg.stove && (
                <>
                  <span className="text-dus">via</span>
                  <Link href={`/stover/${innlegg.stove.slug}`} className="text-primar hover:underline truncate">
                    🪵 {innlegg.stove.navn}
                  </Link>
                </>
              )}
            </div>
            <div className="text-xs text-dus">
              <Link href={`/innlegg/${innlegg.id}`} className="hover:underline">
                {formatDistanceToNow(innlegg.opprettetAt, { addSuffix: true, locale: nb })}
              </Link>
              {innlegg.redigertAt && " · redigert"}
              {" · "}
              <span title={syn.tekst}>{syn.emoji}</span>
              {innlegg.feedbackPolicy === "VENNER" && (
                <span title="Kun venner kan reagere og kommentere"> · 💬🤝</span>
              )}
              {innlegg.feedbackPolicy === "INGEN" && (
                <span title="Feedback er skrudd av"> · 💬🚫</span>
              )}
            </div>
          </div>
        </div>
        {kanForvalte && <InnleggMeny innleggId={innlegg.id} erForfatter={innlegg.forfatterId === megId} />}
      </div>

      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{innlegg.innhold}</p>

      {innlegg.media.length > 0 && (
        <div className={`mt-3 grid gap-2 ${innlegg.media.length > 1 ? "grid-cols-2" : ""}`}>
          {innlegg.media.map((m) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={m.id}
              src={m.url}
              alt=""
              loading="lazy"
              className="max-h-[480px] w-full rounded-lg border border-kant object-cover"
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <FyrstikkRad
          mal={{ innleggId: innlegg.id }}
          antall={antall}
          min={min}
          kanReagere={kanReagere}
        />
        <Link
          href={`/innlegg/${innlegg.id}`}
          className="text-sm text-dus hover:text-primar transition-colors"
        >
          💬 {innlegg._count.kommentarer}{" "}
          {innlegg._count.kommentarer === 1 ? "kommentar" : "kommentarer"}
        </Link>
      </div>
    </Kort>
  );
}
