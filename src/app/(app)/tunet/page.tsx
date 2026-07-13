import { krevBruker } from "@/lib/session";
import { Kort } from "@/components/ui/Kort";

export const metadata = { title: "Tunet" };

export default async function TunetSide() {
  const bruker = await krevBruker();

  return (
    <div className="mx-auto max-w-xl heim-inn">
      <Kort className="p-8 text-center">
        <div className="text-4xl">🏡</div>
        <h1 className="mt-4 text-2xl font-semibold">
          Velkommen heim, {bruker.name.split(" ")[0]}!
        </h1>
        <p className="mt-2 text-sm text-dus">
          Tunet ditt er snart klart — her kommer innleggene fra venner og
          grender, i kronologisk rekkefølge.
        </p>
      </Kort>
    </div>
  );
}
