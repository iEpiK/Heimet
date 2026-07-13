// Norske feilmeldinger for better-auth-feilkoder
const meldinger: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Feil e-post/brukernavn eller passord.",
  INVALID_USERNAME_OR_PASSWORD: "Feil e-post/brukernavn eller passord.",
  USER_ALREADY_EXISTS: "Det finnes allerede en konto med denne e-postadressen.",
  USERNAME_IS_ALREADY_TAKEN: "Brukernavnet er dessverre opptatt.",
  USERNAME_TOO_SHORT: "Brukernavnet må ha minst 3 tegn.",
  USERNAME_TOO_LONG: "Brukernavnet kan ha maks 30 tegn.",
  INVALID_USERNAME: "Brukernavnet kan kun inneholde bokstaver, tall, «-», «_» og «.».",
  EMAIL_NOT_VERIFIED: "E-posten din er ikke bekreftet ennå. Sjekk innboksen din.",
  PASSWORD_TOO_SHORT: "Passordet må ha minst 10 tegn.",
  INVALID_TOKEN: "Lenken er ugyldig eller utløpt. Be om en ny.",
  TOO_MANY_ATTEMPTS: "For mange forsøk. Vent litt og prøv igjen.",
  INVALID_TWO_FACTOR_AUTHENTICATION: "Feil kode. Prøv igjen.",
  INVALID_CODE: "Feil kode. Prøv igjen.",
  RATE_LIMIT_EXCEEDED: "For mange forsøk. Vent litt og prøv igjen.",
};

export function authFeil(feil: { code?: string; message?: string } | null | undefined) {
  if (!feil) return "Noe gikk galt. Prøv igjen.";
  return meldinger[feil.code ?? ""] ?? feil.message ?? "Noe gikk galt. Prøv igjen.";
}
