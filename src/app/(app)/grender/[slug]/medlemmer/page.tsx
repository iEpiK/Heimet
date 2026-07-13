import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { krevBruker } from "@/lib/session";
import { Kort } from "@/components/ui/Kort";
import { Avatar } from "@/components/ui/Avatar";
import { MedlemAdmin, InviterSkjema } from "@/components/grend/MedlemAdmin";

export const metadata = { title: "Medlemmer" };

export default async function GrendMedlemmerSide({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meg = await krevBruker();

  const grend = await prisma.grend.findUnique({
    where: { slug },
    include: {
      medlemmer: {
        include: { bruker: { select: { id: true, name: true, username: true, image: true } } },
        orderBy: [{ status: "asc" }, { rolle: "asc" }, { opprettetAt: "asc" }],
      },
    },
  });
  if (!grend) notFound();

  const mittMedlemskap = grend.medlemmer.find((m) => m.brukerId === meg.id);
  const erStyrer =
    mittMedlemskap?.status === "GODKJENT" && mittMedlemskap.rolle !== "MEDLEM";
  if (!erStyrer) notFound();

  const ventende = grend.medlemmer.filter((m) => m.status === "VENTER");
  const godkjente = grend.medlemmer.filter((m) => m.status === "GODKJENT");
  const erAdmin = mittMedlemskap!.rolle === "ADMIN";

  return (
    <div className="mx-auto max-w-2xl space-y-4 heim-inn">
      <div>
        <Link href={`/grender/${slug}`} className="text-sm text-dus hover:text-primar">
          ← {grend.navn}
        </Link>
        <h1 className="text-2xl font-semibold">Medlemmer</h1>
      </div>

      {ventende.length > 0 && (
        <Kort className="p-6">
          <h2 className="text-lg font-semibold">
            Venter på godkjenning <span className="text-aksent">({ventende.length})</span>
          </h2>
          <ul className="mt-4 space-y-3">
            {ventende.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3">
                <Link href={`/profil/${m.bruker.username}`} className="flex items-center gap-3 hover:underline">
                  <Avatar bilde={m.bruker.image} navn={m.bruker.name} />
                  <div>
                    <div className="text-sm font-medium">{m.bruker.name}</div>
                    <div className="text-xs text-dus">@{m.bruker.username}</div>
                  </div>
                </Link>
                <MedlemAdmin medlemskapId={m.id} modus="godkjenning" erAdmin={erAdmin} rolle={m.rolle} erMeg={false} />
              </li>
            ))}
          </ul>
        </Kort>
      )}

      <Kort className="p-6">
        <h2 className="text-lg font-semibold">Inviter</h2>
        <p className="mt-1 text-sm text-dus">
          Legg til en bruker direkte med brukernavnet deres.
        </p>
        <div className="mt-3">
          <InviterSkjema grendId={grend.id} />
        </div>
      </Kort>

      <Kort className="p-6">
        <h2 className="text-lg font-semibold">Medlemmer ({godkjente.length})</h2>
        <ul className="mt-4 space-y-3">
          {godkjente.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3">
              <Link href={`/profil/${m.bruker.username}`} className="flex items-center gap-3 hover:underline">
                <Avatar bilde={m.bruker.image} navn={m.bruker.name} />
                <div>
                  <div className="text-sm font-medium">{m.bruker.name}</div>
                  <div className="text-xs text-dus">
                    @{m.bruker.username} ·{" "}
                    {m.rolle === "ADMIN" ? "👑 Admin" : m.rolle === "MODERATOR" ? "🛡️ Moderator" : "Medlem"}
                  </div>
                </div>
              </Link>
              <MedlemAdmin
                medlemskapId={m.id}
                modus="medlem"
                erAdmin={erAdmin}
                rolle={m.rolle}
                erMeg={m.brukerId === meg.id}
              />
            </li>
          ))}
        </ul>
      </Kort>
    </div>
  );
}
