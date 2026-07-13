import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp, { type Sharp, type Metadata } from "sharp";

// Lagringsabstraksjon. MVP: lokal disk. Prod kan bytte til S3 via LAGRING_DRIVER.
const rotSti = () => path.resolve(process.env.LAGRING_DISK_STI || "./opplastinger");

export type BildeType = "avatar" | "cover" | "innlegg";

const maksBredde: Record<BildeType, number> = {
  avatar: 512,
  cover: 1600,
  innlegg: 1920,
};

const MAKS_FILSTORRELSE = 10 * 1024 * 1024; // 10 MB

/**
 * Validerer, skalerer og lagrer et bilde. Returnerer offentlig URL-sti og mål.
 * Kaster Error med norsk melding ved ugyldig fil.
 */
export async function lagreBilde(fil: File, type: BildeType) {
  if (fil.size > MAKS_FILSTORRELSE) {
    throw new Error("Bildet er for stort (maks 10 MB).");
  }
  const buffer = Buffer.from(await fil.arrayBuffer());

  let pipeline: Sharp;
  let meta: Metadata;
  try {
    pipeline = sharp(buffer, { failOn: "error" }).rotate();
    meta = await pipeline.metadata();
  } catch {
    throw new Error("Filen ser ikke ut til å være et gyldig bilde.");
  }
  if (!meta.format || !["jpeg", "png", "webp", "gif", "avif", "heif"].includes(meta.format)) {
    throw new Error("Bildeformatet støttes ikke (bruk JPEG, PNG eller WebP).");
  }

  const resultat = await pipeline
    .resize({ width: maksBredde[type], withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const navn = `${type}-${crypto.randomUUID()}.webp`;
  const mappe = rotSti();
  await mkdir(mappe, { recursive: true });
  await writeFile(path.join(mappe, navn), resultat.data);

  return {
    url: `/opplastinger/${navn}`,
    bredde: resultat.info.width,
    hoyde: resultat.info.height,
  };
}

/** Leser en lagret fil — kun filnavn uten sti-tegn godtas. */
export async function lesBilde(navn: string) {
  if (!/^[a-z]+-[a-f0-9-]+\.webp$/.test(navn)) return null;
  try {
    return await readFile(path.join(rotSti(), navn));
  } catch {
    return null;
  }
}
