import { prisma } from "./prisma";
import { erVenner, erBlokkert } from "./venner";
import { erGrendMedlem } from "./authz";

export type StevneForAuthz = {
  id: string;
  arrangorId: string;
  synlighet: "OFFENTLIG" | "VENNER" | "GREND";
  grendId: string | null;
  stoveId: string | null;
};

export async function kanSeStevne(stevne: StevneForAuthz, brukerId: string) {
  if (stevne.arrangorId === brukerId) return true;
  if (await erBlokkert(stevne.arrangorId, brukerId)) return false;

  // Har man svart (invitert/deltar), ser man alltid stevnet
  const svar = await prisma.stevneSvar.findUnique({
    where: { stevneId_brukerId: { stevneId: stevne.id, brukerId } },
  });
  if (svar) return true;

  if (stevne.grendId && stevne.synlighet === "GREND") {
    return erGrendMedlem(brukerId, stevne.grendId);
  }
  switch (stevne.synlighet) {
    case "OFFENTLIG":
      return true;
    case "VENNER":
      return erVenner(stevne.arrangorId, brukerId);
    case "GREND":
      return stevne.grendId ? erGrendMedlem(brukerId, stevne.grendId) : false;
  }
}

/** Genererer en iCalendar-fil for et stevne. */
export function lagICal(stevne: {
  id: string;
  tittel: string;
  beskrivelse: string | null;
  sted: string | null;
  start: Date;
  slutt: Date | null;
}) {
  const dt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Heimet//Stevne//NB",
    "BEGIN:VEVENT",
    `UID:stevne-${stevne.id}@heimet`,
    `DTSTAMP:${dt(new Date())}`,
    `DTSTART:${dt(stevne.start)}`,
    ...(stevne.slutt ? [`DTEND:${dt(stevne.slutt)}`] : []),
    `SUMMARY:${esc(stevne.tittel)}`,
    ...(stevne.beskrivelse ? [`DESCRIPTION:${esc(stevne.beskrivelse)}`] : []),
    ...(stevne.sted ? [`LOCATION:${esc(stevne.sted)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
