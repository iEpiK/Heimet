"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hentBruker } from "@/lib/session";

type Resultat = { ok: true } | { feil: string };

/**
 * GDPR: be om sletting av kontoen. Kontoen skjules umiddelbart for andre
 * og slettes permanent etter 30 dager (angrefrist).
 */
export async function slettKonto(): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  await prisma.user.update({
    where: { id: meg.id },
    data: { slettesAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
  });
  // Logg ut alle andre enheter
  await auth.api.revokeOtherSessions({ headers: await headers() });
  return { ok: true };
}

export async function angreSletting(): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  await prisma.user.update({
    where: { id: meg.id },
    data: { slettesAt: null },
  });
  return { ok: true };
}
