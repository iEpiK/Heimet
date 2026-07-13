import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { Kort } from "@/components/ui/Kort";
import { Avatar } from "@/components/ui/Avatar";
import { MerkLestKnapp } from "@/components/varsler/MerkLestKnapp";

export const metadata = { title: "Varsler" };

const tekster: Record<string, string> = {
  venneforesporsel: "sendte deg en venneforespørsel",
  venneforesporsel_godtatt: "godtok venneforespørselen din 🤝",
  fyrstikk: "tente en fyrstikk på innlegget ditt",
  kommentar: "kommenterte innlegget ditt",
  kommentar_svar: "svarte på kommentaren din",
  stevne_invitasjon: "inviterte deg til stevnet",
  stevne_svar: "kommer på stevnet ditt",
  grend_foresporsel: "vil bli med i grenda di",
  grend_godkjent: "slapp deg inn i grenda",
  melding: "sendte deg en melding",
  merke: "Du har fått et nytt merke! 🏅",
};

async function lagLenke(varsel: { refType: string | null; refId: string | null; aktorId: string | null }) {
  switch (varsel.refType) {
    case "innlegg":
      return `/innlegg/${varsel.refId}`;
    case "stevne":
      return `/stevner/${varsel.refId}`;
    case "grend": {
      const grend = await prisma.grend.findUnique({
        where: { id: varsel.refId ?? "" },
        select: { slug: true },
      });
      return grend ? `/grender/${grend.slug}` : "/grender";
    }
    case "bruker": {
      const bruker = await prisma.user.findUnique({
        where: { id: varsel.refId ?? "" },
        select: { username: true },
      });
      return bruker ? `/profil/${bruker.username}` : "/venner";
    }
    default:
      return "/tunet";
  }
}

export default async function VarslerSide() {
  const meg = await krevBruker();

  const varsler = await prisma.varsel.findMany({
    where: { mottakerId: meg.id },
    include: { aktor: { select: { name: true, username: true, image: true } } },
    orderBy: { opprettetAt: "desc" },
    take: 50,
  });

  const medLenker = await Promise.all(
    varsler.map(async (v) => ({ ...v, lenke: await lagLenke(v) }))
  );
  const harUleste = varsler.some((v) => !v.lest);

  return (
    <div className="mx-auto max-w-xl space-y-4 heim-inn">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Varsler</h1>
        {harUleste && <MerkLestKnapp />}
      </div>

      {medLenker.length === 0 ? (
        <Kort className="p-8 text-center">
          <div className="text-4xl">🔔</div>
          <p className="mt-3 text-sm text-dus">Ingen varsler ennå — de dukker opp her.</p>
        </Kort>
      ) : (
        <Kort className="divide-y divide-kant overflow-hidden p-0">
          {medLenker.map((v) => (
            <Link
              key={v.id}
              href={v.lenke}
              className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-flate-dyp ${
                v.lest ? "" : "bg-primar/5"
              }`}
            >
              {v.aktor ? (
                <Avatar bilde={v.aktor.image} navn={v.aktor.name} storrelse="sm" />
              ) : (
                <span className="text-xl">🏅</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  {v.aktor && <strong>{v.aktor.name}</strong>}{" "}
                  {tekster[v.type] ?? v.type}
                  {v.tekst && <span className="text-dus"> «{v.tekst}»</span>}
                </p>
                <p className="text-xs text-dus">
                  {formatDistanceToNow(v.opprettetAt, { addSuffix: true, locale: nb })}
                </p>
              </div>
              {!v.lest && <span className="size-2 shrink-0 rounded-full bg-aksent" />}
            </Link>
          ))}
        </Kort>
      )}
    </div>
  );
}
