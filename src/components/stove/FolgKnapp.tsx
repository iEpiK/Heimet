"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { folgStove, avfolgStove } from "@/server/stover";
import { Knapp } from "@/components/ui/Knapp";

export function FolgKnapp({ stoveId, folger }: { stoveId: string; folger: boolean }) {
  const router = useRouter();
  const [venter, startTransition] = useTransition();

  function veksle() {
    startTransition(async () => {
      await (folger ? avfolgStove(stoveId) : folgStove(stoveId));
      router.refresh();
    });
  }

  return (
    <Knapp variant={folger ? "sekundar" : "primar"} disabled={venter} onClick={veksle}>
      {folger ? "✓ Følger" : "➕ Følg"}
    </Knapp>
  );
}
