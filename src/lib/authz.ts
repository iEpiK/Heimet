import { prisma } from "./prisma";
import { erVenner, erBlokkert } from "./venner";

export type InnleggForAuthz = {
  id: string;
  forfatterId: string;
  synlighet: "OFFENTLIG" | "VENNER" | "GREND";
  feedbackPolicy: "ALLE" | "VENNER" | "INGEN";
  grendId: string | null;
  stoveId: string | null;
};

/** Er brukeren godkjent medlem av grenda? */
export async function erGrendMedlem(brukerId: string, grendId: string) {
  const medlemskap = await prisma.grendMedlemskap.findUnique({
    where: { grendId_brukerId: { grendId, brukerId } },
  });
  return !!medlemskap && medlemskap.status === "GODKJENT";
}

/**
 * Kan brukeren SE innlegget?
 * - Blokkering mellom forfatter og leser stenger alltid.
 * - OFFENTLIG: alle innloggede. VENNER: forfatter + venner.
 * - GREND: kun godkjente medlemmer av grenda.
 * - Stove-innlegg er alltid offentlige (stover er offentlige sider).
 */
export async function kanSeInnlegg(innlegg: InnleggForAuthz, leserId: string): Promise<boolean> {
  if (innlegg.forfatterId === leserId) return true;
  if (await erBlokkert(innlegg.forfatterId, leserId)) return false;

  if (innlegg.grendId && innlegg.synlighet === "GREND") {
    return erGrendMedlem(leserId, innlegg.grendId);
  }
  if (innlegg.stoveId) return true;

  switch (innlegg.synlighet) {
    case "OFFENTLIG":
      return true;
    case "VENNER":
      return erVenner(innlegg.forfatterId, leserId);
    case "GREND":
      return innlegg.grendId ? erGrendMedlem(leserId, innlegg.grendId) : false;
  }
}

/**
 * Kan brukeren gi feedback (fyrstikker/kommentarer)?
 * Forutsetter synlighet, og håndhever deretter innleggets feedbackPolicy:
 * ALLE → alle som ser innlegget, VENNER → kun venner (og forfatter), INGEN → kun forfatter.
 */
export async function kanGiFeedback(innlegg: InnleggForAuthz, brukerId: string): Promise<boolean> {
  if (!(await kanSeInnlegg(innlegg, brukerId))) return false;
  if (innlegg.forfatterId === brukerId) return innlegg.feedbackPolicy !== "INGEN";

  switch (innlegg.feedbackPolicy) {
    case "ALLE":
      return true;
    case "VENNER":
      return erVenner(innlegg.forfatterId, brukerId);
    case "INGEN":
      return false;
  }
}

/** Kan brukeren slette/redigere innlegget? (forfatter eller systemmoderator) */
export async function kanForvalteInnlegg(
  innlegg: { forfatterId: string },
  bruker: { id: string; rolle: "BRUKER" | "MODERATOR" | "ADMIN" }
) {
  return innlegg.forfatterId === bruker.id || bruker.rolle !== "BRUKER";
}
