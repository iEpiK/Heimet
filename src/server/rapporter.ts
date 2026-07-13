"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hentBruker, krevModerator } from "@/lib/session";
import { innenforGrense, GRENSE_MELDING } from "@/lib/ratelimit";

type Resultat = { ok: true } | { feil: string };

const rapportSkjema = z.object({
  refType: z.enum(["innlegg", "kommentar", "bruker", "grend", "stove", "melding"]),
  refId: z.string().min(1),
  arsak: z.string().trim().min(5, "Beskriv kort hva som er galt (minst 5 tegn).").max(1000),
});

export async function rapporter(verdier: {
  refType: string;
  refId: string;
  arsak: string;
}): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  if (!innenforGrense(`rapport:${meg.id}`, 5, 60_000)) return { feil: GRENSE_MELDING };

  const parsed = rapportSkjema.safeParse(verdier);
  if (!parsed.success) return { feil: parsed.error.issues[0].message };

  await prisma.rapport.create({
    data: { rapportorId: meg.id, ...parsed.data },
  });
  return { ok: true };
}

export async function behandleRapport(
  rapportId: string,
  status: "UNDER_BEHANDLING" | "LUKKET",
  notat?: string
): Promise<Resultat> {
  const meg = await krevModerator();

  await prisma.rapport.update({
    where: { id: rapportId },
    data: {
      status,
      notat: notat?.trim() || undefined,
      behandletAv: meg.id,
      ...(status === "LUKKET" && { behandletAt: new Date() }),
    },
  });
  revalidatePath("/admin");
  return { ok: true };
}
