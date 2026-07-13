import { prisma } from "./prisma";
import { publiser } from "./sse";

export type VarselType =
  | "venneforesporsel"
  | "venneforesporsel_godtatt"
  | "fyrstikk"
  | "kommentar"
  | "kommentar_svar"
  | "stevne_invitasjon"
  | "stevne_svar"
  | "grend_foresporsel"
  | "grend_godkjent"
  | "melding"
  | "merke";

export async function opprettVarsel(opts: {
  mottakerId: string;
  aktorId?: string;
  type: VarselType;
  refType?: string;
  refId?: string;
  tekst?: string;
}) {
  if (opts.aktorId === opts.mottakerId) return; // aldri varsle om egne handlinger
  await prisma.varsel.create({
    data: {
      mottakerId: opts.mottakerId,
      aktorId: opts.aktorId,
      type: opts.type,
      refType: opts.refType,
      refId: opts.refId,
      tekst: opts.tekst,
    },
  });
  publiser(opts.mottakerId, { type: "varsel" });
}
