import { GrendSkjema } from "@/components/grend/GrendSkjema";

export const metadata = { title: "Ny grend" };

export default function NyGrendSide() {
  return (
    <div className="mx-auto max-w-xl heim-inn">
      <GrendSkjema />
    </div>
  );
}
