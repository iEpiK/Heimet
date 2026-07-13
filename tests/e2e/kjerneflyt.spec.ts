import { test, expect, type Page } from "@playwright/test";
import { Client } from "pg";
import "dotenv/config";

// Kjerneflyt ende-til-ende: registrering → verifisering → innlogging →
// innlegg → vennskap → feedback-regler håndheves i UI.
// (Bruker pg direkte — den genererte Prisma-klienten er ESM og
// transpileres ikke av Playwright.)

async function sql(tekst: string, verdier: unknown[]) {
  const klient = new Client({ connectionString: process.env.DATABASE_URL });
  await klient.connect();
  try {
    await klient.query(tekst, verdier);
  } finally {
    await klient.end();
  }
}

const kjor = Date.now().toString(36);
const brukerA = {
  navn: "Ese Testesen",
  brukernavn: `ese${kjor}`,
  epost: `ese-${kjor}@e2e.heimet.no`,
  passord: "kjempehemmelig123",
};
const brukerB = {
  navn: "Bjørg Prøvedal",
  brukernavn: `bjorg${kjor}`,
  epost: `bjorg-${kjor}@e2e.heimet.no`,
  passord: "kjempehemmelig123",
};

test.afterAll(async () => {
  await sql(`DELETE FROM "user" WHERE email = ANY($1)`, [[brukerA.epost, brukerB.epost]]);
});

async function registrerOgLoggInn(page: Page, bruker: typeof brukerA) {
  await page.goto("/registrer");
  await page.getByLabel("Fullt navn").fill(bruker.navn);
  await page.getByLabel("Brukernavn").fill(bruker.brukernavn);
  await page.getByLabel("E-post").fill(bruker.epost);
  await page.getByLabel(/Passord/).fill(bruker.passord);
  await page.getByRole("button", { name: "Opprett konto" }).click();
  await expect(page.getByText("Sjekk innboksen din!")).toBeVisible();

  // E-postverifisering skjer utenfor nettleseren — bekreft direkte i databasen
  await sql(`UPDATE "user" SET "emailVerified" = true WHERE email = $1`, [bruker.epost]);

  await page.goto("/logg-inn");
  await page.getByLabel("E-post eller brukernavn").fill(bruker.epost);
  await page.getByLabel("Passord").fill(bruker.passord);
  await page.getByRole("button", { name: "Logg inn", exact: true }).click();
  await expect(page).toHaveURL(/\/tunet/);
}

test("registrering, innlegg, vennskap og feedback-regler", async ({ browser }) => {
  // Bruker A registrerer seg og deler et offentlig innlegg der kun venner kan svare
  const sideA = await (await browser.newContext()).newPage();
  await registrerOgLoggInn(sideA, brukerA);

  await sideA.getByPlaceholder("Hva skjer på tunet ditt?").fill(`Hei fra ${brukerA.navn}! (${kjor})`);
  await sideA.locator('select[name="synlighet"]').selectOption("OFFENTLIG");
  await sideA.locator('select[name="feedbackPolicy"]').selectOption("VENNER");
  await sideA.getByRole("button", { name: "Del", exact: true }).click();
  await expect(sideA.getByText(`Hei fra ${brukerA.navn}! (${kjor})`)).toBeVisible();

  // Bruker B ser innlegget på Tunet, men kan ikke reagere (ikke venn ennå)
  const sideB = await (await browser.newContext()).newPage();
  await registrerOgLoggInn(sideB, brukerB);

  const innleggB = sideB.locator("div", { hasText: `Hei fra ${brukerA.navn}! (${kjor})` }).last();
  await expect(sideB.getByText(`Hei fra ${brukerA.navn}! (${kjor})`)).toBeVisible();
  await expect(
    innleggB.getByTitle("Forfatteren har begrenset hvem som kan reagere").first()
  ).toBeDisabled();

  // B sender venneforespørsel fra profilen til A
  await sideB.goto(`/profil/${brukerA.brukernavn}`);
  await sideB.getByRole("button", { name: /Legg til venn/ }).click();
  await expect(sideB.getByRole("button", { name: "Trekk forespørsel" })).toBeVisible();

  // A godtar under /venner
  await sideA.goto("/venner");
  await expect(sideA.getByText(brukerB.navn)).toBeVisible();
  await sideA.getByRole("button", { name: "Godta forespørsel" }).click();
  await expect(sideA.getByText(`Vennene dine (1)`)).toBeVisible();

  // Nå kan B tenne en fyrstikk på innlegget
  await sideB.goto("/tunet");
  const innleggEtterVennskap = sideB
    .locator("div")
    .filter({ hasText: `Hei fra ${brukerA.navn}! (${kjor})` })
    .last();
  const fyrKnapp = innleggEtterVennskap.getByTitle("Fyr", { exact: true }).first();
  await expect(fyrKnapp).toBeEnabled();
  await fyrKnapp.click();
  await expect(fyrKnapp).toContainText("1");

  // A har fått varsler
  await sideA.goto("/varsler");
  await expect(sideA.getByText("tente en fyrstikk på innlegget ditt")).toBeVisible();
});
