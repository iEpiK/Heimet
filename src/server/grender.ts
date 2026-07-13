"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hentBruker } from "@/lib/session";
import { lagSlug } from "@/lib/slug";
import { lagreBilde } from "@/lib/lagring";
import { opprettVarsel } from "@/lib/varsler";
import { giDugnadspoeng } from "@/lib/dugnad";

type Resultat = { ok: true; slug?: string } | { feil: string };

const grendSkjema = z.object({
  navn: z.string().trim().min(2, "Navnet må ha minst 2 tegn.").max(60, "Maks 60 tegn."),
  beskrivelse: z.string().trim().max(1000, "Maks 1000 tegn."),
  type: z.enum(["AAPEN", "LUKKET", "SKJULT"]),
  kommune: z.string().trim().max(60),
});

async function krevGrendRolle(
  grendId: string,
  brukerId: string,
  roller: ("MODERATOR" | "ADMIN")[]
) {
  const medlemskap = await prisma.grendMedlemskap.findUnique({
    where: { grendId_brukerId: { grendId, brukerId } },
  });
  return (
    !!medlemskap &&
    medlemskap.status === "GODKJENT" &&
    (roller as string[]).includes(medlemskap.rolle)
  );
}

export async function opprettGrend(skjema: FormData): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const parsed = grendSkjema.safeParse({
    navn: skjema.get("navn") ?? "",
    beskrivelse: skjema.get("beskrivelse") ?? "",
    type: skjema.get("type") ?? "AAPEN",
    kommune: skjema.get("kommune") ?? "",
  });
  if (!parsed.success) return { feil: parsed.error.issues[0].message };

  let coverUrl: string | undefined;
  const cover = skjema.get("cover");
  try {
    if (cover instanceof File && cover.size > 0) {
      coverUrl = (await lagreBilde(cover, "cover")).url;
    }
  } catch (e) {
    return { feil: e instanceof Error ? e.message : "Kunne ikke lagre bildet." };
  }

  const grend = await prisma.grend.create({
    data: {
      navn: parsed.data.navn,
      slug: lagSlug(parsed.data.navn),
      beskrivelse: parsed.data.beskrivelse || null,
      type: parsed.data.type,
      kommune: parsed.data.kommune || null,
      coverbilde: coverUrl,
      medlemmer: { create: { brukerId: meg.id, rolle: "ADMIN" } },
    },
  });
  await giDugnadspoeng(meg.id, "opprettet_grend", { refType: "grend", refId: grend.id });

  revalidatePath("/grender");
  return { ok: true, slug: grend.slug };
}

export async function bliMedIGrend(grendId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const grend = await prisma.grend.findUnique({ where: { id: grendId } });
  if (!grend) return { feil: "Fant ikke grenda." };
  if (grend.type === "SKJULT") return { feil: "Denne grenda er kun på invitasjon." };

  const eksisterende = await prisma.grendMedlemskap.findUnique({
    where: { grendId_brukerId: { grendId, brukerId: meg.id } },
  });
  if (eksisterende) {
    return eksisterende.status === "GODKJENT"
      ? { feil: "Du er allerede medlem." }
      : { feil: "Forespørselen din venter på godkjenning." };
  }

  const status = grend.type === "AAPEN" ? "GODKJENT" : "VENTER";
  await prisma.grendMedlemskap.create({
    data: { grendId, brukerId: meg.id, status },
  });

  if (status === "VENTER") {
    const styrere = await prisma.grendMedlemskap.findMany({
      where: { grendId, rolle: { in: ["MODERATOR", "ADMIN"] }, status: "GODKJENT" },
    });
    for (const s of styrere) {
      await opprettVarsel({
        mottakerId: s.brukerId,
        aktorId: meg.id,
        type: "grend_foresporsel",
        refType: "grend",
        refId: grendId,
      });
    }
  }

  revalidatePath(`/grender/${grend.slug}`);
  return { ok: true };
}

export async function forlatGrend(grendId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const medlemskap = await prisma.grendMedlemskap.findUnique({
    where: { grendId_brukerId: { grendId, brukerId: meg.id } },
    include: { grend: true },
  });
  if (!medlemskap) return { feil: "Du er ikke medlem." };

  if (medlemskap.rolle === "ADMIN") {
    const andreAdminer = await prisma.grendMedlemskap.count({
      where: { grendId, rolle: "ADMIN", status: "GODKJENT", NOT: { brukerId: meg.id } },
    });
    if (andreAdminer === 0) {
      return { feil: "Du er eneste admin — utnevn en ny admin før du forlater grenda." };
    }
  }

  await prisma.grendMedlemskap.delete({ where: { id: medlemskap.id } });
  revalidatePath(`/grender/${medlemskap.grend.slug}`);
  return { ok: true };
}

