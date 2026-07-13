import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { kanSeStevne } from "@/lib/stevner";
import { Kort } from "@/components/ui/Kort";
import { Avatar } from "@/components/ui/Avatar";
import { Merkelapp } from "@/components/ui/Merkelapp";
import { SvarKnapper, InviterTilStevne, AvlysKnapp } from "@/components/stevne/SvarKnapper";

export const metadata = { title: "Stevne" };

const svarTekst = { KOMMER: "Kommer", KANSKJE: "Kanskje", KAN_IKKE: "Kan ikke" } as const;

export default async function StevneSide({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meg = await krevBruker();

  const stevne = await prisma.stevne.findUnique({
    where: { id },
    include: {
      arrangor: { select: { id: true, name: true, username: true, image: true } },
      grend: { select: { navn: true, slug: true } },
      stove: { select: { navn: true, slug: true } },
      svar: {
        include: { bruker: { select: { id: true, name: true, username: true, image: true } } },
        orderBy: { svartAt: "asc" },
      },
    },
  });
  if (!stevne || !(await kanSeStevne(stevne, meg.id))) notFound();

  const mittSvar = stevne.svar.find((s) => s.brukerId === meg.id)?.svar ?? null;
  const grupper = (["KOMMER", "KANSKJE", "KAN_IKKE"] as const).map((type) => ({
    type,
    folk: stevne.svar.filter((s) => s.svar === type),
  }));
  const erArrangor = stevne.arrangorId === meg.id;

  return (
    <div className="mx-auto max-w-2xl space-y-4 heim-inn">
      <Kort className="overflow-hidden">
        {stevne.coverbilde && (
          <div
            className="h-44 bg-cover bg-center"
            style={{ backgroundImage: `url(${stevne.coverbilde})` }}
          />
        )}
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase text-primar">
                {format(stevne.start, "EEEE d. MMMM yyyy", { locale: nb })}
              </p>
              <h1 className="mt-1 text-2xl font-semibold">{stevne.tittel}</h1>
            </div>
            {erArrangor && <AvlysKnapp stevneId={stevne.id} />}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Merkelapp>
              🕐 {format(stevne.start, "HH:mm")}
              {stevne.slutt && `–${format(stevne.slutt, "HH:mm")}`}
            </Merkelapp>
            {stevne.sted && <Merkelapp>📍 {stevne.sted}</Merkelapp>}
            {stevne.grend && (
              <Link href={`/grender/${stevne.grend.slug}`}>
                <Merkelapp className="hover:border-primar">🏘️ {stevne.grend.navn}</Merkelapp>
              </Link>
            )}
            {stevne.stove && (
              <Link href={`/stover/${stevne.stove.slug}`}>
                <Merkelapp className="hover:border-primar">🪵 {stevne.stove.navn}</Merkelapp>
              </Link>
            )}
            <a href={`/stevner/${stevne.id}/ics`} download>
              <Merkelapp className="hover:border-primar">📆 Legg i kalender</Merkelapp>
            </a>
          </div>

          {stevne.beskrivelse && (
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">
              {stevne.beskrivelse}
            </p>
          )}

          <div className="mt-4 flex items-center gap-2 text-sm text-dus">
            Arrangeres av
            <Link
              href={`/profil/${stevne.arrangor.username}`}
              className="flex items-center gap-1.5 font-medium text-tekst hover:underline"
            >
              <Avatar bilde={stevne.arrangor.image} navn={stevne.arrangor.name} storrelse="xs" />
              {stevne.arrangor.name}
            </Link>
          </div>

          <div className="mt-5 border-t border-kant pt-5">
            <SvarKnapper stevneId={stevne.id} mittSvar={mittSvar} />
          </div>
        </div>
      </Kort>

      <Kort className="p-6">
        <h2 className="text-lg font-semibold">Hvem kommer?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {grupper.map((g) => (
            <div key={g.type}>
              <h3 className="text-sm font-medium text-dus">
                {svarTekst[g.type]} ({g.folk.length})
              </h3>
              <ul className="mt-2 space-y-1.5">
                {g.folk.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/profil/${s.bruker.username}`}
                      className="flex items-center gap-2 rounded-lg p-1 text-sm hover:bg-flate-dyp transition-colors"
                    >
                      <Avatar bilde={s.bruker.image} navn={s.bruker.name} storrelse="xs" />
                      <span className="truncate">{s.bruker.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-kant pt-4">
          <h3 className="text-sm font-medium">Inviter noen</h3>
          <div className="mt-2 max-w-xs">
            <InviterTilStevne stevneId={stevne.id} />
          </div>
        </div>
      </Kort>
    </div>
  );
}
