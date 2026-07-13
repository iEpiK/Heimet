# 🏔️ Heimet — der Norge møtes

Et norsk sosialt nettverk bygget på dugnadsånd og personvern. Ingen annonser,
ingen sporing, ingen salg av brukerdata — og en strengt kronologisk feed uten
manipulerende algoritmer.

## Konseptet

Heimet bruker norsk bygde-metaforikk hele veien:

| Heimet | Tilsvarer | Vrien |
|---|---|---|
| **Tunet** | Feeden | Kronologisk, filtrerbar. Ingen «anbefalt for deg». |
| **Grender** | Grupper | Åpne, lukkede eller skjulte fellesskap, gjerne stedsforankret. |
| **Stover** | Sider | Offentlige sider for lag, foreninger og bedrifter. |
| **Stevner** | Arrangementer | RSVP, deltakerlister, iCal-eksport og bursdager. |
| **Fyrstikker** | Reaksjoner | 🔥 Fyr · 🏔️ Storslått · ❤️ Kos · 🤝 Dugnadsånd · 😄 Humring |
| **Ukas bål** | — | Ett samtale-spørsmål per uke i hver grend. |
| **Årshjulet** | — | Plattformen følger norske sesonger og høytider. |
| **Dugnad** | — | Poeng og merker for *bidrag* — aldri for likes eller følgertall. |

**Feedback-kontroll:** For hvert innlegg (og som profilstandard) velger du både
hvem som *ser* det (alle/venner/grend) og hvem som kan *reagere og kommentere*
(alle/kun venner/ingen). Alt håndheves på serversiden i `src/lib/authz.ts`.

## Teknisk

- **Next.js 16** (App Router, TypeScript) + Tailwind CSS v4
- **PostgreSQL 16** + Prisma 7 (skjema i `prisma/schema.prisma`)
- **better-auth**: e-post/passord m/ verifisering, TOTP 2FA, passnøkler (WebAuthn), brukernavn-innlogging, rate limiting
- **SSE** for sanntidsvarsler og meldinger (in-memory pub/sub, Redis-klar abstraksjon i `src/lib/sse.ts`)
- **sharp** for bildeskalering til webp; lagring på disk (S3-klar abstraksjon i `src/lib/lagring.ts`)
- **nodemailer** for e-post (faller tilbake til konsoll-logg i dev uten SMTP)
- **Vitest** (enhet + integrasjon) og **Playwright** (E2E)

## Kom i gang

```bash
# 1. Tjenester: Postgres, Mailpit (e-post-UI på :8025) og MinIO
docker compose up -d

# 2. Miljøvariabler
cp .env.example .env   # juster ved behov

# 3. Avhengigheter + database
npm install
npx prisma migrate dev

# 4. Demodata (5 brukere, grender, stove, stevne, innlegg — passord: heimetdemo123)
npm run db:seed

# 5. Kjør!
npm run dev            # → http://localhost:3000
```

Uten Docker holder det med en hvilken som helst Postgres og `DATABASE_URL` i `.env` —
e-post logges da til konsollen i dev.

## Testing

```bash
npm run test       # Vitest: enhetstester + integrasjonstester mot databasen
npm run test:e2e   # Playwright: registrering → innlegg → vennskap → feedback-regler
npm run build      # produksjonsbygg med typesjekk
```

E2E bruker en ekte nettleser. Har du ikke nedlastingstilgang, pek på en
forhåndsinstallert Chromium: `PLAYWRIGHT_CHROMIUM_PATH=/sti/til/chromium npm run test:e2e`.

## Drift og deploy

Miljøvariabler (se `.env.example`): `DATABASE_URL`, `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL`, SMTP-oppsett, `CRON_SECRET`.

**Cron-jobber** (begge beskyttet med `Authorization: Bearer $CRON_SECRET`):
- `GET /api/cron/ukesbrev` — ukentlig e-postoppsummering (opt-in)
- `GET /api/cron/sletting` — permanent sletting av kontoer etter 30 dagers angrefrist

`vercel.json` setter opp begge automatisk på Vercel (Vercel sender selv
`CRON_SECRET`-headeren når miljøvariabelen finnes).

**Vercel/serverless-forbehold:** to delsystemer forutsetter i utgangspunktet én
langlevd Node-prosess og lokal disk:
1. *Sanntid (SSE)* — fungerer, men hendelser når bare brukere på samme instans.
   Bytt pub/sub-implementasjonen i `src/lib/sse.ts` til Redis for full sanntid,
   ellers oppdateres ting ved navigasjon.
2. *Bildeopplasting* — lagres på disk (`LAGRING_DISK_STI`). På serverless må
   `src/lib/lagring.ts` utvides med S3-driveren (MinIO/S3-kompatibel).

På en VPS/Node-server (f.eks. `next start` bak nginx) fungerer alt som det er.

## GDPR og personvern

- Full dataeksport som JSON: Innstillinger → Personvern → «Last ned eksport»
- Kontosletting med 30 dagers angrefrist; alt slettes permanent via cascade
- Ingen sporing, ingen annonser, ingen deling av data med tredjeparter
- Rapportering og moderasjonskø under `/admin` (for moderatorer)

## Struktur

```
src/
├── app/            # Ruter: (auth), (app), api/, opplastinger/
├── components/     # UI per domene: innlegg/, grend/, stevne/, meldinger/ …
├── lib/            # Kjernelogikk: authz, venner, sse, dugnad, aarshjul, lagring …
├── server/         # Server actions per domene (all skrivetilgang går her)
└── generated/      # Prisma-klient (genereres av `prisma generate`)
```
