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
  const bruker = await prisma.user.findUnique({
    where: { id: sesjon.user.id },
  });
  // Kontoer under sletting behandles som utlogget
  if (!bruker || bruker.slettesAt) return null;
  return bruker;
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
