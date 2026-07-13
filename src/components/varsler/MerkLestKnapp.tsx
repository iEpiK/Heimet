"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markerAlleVarslerLest } from "@/server/meldinger";
import { Knapp } from "@/components/ui/Knapp";

export function MerkLestKnapp() {
  const router = useRouter();
  const [venter, startTransition] = useTransition();

  return (
    <Knapp
      variant="flat"
      disabled={venter}
      onClick={() =>
        startTransition(async () => {
          await markerAlleVarslerLest();
          router.refresh();
        })
      }
    >
      Merk alle som lest
    </Knapp>
  );
}
