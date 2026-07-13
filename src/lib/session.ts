import { headers } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";

/** Rå better-auth-sesjon (null hvis ikke innlogget). Cachet per request. */
export const hentSesjon = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Full bruker fra databasen med Heimet-feltene, eller null. */
export const hentBruker = cache(async () => {
  const sesjon = await hentSesjon();
  if (!sesjon) return null;
  // Kontoer med slettesAt satt er skjult for ALLE andre (feeds, søk, profiler
  // filtrerer på slettesAt: null), men eieren er fortsatt innlogget så
  // slettingen kan angres innen fristen.
  return prisma.user.findUnique({ where: { id: sesjon.user.id } });
});

export type Bruker = NonNullable<Awaited<ReturnType<typeof hentBruker>>>;

/** Krev innlogget bruker — redirecter til /logg-inn ellers. */
export async function krevBruker() {
  const bruker = await hentBruker();
  if (!bruker) redirect("/logg-inn");
  return bruker;
}

/** Krev moderator/admin. */
export async function krevModerator() {
  const bruker = await krevBruker();
  if (bruker.rolle === "BRUKER") redirect("/tunet");
  return bruker;
}
