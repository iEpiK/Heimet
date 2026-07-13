import { krevBruker } from "@/lib/session";
import { PersonvernSkjema } from "@/components/innstillinger/PersonvernSkjema";
import { GdprPanel } from "@/components/innstillinger/GdprPanel";

export const metadata = { title: "Personvern" };

export default async function PersonvernInnstillinger() {
  const bruker = await krevBruker();
  return (
    <div className="space-y-4">
      <PersonvernSkjema
        start={{
          standardSynlighet: bruker.standardSynlighet === "GREND" ? "VENNER" : bruker.standardSynlighet,
          standardFeedback: bruker.standardFeedback,
          bursdagSynlighet: bruker.bursdagSynlighet,
          ukesbrev: bruker.ukesbrev,
        }}
      />
      <GdprPanel slettesAt={bruker.slettesAt ? bruker.slettesAt.toISOString() : null} />
    </div>
  );
}
