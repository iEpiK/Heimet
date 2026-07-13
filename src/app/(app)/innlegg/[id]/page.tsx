import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { kanSeInnlegg, kanGiFeedback } from "@/lib/authz";
import { innleggInclude } from "@/lib/innlegg";
import { InnleggKort } from "@/components/innlegg/InnleggKort";
import { KommentarTre } from "@/components/innlegg/KommentarTre";
import { KommentarSkjema } from "@/components/innlegg/KommentarSkjema";
import { Kort } from "@/components/ui/Kort";

export const metadata = { title: "Innlegg" };

export default async function InnleggSide({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meg = await krevBruker();

  const innlegg = await prisma.innlegg.findUnique({
    where: { id },
    include: innleggInclude(meg.id),
  });
  if (!innlegg || !(await kanSeInnlegg(innlegg, meg.id))) notFound();

  const kanFeedback = await kanGiFeedback(innlegg, meg.id);

  const kommentarer = await prisma.kommentar.findMany({
    where: { innleggId: id },
    orderBy: { opprettetAt: "asc" },
    include: {
      forfatter: { select: { id: true, name: true, username: true, image: true } },
      fyrstikker: { select: { type: true, brukerId: true } },
    },
  });

  return (
    <div className="mx-auto max-w-xl space-y-4 heim-inn">
      <InnleggKort
        innlegg={innlegg}
        megId={meg.id}
        megRolle={meg.rolle}
        kanReagere={kanFeedback}
      />
      <Kort className="p-5 space-y-4">
        {kanFeedback ? (
          <KommentarSkjema innleggId={id} />
        ) : (
          <p className="text-sm text-dus">
            {innlegg.feedbackPolicy === "INGEN"
              ? "Forfatteren har skrudd av feedback på dette innlegget."
              : "Kun venner av forfatteren kan reagere og kommentere her."}
          </p>
        )}
        {kommentarer.length > 0 && (
          <KommentarTre
            kommentarer={kommentarer}
            megId={meg.id}
            megRolle={meg.rolle}
            innleggForfatterId={innlegg.forfatterId}
            kanReagere={kanFeedback}
            kanSvare={kanFeedback}
          />
        )}
      </Kort>
    </div>
  );
}
