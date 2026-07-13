import { StoveSkjema } from "@/components/stove/StoveSkjema";

export const metadata = { title: "Ny stove" };

export default function NyStoveSide() {
  return (
    <div className="mx-auto max-w-xl heim-inn">
      <StoveSkjema />
    </div>
  );
}
