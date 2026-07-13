import crypto from "crypto";

/** Lager en URL-vennlig slug av et norsk navn, med kort tilfeldig suffiks. */
export function lagSlug(navn: string) {
  const base = navn
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return `${base || "uten-navn"}-${crypto.randomBytes(3).toString("hex")}`;
}
