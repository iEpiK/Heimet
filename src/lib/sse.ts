import { EventEmitter } from "events";

// Enkel in-memory pub/sub for sanntid (SSE). Abstraksjonen er Redis-klar:
// bytt implementasjonen av publiser/abonner ved horisontal skalering.

export type SseHendelse = {
  type: "varsel" | "melding";
  refId?: string;
};

const globalForSse = globalThis as unknown as { sseEmitter?: EventEmitter };

function emitter() {
  if (!globalForSse.sseEmitter) {
    globalForSse.sseEmitter = new EventEmitter();
    globalForSse.sseEmitter.setMaxListeners(0); // én lytter per innlogget fane
  }
  return globalForSse.sseEmitter;
}

export function publiser(brukerId: string, hendelse: SseHendelse) {
  emitter().emit(`bruker:${brukerId}`, hendelse);
}

export function abonner(brukerId: string, lytter: (h: SseHendelse) => void) {
  const kanal = `bruker:${brukerId}`;
  emitter().on(kanal, lytter);
  return () => emitter().off(kanal, lytter);
}
