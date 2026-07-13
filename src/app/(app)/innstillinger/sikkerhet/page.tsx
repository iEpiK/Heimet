import { krevBruker } from "@/lib/session";
import { SikkerhetPanel } from "@/components/innstillinger/SikkerhetPanel";

export const metadata = { title: "Sikkerhet" };

export default async function SikkerhetInnstillinger() {
  const bruker = await krevBruker();
  return <SikkerhetPanel toFaktorAktiv={!!bruker.twoFactorEnabled} />;
}