export async function behandleMedlemskap(
  medlemskapId: string,
  godkjenn: boolean
): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const medlemskap = await prisma.grendMedlemskap.findUnique({
    where: { id: medlemskapId },
    include: { grend: true },
  });
  if (!medlemskap || medlemskap.status !== "VENTER") return { feil: "Fant ikke forespørselen." };
  if (!(await krevGrendRolle(medlemskap.grendId, meg.id, ["MODERATOR", "ADMIN"]))) {
    return { feil: "Du har ikke tilgang til å behandle forespørsler." };
  }

  if (godkjenn) {
    await prisma.grendMedlemskap.update({
      where: { id: medlemskapId },
      data: { status: "GODKJENT" },
    });
    await opprettVarsel({
      mottakerId: medlemskap.brukerId,
      aktorId: meg.id,
      type: "grend_godkjent",
      refType: "grend",
      refId: medlemskap.grendId,
      tekst: medlemskap.grend.navn,
    });
  } else {
    await prisma.grendMedlemskap.delete({ where: { id: medlemskapId } });
  }

  revalidatePath(`/grender/${medlemskap.grend.slug}/medlemmer`);
  return { ok: true };
}

export async function endreGrendRolle(
  medlemskapId: string,
  rolle: "MEDLEM" | "MODERATOR" | "ADMIN"
): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const medlemskap = await prisma.grendMedlemskap.findUnique({
    where: { id: medlemskapId },
    include: { grend: true },
  });
  if (!medlemskap) return { feil: "Fant ikke medlemmet." };
  if (!(await krevGrendRolle(medlemskap.grendId, meg.id, ["ADMIN"]))) {
    return { feil: "Kun admin kan endre roller." };
  }
  if (medlemskap.brukerId === meg.id && rolle !== "ADMIN") {
    const andreAdminer = await prisma.grendMedlemskap.count({
      where: { grendId: medlemskap.grendId, rolle: "ADMIN", status: "GODKJENT", NOT: { brukerId: meg.id } },
    });
    if (andreAdminer === 0) return { feil: "Grenda må ha minst én admin." };
  }

  await prisma.grendMedlemskap.update({ where: { id: medlemskapId }, data: { rolle } });
  revalidatePath(`/grender/${medlemskap.grend.slug}/medlemmer`);
  return { ok: true };
}

export async function fjernGrendMedlem(medlemskapId: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const medlemskap = await prisma.grendMedlemskap.findUnique({
    where: { id: medlemskapId },
    include: { grend: true },
  });
  if (!medlemskap) return { feil: "Fant ikke medlemmet." };
  if (!(await krevGrendRolle(medlemskap.grendId, meg.id, ["MODERATOR", "ADMIN"]))) {
    return { feil: "Du har ikke tilgang." };
  }
  if (medlemskap.rolle === "ADMIN") return { feil: "Adminer kan ikke fjernes — endre rollen først." };

  await prisma.grendMedlemskap.delete({ where: { id: medlemskapId } });
  revalidatePath(`/grender/${medlemskap.grend.slug}/medlemmer`);
  return { ok: true };
}

export async function inviterTilGrend(grendId: string, brukernavn: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };
  if (!(await krevGrendRolle(grendId, meg.id, ["MODERATOR", "ADMIN"]))) {
    return { feil: "Kun moderatorer og adminer kan invitere." };
  }

  const bruker = await prisma.user.findUnique({
    where: { username: brukernavn.trim().toLowerCase() },
  });
  if (!bruker || bruker.slettesAt) return { feil: "Fant ingen bruker med det brukernavnet." };

  const grend = await prisma.grend.findUnique({ where: { id: grendId } });
  if (!grend) return { feil: "Fant ikke grenda." };

  const eksisterende = await prisma.grendMedlemskap.findUnique({
    where: { grendId_brukerId: { grendId, brukerId: bruker.id } },
  });
  if (eksisterende?.status === "GODKJENT") return { feil: "Brukeren er allerede medlem." };

  if (eksisterende) {
    await prisma.grendMedlemskap.update({
      where: { id: eksisterende.id },
      data: { status: "GODKJENT" },
    });
  } else {
    await prisma.grendMedlemskap.create({
      data: { grendId, brukerId: bruker.id, status: "GODKJENT" },
    });
  }
  await opprettVarsel({
    mottakerId: bruker.id,
    aktorId: meg.id,
    type: "grend_godkjent",
    refType: "grend",
    refId: grendId,
    tekst: grend.navn,
  });

  revalidatePath(`/grender/${grend.slug}/medlemmer`);
  return { ok: true };
}

export async function svarPaBal(balId: string, innhold: string): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const trimmet = innhold.trim();
  if (!trimmet || trimmet.length > 1000) return { feil: "Svaret må ha 1–1000 tegn." };

  const bal = await prisma.ukasBal.findUnique({
    where: { id: balId },
    include: { grend: true },
  });
  if (!bal) return { feil: "Fant ikke bålet." };

  const medlemskap = await prisma.grendMedlemskap.findUnique({
    where: { grendId_brukerId: { grendId: bal.grendId, brukerId: meg.id } },
  });
  if (!medlemskap || medlemskap.status !== "GODKJENT") {
    return { feil: "Kun medlemmer av grenda kan svare rundt bålet." };
  }

  await prisma.balSvar.create({
    data: { balId, brukerId: meg.id, innhold: trimmet },
  });
  await giDugnadspoeng(meg.id, "svarte_bal", { refType: "bal", refId: balId });

  revalidatePath(`/grender/${bal.grend.slug}`);
  return { ok: true };
}
