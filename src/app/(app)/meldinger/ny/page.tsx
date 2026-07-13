import { NySamtaleSkjema } from "@/components/meldinger/NySamtaleSkjema";

export const metadata = { title: "Ny samtale" };

export default function NySamtaleSide() {
  return (
    <div className="mx-auto max-w-md heim-inn">
      <NySamtaleSkjema />
    </div>
  );
}
