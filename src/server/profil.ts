"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hentBruker } from "@/lib/session";
import { lagreBilde } from "@/lib/lagring";

type Resultat = { ok: true } | { feil: string };

const profilSkjema = z.object({
  navn: z.string().trim().min(2, "Navnet må ha minst 2 tegn.").max(80, "Navnet er for langt."),
  bio: z.string().trim().max(500, "Bio kan ha maks 500 tegn."),
  kommune: z.string().trim().max(60),
  fodselsdato: z
    .string()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Ugyldig dato."),
});

export async function oppdaterProfil(skjema: FormData): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const parsed = profilSkjema.safeParse({
    navn: skjema.get("navn") ?? "",
    bio: skjema.get("bio") ?? "",
    kommune: skjema.get("kommune") ?? "",
    fodselsdato: skjema.get("fodselsdato") ?? "",
  });
  if (!parsed.success) return { feil: parsed.error.issues[0].message };
  const { navn, bio, kommune, fodselsdato } = parsed.data;

  let avatarUrl: string | undefined;
  let coverUrl: string | undefined;
  const avatar = skjema.get("avatar");
  const cover = skjema.get("cover");
  try {
    if (avatar instanceof File && avatar.size > 0) {
      avatarUrl = (await lagreBilde(avatar, "avatar")).url;
    }
    if (cover instanceof File && cover.size > 0) {
      coverUrl = (await lagreBilde(cover, "cover")).url;
    }
  } catch (e) {
    return { feil: e instanceof Error ? e.message : "Kunne ikke lagre bildet." };
  }

  await prisma.user.update({
    where: { id: meg.id },
    data: {
      name: navn,
      bio: bio || null,
      kommune: kommune || null,
      fodselsdato: fodselsdato ? new Date(fodselsdato) : null,
      ...(avatarUrl && { image: avatarUrl }),
      ...(coverUrl && { coverbilde: coverUrl }),
    },
  });
  revalidatePath("/innstillinger/profil");
  if (meg.username) revalidatePath(`/profil/${meg.username}`);
  return { ok: true };
}

const personvernSkjema = z.object({
  standardSynlighet: z.enum(["OFFENTLIG", "VENNER"]),
  standardFeedback: z.enum(["ALLE", "VENNER", "INGEN"]),
  bursdagSynlighet: z.enum(["ALLE", "VENNER", "SKJULT"]),
  ukesbrev: z.boolean(),
});

export async function oppdaterPersonvern(skjema: FormData): Promise<Resultat> {
  const meg = await hentBruker();
  if (!meg) return { feil: "Du må være innlogget." };

  const parsed = personvernSkjema.safeParse({
    standardSynlighet: skjema.get("standardSynlighet"),
    standardFeedback: skjema.get("standardFeedback"),
    bursdagSynlighet: skjema.get("bursdagSynlighet"),
    ukesbrev: skjema.get("ukesbrev") === "on",
  });
  if (!parsed.success) return { feil: "Ugyldige verdier." };

  await prisma.user.update({ where: { id: meg.id }, data: parsed.data });
  revalidatePath("/innstillinger/personvern");
  return { ok: true };
}
