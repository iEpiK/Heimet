import { krevBruker } from "@/lib/session";
import { PersonvernSkjema } from "@/components/innstillinger/PersonvernSkjema";

export const metadata = { title: "Personvern" };

export default async function PersonvernInnstillinger() {
  const bruker = await krevBruker();
  return (
    <PersonvernSkjema
      start={{
        standardSynlighet: bruker.standardSynlighet === "GREND" ? "VENNER" : bruker.standardSynlighet,
        standardFeedback: bruker.standardFeedback,
        bursdagSynlighet: bruker.bursdagSynlighet,
        ukesbrev: bruker.ukesbrev,
      }}
    />
  );
}
