import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { krevModerator } from "@/lib/session";
import { Kort } from "@/components/ui/Kort";
import { Merkelapp } from "@/components/ui/Merkelapp";
import { RapportHandlinger } from "@/components/admin/RapportHandlinger";

export const metadata = { title: "Moderasjon" };

async function lagLenke(refType: string, refId: string) {
  switch (refType) {
    case "innlegg":
      return `/innlegg/${refId}`;
    case "stevne":
      return `/stevner/${refId}`;
    case "kommentar": {
      const k = await prisma.kommentar.findUnique({ where: { id: refId }, select: { innleggId: true } });
      return k ? `/innlegg/${k.innleggId}` : null;
    }
    case "bruker": {
      const b = await prisma.user.findUnique({ where: { id: refId }, select: { username: true } });
      return b ? `/profil/${b.username}` : null;
    }
    case "grend": {
      const g = await prisma.grend.findUnique({ where: { id: refId }, select: { slug: true } });
      return g ? `/grender/${g.slug}` : null;
    }
    case "stove": {
      const s = await prisma.stove.findUnique({ where: { id: refId }, select: { slug: true } });
      return s ? `/stover/${s.slug}` : null;
    }
    default:
      return null;
  }
}

export default async function AdminSide() {
  await krevModerator();

  const [aapne, lukkede, statistikk] = await Promise.all([
    prisma.rapport.findMany({
      where: { status: { not: "LUKKET" } },
      include: { rapportor: { select: { name: true, username: true } } },
      orderBy: { opprettetAt: "asc" },
    }),
    prisma.rapport.findMany({
      where: { status: "LUKKET" },
      include: { rapportor: { select: { name: true, username: true } } },
      orderBy: { behandletAt: "desc" },
      take: 10,
    }),
    Promise.all([
      prisma.user.count({ where: { slettesAt: null } }),
      prisma.innlegg.count(),
      prisma.grend.count(),
      prisma.stevne.count(),
    ]),
  ]);

  const medLenker = await Promise.all(
    aapne.map(async (r) => ({ ...r, lenke: await lagLenke(r.refType, r.refId) }))
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4 heim-inn">
      <h1 className="text-2xl font-semibold">🛡️ Moderasjon</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { tall: statistikk[0], tekst: "brukere" },
          { tall: statistikk[1], tekst: "innlegg" },
          { tall: statistikk[2], tekst: "grender" },
          { tall: statistikk[3], tekst: "stevner" },
        ].map((s) => (
          <Kort key={s.tekst} className="p-4 text-center">
            <div className="text-2xl font-bold text-primar">{s.tall}</div>
            <div className="text-xs text-dus">{s.tekst}</div>
          </Kort>
        ))}
      </div>

      <Kort className="p-6">
        <h2 className="text-lg font-semibold">
          Åpne rapporter {aapne.length > 0 && <span className="text-aksent">({aapne.length})</span>}
        </h2>
        {medLenker.length === 0 ? (
          <p className="mt-3 text-sm text-dus">Ingenting i køen — godt jobba! 🎉</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {medLenker.map((r) => (
              <li key={r.id} className="rounded-lg border border-kant p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Merkelapp>{r.refType}</Merkelapp>
                  <Merkelapp
                    className={r.status === "UNDER_BEHANDLING" ? "border-gull/60 text-gull" : "border-aksent/60 text-aksent"}
                  >
                    {r.status === "UNDER_BEHANDLING" ? "under behandling" : "ny"}
                  </Merkelapp>
                  <span className="text-xs text-dus">
                    {formatDistanceToNow(r.opprettetAt, { addSuffix: true, locale: nb })} · fra @
                    {r.rapportor.username}
                  </span>
                </div>
                <p className="mt-2 text-sm">{r.arsak}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {r.lenke ? (
                    <Link href={r.lenke} className="text-sm text-primar hover:underline">
                      Se innholdet →
                    </Link>
                  ) : (
                    <span className="text-sm text-dus">Innholdet er slettet</span>
                  )}
                  <RapportHandlinger rapportId={r.id} status={r.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Kort>

      {lukkede.length > 0 && (
        <Kort className="p-6">
          <h2 className="text-lg font-semibold">Nylig lukket</h2>
          <ul className="mt-3 space-y-2">
            {lukkede.map((r) => (
              <li key={r.id} className="text-sm text-dus">
                <Merkelapp>{r.refType}</Merkelapp> {r.arsak.slice(0, 80)}
                {r.notat && <span className="italic"> — «{r.notat}»</span>}
              </li>
            ))}
          </ul>
        </Kort>
      )}
    </div>
  );
}
