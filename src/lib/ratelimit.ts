// Enkel in-memory rate limiting for innholdsproduksjon.
// Auth-endepunktene har egen rate limiting via better-auth.

const vinduer = new Map<string, number[]>();

/** true hvis handlingen er innenfor grensen, false hvis brukeren må vente. */
export function innenforGrense(nokkel: string, maks: number, vindusMs: number) {
  const naa = Date.now();
  const tidligere = (vinduer.get(nokkel) ?? []).filter((t) => naa - t < vindusMs);
  if (tidligere.length >= maks) {
    vinduer.set(nokkel, tidligere);
    return false;
  }
  tidligere.push(naa);
  vinduer.set(nokkel, tidligere);

  // Rydd opp innimellom så mappen ikke vokser uendelig
  if (vinduer.size > 10000) {
    for (const [k, tider] of vinduer) {
      if (tider.every((t) => naa - t > vindusMs)) vinduer.delete(k);
    }
  }
  return true;
}

export const GRENSE_MELDING = "Rolig nå! Du gjør dette litt for ofte — prøv igjen om et øyeblikk.";
