// Årshjulet — Heimet følger norske sesonger og høytider.
// Første treff i lista vinner, så høytider står før grunnsesongene.

export type Sesong = {
  navn: string;
  emoji: string;
  hilsen: string;
  start: string; // "MM-DD"
  slutt: string; // "MM-DD"
};

const AARSHJUL: Sesong[] = [
  { navn: "Grunnlovsdagen", emoji: "🇳🇴", hilsen: "Gratulerer med dagen! Hipp hipp hurra!", start: "05-16", slutt: "05-17" },
  { navn: "Julehøytiden", emoji: "🎄", hilsen: "God jul og fredelige dager!", start: "12-20", slutt: "12-26" },
  { navn: "Romjula", emoji: "❄️", hilsen: "God romjul — tid for ro, rester og kanskje en skitur.", start: "12-27", slutt: "12-31" },
  { navn: "Nyttår", emoji: "🎆", hilsen: "Godt nytt år! Hva vil du fylle året med?", start: "01-01", slutt: "01-06" },
  { navn: "Påskefjellet", emoji: "🐣", hilsen: "God påske! Kvikk Lunsj og appelsin anbefales.", start: "03-20", slutt: "04-10" },
  { navn: "Fellesferien", emoji: "⛺", hilsen: "God sommer! Del turbildene dine med grenda.", start: "07-01", slutt: "07-31" },
  { navn: "Mørketida", emoji: "🌌", hilsen: "Tenn lys og hold sammen — våren kommer alltid.", start: "11-01", slutt: "01-15" },
  { navn: "Adventstida", emoji: "🕯️", hilsen: "God advent — snart jul!", start: "12-01", slutt: "12-19" },
  { navn: "Våren", emoji: "🌱", hilsen: "Våren er her — perfekt tid for dugnad!", start: "04-11", slutt: "05-31" },
  { navn: "Sommeren", emoji: "☀️", hilsen: "Nyt de lyse kveldene!", start: "06-01", slutt: "08-31" },
  { navn: "Høsten", emoji: "🍂", hilsen: "Sopptur, bærtur eller bare kos med kakao?", start: "09-01", slutt: "10-31" },
  { navn: "Vinteren", emoji: "⛷️", hilsen: "Ski, skøyter eller peiskos — vinteren er din.", start: "01-16", slutt: "03-19" },
];

function innenfor(mmdd: string, start: string, slutt: string) {
  // Håndterer intervaller som krysser årsskiftet (f.eks. mørketida)
  if (start <= slutt) return mmdd >= start && mmdd <= slutt;
  return mmdd >= start || mmdd <= slutt;
}

export function hentSesong(dato = new Date()): Sesong {
  const mmdd = `${String(dato.getMonth() + 1).padStart(2, "0")}-${String(dato.getDate()).padStart(2, "0")}`;
  return AARSHJUL.find((s) => innenfor(mmdd, s.start, s.slutt)) ?? AARSHJUL[AARSHJUL.length - 1];
}
