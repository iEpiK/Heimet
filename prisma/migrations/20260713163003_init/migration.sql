-- CreateEnum
CREATE TYPE "SystemRolle" AS ENUM ('BRUKER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "Synlighet" AS ENUM ('OFFENTLIG', 'VENNER', 'GREND');

-- CreateEnum
CREATE TYPE "FeedbackPolicy" AS ENUM ('ALLE', 'VENNER', 'INGEN');

-- CreateEnum
CREATE TYPE "BursdagSynlighet" AS ENUM ('ALLE', 'VENNER', 'SKJULT');

-- CreateEnum
CREATE TYPE "FyrstikkType" AS ENUM ('FYR', 'STORSLATT', 'KOS', 'DUGNAD', 'HUMRING');

-- CreateEnum
CREATE TYPE "VennskapStatus" AS ENUM ('VENTER', 'GODTATT');

-- CreateEnum
CREATE TYPE "GrendType" AS ENUM ('AAPEN', 'LUKKET', 'SKJULT');

-- CreateEnum
CREATE TYPE "GrendRolle" AS ENUM ('MEDLEM', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "MedlemskapStatus" AS ENUM ('VENTER', 'GODKJENT');

-- CreateEnum
CREATE TYPE "StoveRolleType" AS ENUM ('REDAKTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "StevneSvarType" AS ENUM ('KOMMER', 'KANSKJE', 'KAN_IKKE');

-- CreateEnum
CREATE TYPE "RapportStatus" AS ENUM ('NY', 'UNDER_BEHANDLING', 'LUKKET');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT,
    "displayUsername" TEXT,
    "twoFactorEnabled" BOOLEAN DEFAULT false,
    "bio" TEXT,
    "coverbilde" TEXT,
    "fodselsdato" DATE,
    "kommune" TEXT,
    "rolle" "SystemRolle" NOT NULL DEFAULT 'BRUKER',
    "standardSynlighet" "Synlighet" NOT NULL DEFAULT 'VENNER',
    "standardFeedback" "FeedbackPolicy" NOT NULL DEFAULT 'ALLE',
    "bursdagSynlighet" "BursdagSynlighet" NOT NULL DEFAULT 'VENNER',
    "ukesbrev" BOOLEAN NOT NULL DEFAULT false,
    "slettesAt" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twoFactor" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "twoFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passkey" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "publicKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialID" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL,
    "transports" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "aaguid" TEXT,

    CONSTRAINT "passkey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vennskap" (
    "id" TEXT NOT NULL,
    "fraId" TEXT NOT NULL,
    "tilId" TEXT NOT NULL,
    "status" "VennskapStatus" NOT NULL DEFAULT 'VENTER',
    "opprettetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "godtattAt" TIMESTAMP(3),

    CONSTRAINT "vennskap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blokkering" (
    "id" TEXT NOT NULL,
    "blokkererId" TEXT NOT NULL,
    "blokkertId" TEXT NOT NULL,
    "opprettetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blokkering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "innlegg" (
    "id" TEXT NOT NULL,
    "forfatterId" TEXT NOT NULL,
    "innhold" TEXT NOT NULL,
    "synlighet" "Synlighet" NOT NULL DEFAULT 'VENNER',
    "feedbackPolicy" "FeedbackPolicy" NOT NULL DEFAULT 'ALLE',
    "grendId" TEXT,
    "stoveId" TEXT,
    "opprettetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redigertAt" TIMESTAMP(3),

    CONSTRAINT "innlegg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "innleggId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "bredde" INTEGER,
    "hoyde" INTEGER,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fyrstikk" (
    "id" TEXT NOT NULL,
    "type" "FyrstikkType" NOT NULL,
    "brukerId" TEXT NOT NULL,
    "innleggId" TEXT,
    "kommentarId" TEXT,
    "opprettetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fyrstikk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kommentar" (
    "id" TEXT NOT NULL,
    "innleggId" TEXT NOT NULL,
    "forfatterId" TEXT NOT NULL,
    "innhold" TEXT NOT NULL,
    "parentId" TEXT,
    "opprettetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redigertAt" TIMESTAMP(3),

    CONSTRAINT "kommentar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grend" (
    "id" TEXT NOT NULL,
    "navn" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "beskrivelse" TEXT,
    "type" "GrendType" NOT NULL DEFAULT 'AAPEN',
    "kommune" TEXT,
    "coverbilde" TEXT,
    "opprettetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grend_medlemskap" (
    "id" TEXT NOT NULL,
    "grendId" TEXT NOT NULL,
    "brukerId" TEXT NOT NULL,
    "rolle" "GrendRolle" NOT NULL DEFAULT 'MEDLEM',
    "status" "MedlemskapStatus" NOT NULL DEFAULT 'GODKJENT',
    "opprettetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grend_medlemskap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stove" (
    "id" TEXT NOT NULL,
    "navn" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "beskrivelse" TEXT,
    "coverbilde" TEXT,
    "opprettetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stove_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stove_rolle" (
    "id" TEXT NOT NULL,
    "stoveId" TEXT NOT NULL,
    "brukerId" TEXT NOT NULL,
    "rolle" "StoveRolleType" NOT NULL DEFAULT 'REDAKTOR',

    CONSTRAINT "stove_rolle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stove_folging" (
    "id" TEXT NOT NULL,
    "stoveId" TEXT NOT NULL,
    "brukerId" TEXT NOT NULL,
    "opprettetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stove_folging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stevne" (
    "id" TEXT NOT NULL,
    "tittel" TEXT NOT NULL,
    "beskrivelse" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "slutt" TIMESTAMP(3),
    "sted" TEXT,
    "synlighet" "Synlighet" NOT NULL DEFAULT 'VENNER',
    "arrangorId" TEXT NOT NULL,
    "grendId" TEXT,
    "stoveId" TEXT,
    "coverbilde" TEXT,
    "opprettetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stevne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stevne_svar" (
    "id" TEXT NOT NULL,
    "stevneId" TEXT NOT NULL,
    "brukerId" TEXT NOT NULL,
    "svar" "StevneSvarType" NOT NULL,
    "svartAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stevne_svar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "samtale" (
    "id" TEXT NOT NULL,
    "navn" TEXT,
    "erGruppe" BOOLEAN NOT NULL DEFAULT false,
    "opprettetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sisteAktivitet" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "samtale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "samtale_medlem" (
    "id" TEXT NOT NULL,
    "samtaleId" TEXT NOT NULL,
    "brukerId" TEXT NOT NULL,
    "sistLest" TIMESTAMP(3),
    "blittMedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "samtale_medlem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "melding" (
    "id" TEXT NOT NULL,
    "samtaleId" TEXT NOT NULL,
    "avsenderId" TEXT NOT NULL,
    "innhold" TEXT NOT NULL,
    "opprettetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "melding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "varsel" (
    "id" TEXT NOT NULL,
    "mottakerId" TEXT NOT NULL,
    "aktorId" TEXT,
    "type" TEXT NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "tekst" TEXT,
    "lest" BOOLEAN NOT NULL DEFAULT false,
    "opprettetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "varsel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dugnadspoeng" (
    "id" TEXT NOT NULL,
    "brukerId" TEXT NOT NULL,
    "handling" TEXT NOT NULL,
    "poeng" INTEGER NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "opprettetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dugnadspoeng_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merke" (
    "id" TEXT NOT NULL,
    "brukerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tildeltAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merke_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ukas_bal" (
    "id" TEXT NOT NULL,
    "grendId" TEXT NOT NULL,
    "sporsmal" TEXT NOT NULL,
    "uke" INTEGER NOT NULL,
    "ar" INTEGER NOT NULL,
    "opprettetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ukas_bal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bal_svar" (
    "id" TEXT NOT NULL,
    "balId" TEXT NOT NULL,
    "brukerId" TEXT NOT NULL,
    "innhold" TEXT NOT NULL,
    "opprettetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bal_svar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Arshjul" (
    "id" TEXT NOT NULL,
    "navn" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "startDato" TEXT NOT NULL,
    "sluttDato" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "hilsen" TEXT NOT NULL,

    CONSTRAINT "Arshjul_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapport" (
    "id" TEXT NOT NULL,
    "rapportorId" TEXT NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "arsak" TEXT NOT NULL,
    "status" "RapportStatus" NOT NULL DEFAULT 'NY',
    "behandletAv" TEXT,
    "notat" TEXT,
    "opprettetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "behandletAt" TIMESTAMP(3),

    CONSTRAINT "rapport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "twoFactor_userId_idx" ON "twoFactor"("userId");

-- CreateIndex
CREATE INDEX "passkey_userId_idx" ON "passkey"("userId");

-- CreateIndex
CREATE INDEX "vennskap_tilId_status_idx" ON "vennskap"("tilId", "status");

-- CreateIndex
CREATE INDEX "vennskap_fraId_status_idx" ON "vennskap"("fraId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "vennskap_fraId_tilId_key" ON "vennskap"("fraId", "tilId");

-- CreateIndex
CREATE INDEX "blokkering_blokkertId_idx" ON "blokkering"("blokkertId");

-- CreateIndex
CREATE UNIQUE INDEX "blokkering_blokkererId_blokkertId_key" ON "blokkering"("blokkererId", "blokkertId");

-- CreateIndex
CREATE INDEX "innlegg_forfatterId_opprettetAt_idx" ON "innlegg"("forfatterId", "opprettetAt" DESC);

-- CreateIndex
CREATE INDEX "innlegg_grendId_opprettetAt_idx" ON "innlegg"("grendId", "opprettetAt" DESC);

-- CreateIndex
CREATE INDEX "innlegg_stoveId_opprettetAt_idx" ON "innlegg"("stoveId", "opprettetAt" DESC);

-- CreateIndex
CREATE INDEX "innlegg_opprettetAt_idx" ON "innlegg"("opprettetAt" DESC);

-- CreateIndex
CREATE INDEX "media_innleggId_idx" ON "media"("innleggId");

-- CreateIndex
CREATE INDEX "fyrstikk_innleggId_idx" ON "fyrstikk"("innleggId");

-- CreateIndex
CREATE INDEX "fyrstikk_kommentarId_idx" ON "fyrstikk"("kommentarId");

-- CreateIndex
CREATE UNIQUE INDEX "fyrstikk_brukerId_innleggId_key" ON "fyrstikk"("brukerId", "innleggId");

-- CreateIndex
CREATE UNIQUE INDEX "fyrstikk_brukerId_kommentarId_key" ON "fyrstikk"("brukerId", "kommentarId");

-- CreateIndex
CREATE INDEX "kommentar_innleggId_opprettetAt_idx" ON "kommentar"("innleggId", "opprettetAt");

-- CreateIndex
CREATE INDEX "kommentar_parentId_idx" ON "kommentar"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "grend_slug_key" ON "grend"("slug");

-- CreateIndex
CREATE INDEX "grend_kommune_idx" ON "grend"("kommune");

-- CreateIndex
CREATE INDEX "grend_medlemskap_brukerId_status_idx" ON "grend_medlemskap"("brukerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "grend_medlemskap_grendId_brukerId_key" ON "grend_medlemskap"("grendId", "brukerId");

-- CreateIndex
CREATE UNIQUE INDEX "stove_slug_key" ON "stove"("slug");

-- CreateIndex
CREATE INDEX "stove_rolle_brukerId_idx" ON "stove_rolle"("brukerId");

-- CreateIndex
CREATE UNIQUE INDEX "stove_rolle_stoveId_brukerId_key" ON "stove_rolle"("stoveId", "brukerId");

-- CreateIndex
CREATE INDEX "stove_folging_brukerId_idx" ON "stove_folging"("brukerId");

-- CreateIndex
CREATE UNIQUE INDEX "stove_folging_stoveId_brukerId_key" ON "stove_folging"("stoveId", "brukerId");

-- CreateIndex
CREATE INDEX "stevne_start_idx" ON "stevne"("start");

-- CreateIndex
CREATE INDEX "stevne_grendId_start_idx" ON "stevne"("grendId", "start");

-- CreateIndex
CREATE INDEX "stevne_arrangorId_idx" ON "stevne"("arrangorId");

-- CreateIndex
CREATE INDEX "stevne_svar_brukerId_idx" ON "stevne_svar"("brukerId");

-- CreateIndex
CREATE UNIQUE INDEX "stevne_svar_stevneId_brukerId_key" ON "stevne_svar"("stevneId", "brukerId");

-- CreateIndex
CREATE INDEX "samtale_sisteAktivitet_idx" ON "samtale"("sisteAktivitet" DESC);

-- CreateIndex
CREATE INDEX "samtale_medlem_brukerId_idx" ON "samtale_medlem"("brukerId");

-- CreateIndex
CREATE UNIQUE INDEX "samtale_medlem_samtaleId_brukerId_key" ON "samtale_medlem"("samtaleId", "brukerId");

-- CreateIndex
CREATE INDEX "melding_samtaleId_opprettetAt_idx" ON "melding"("samtaleId", "opprettetAt" DESC);

-- CreateIndex
CREATE INDEX "varsel_mottakerId_lest_opprettetAt_idx" ON "varsel"("mottakerId", "lest", "opprettetAt" DESC);

-- CreateIndex
CREATE INDEX "dugnadspoeng_brukerId_opprettetAt_idx" ON "dugnadspoeng"("brukerId", "opprettetAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "merke_brukerId_type_key" ON "merke"("brukerId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ukas_bal_grendId_ar_uke_key" ON "ukas_bal"("grendId", "ar", "uke");

-- CreateIndex
CREATE INDEX "bal_svar_balId_opprettetAt_idx" ON "bal_svar"("balId", "opprettetAt");

-- CreateIndex
CREATE INDEX "rapport_status_opprettetAt_idx" ON "rapport"("status", "opprettetAt");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vennskap" ADD CONSTRAINT "vennskap_fraId_fkey" FOREIGN KEY ("fraId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vennskap" ADD CONSTRAINT "vennskap_tilId_fkey" FOREIGN KEY ("tilId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blokkering" ADD CONSTRAINT "blokkering_blokkererId_fkey" FOREIGN KEY ("blokkererId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blokkering" ADD CONSTRAINT "blokkering_blokkertId_fkey" FOREIGN KEY ("blokkertId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "innlegg" ADD CONSTRAINT "innlegg_forfatterId_fkey" FOREIGN KEY ("forfatterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "innlegg" ADD CONSTRAINT "innlegg_grendId_fkey" FOREIGN KEY ("grendId") REFERENCES "grend"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "innlegg" ADD CONSTRAINT "innlegg_stoveId_fkey" FOREIGN KEY ("stoveId") REFERENCES "stove"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_innleggId_fkey" FOREIGN KEY ("innleggId") REFERENCES "innlegg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fyrstikk" ADD CONSTRAINT "fyrstikk_brukerId_fkey" FOREIGN KEY ("brukerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fyrstikk" ADD CONSTRAINT "fyrstikk_innleggId_fkey" FOREIGN KEY ("innleggId") REFERENCES "innlegg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fyrstikk" ADD CONSTRAINT "fyrstikk_kommentarId_fkey" FOREIGN KEY ("kommentarId") REFERENCES "kommentar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kommentar" ADD CONSTRAINT "kommentar_innleggId_fkey" FOREIGN KEY ("innleggId") REFERENCES "innlegg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kommentar" ADD CONSTRAINT "kommentar_forfatterId_fkey" FOREIGN KEY ("forfatterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kommentar" ADD CONSTRAINT "kommentar_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "kommentar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grend_medlemskap" ADD CONSTRAINT "grend_medlemskap_grendId_fkey" FOREIGN KEY ("grendId") REFERENCES "grend"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grend_medlemskap" ADD CONSTRAINT "grend_medlemskap_brukerId_fkey" FOREIGN KEY ("brukerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stove_rolle" ADD CONSTRAINT "stove_rolle_stoveId_fkey" FOREIGN KEY ("stoveId") REFERENCES "stove"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stove_rolle" ADD CONSTRAINT "stove_rolle_brukerId_fkey" FOREIGN KEY ("brukerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stove_folging" ADD CONSTRAINT "stove_folging_stoveId_fkey" FOREIGN KEY ("stoveId") REFERENCES "stove"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stove_folging" ADD CONSTRAINT "stove_folging_brukerId_fkey" FOREIGN KEY ("brukerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stevne" ADD CONSTRAINT "stevne_arrangorId_fkey" FOREIGN KEY ("arrangorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stevne" ADD CONSTRAINT "stevne_grendId_fkey" FOREIGN KEY ("grendId") REFERENCES "grend"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stevne" ADD CONSTRAINT "stevne_stoveId_fkey" FOREIGN KEY ("stoveId") REFERENCES "stove"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stevne_svar" ADD CONSTRAINT "stevne_svar_stevneId_fkey" FOREIGN KEY ("stevneId") REFERENCES "stevne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stevne_svar" ADD CONSTRAINT "stevne_svar_brukerId_fkey" FOREIGN KEY ("brukerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samtale_medlem" ADD CONSTRAINT "samtale_medlem_samtaleId_fkey" FOREIGN KEY ("samtaleId") REFERENCES "samtale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samtale_medlem" ADD CONSTRAINT "samtale_medlem_brukerId_fkey" FOREIGN KEY ("brukerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "melding" ADD CONSTRAINT "melding_samtaleId_fkey" FOREIGN KEY ("samtaleId") REFERENCES "samtale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "melding" ADD CONSTRAINT "melding_avsenderId_fkey" FOREIGN KEY ("avsenderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "varsel" ADD CONSTRAINT "varsel_mottakerId_fkey" FOREIGN KEY ("mottakerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "varsel" ADD CONSTRAINT "varsel_aktorId_fkey" FOREIGN KEY ("aktorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dugnadspoeng" ADD CONSTRAINT "dugnadspoeng_brukerId_fkey" FOREIGN KEY ("brukerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merke" ADD CONSTRAINT "merke_brukerId_fkey" FOREIGN KEY ("brukerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ukas_bal" ADD CONSTRAINT "ukas_bal_grendId_fkey" FOREIGN KEY ("grendId") REFERENCES "grend"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bal_svar" ADD CONSTRAINT "bal_svar_balId_fkey" FOREIGN KEY ("balId") REFERENCES "ukas_bal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bal_svar" ADD CONSTRAINT "bal_svar_brukerId_fkey" FOREIGN KEY ("brukerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapport" ADD CONSTRAINT "rapport_rapportorId_fkey" FOREIGN KEY ("rapportorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
