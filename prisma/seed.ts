import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";
import { lagSlug } from "../src/lib/slug";
import { hentUkasBal } from "../src/lib/bal";

// Demodata for lokal utvikling: `npm run db:seed`
// Alle brukere har passordet «heimetdemo123».

const PASSORD = "heimetdemo123";

const BRUKERE = [
  { navn: "Odd Erik Vestbø", brukernavn: "odderik", epost: "odderik@demo.heimet.no", kommune: "Voss", bio: "Friluftsentusiast og kaffedrikker. Alltid klar for en fjelltur!" },
  { navn: "Kari Fjellheim", brukernavn: "kari", epost: "kari@demo.heimet.no", kommune: "Voss", bio: "Strikker, går på ski og baker verdens beste skillingsboller." },
  { navn: "Lars Bakke", brukernavn: "lars", epost: "lars@demo.heimet.no", kommune: "Bergen", bio: "Utvikler om dagen, hobbyfisker om kvelden." },
  { navn: "Ingrid Solvang", brukernavn: "ingrid", epost: "ingrid@demo.heimet.no", kommune: "Tromsø", bio: "Nordlysjeger og fotograf 📸" },
  { navn: "Magnus Dale", brukernavn: "magnus", epost: "magnus@demo.heimet.no", kommune: "Trondheim", bio: "Spiller i korps og samler på vinyl." },
];

async function main() {
  console.log("🌱 Sår demodata …");

  // Brukere via better-auth så passordene fungerer
  const brukere: { id: string }[] = [];
  for (const b of BRUKERE) {
    const eksisterende = await prisma.user.findUnique({ where: { email: b.epost } });
    if (eksisterende) {
      brukere.push(eksisterende);
      continue;
    }
    await auth.api.signUpEmail({
      body: { name: b.navn, email: b.epost, password: PASSORD, username: b.brukernavn },
    });
    const idag = new Date();
    const bruker = await prisma.user.update({
      where: { email: b.epost },
      data: {
        emailVerified: true,
        bio: b.bio,
        kommune: b.kommune,
        // Kari har bursdag i dag (for bursdagspanelet), resten spredt utover
        fodselsdato:
          b.brukernavn === "kari"
            ? new Date(Date.UTC(1988, idag.getMonth(), idag.getDate()))
            : new Date(Date.UTC(1990 + brukere.length, (brukere.length * 3) % 12, 10 + brukere.length)),
        ukesbrev: true,
      },
    });
    brukere.push(bruker);
  }
  const [odd, kari, lars, ingrid, magnus] = brukere;

  // Odd Erik er plattform-moderator
  await prisma.user.update({ where: { id: odd.id }, data: { rolle: "ADMIN" } });

  // Vennskap
  const par: [string, string][] = [
    [odd.id, kari.id],
    [odd.id, lars.id],
    [kari.id, lars.id],
    [kari.id, ingrid.id],
    [ingrid.id, magnus.id],
  ];
  for (const [fra, til] of par) {
    await prisma.vennskap.upsert({
      where: { fraId_tilId: { fraId: fra, tilId: til } },
      create: { fraId: fra, tilId: til, status: "GODTATT", godtattAt: new Date() },
      update: {},
    });
  }
  // Én ventende forespørsel
  await prisma.vennskap.upsert({
    where: { fraId_tilId: { fraId: magnus.id, tilId: odd.id } },
    create: { fraId: magnus.id, tilId: odd.id, status: "VENTER" },
    update: {},
  });

  // Grend med medlemmer og bål
  let grend = await prisma.grend.findFirst({ where: { navn: "Vossabygda" } });
  if (!grend) {
    grend = await prisma.grend.create({
      data: {
        navn: "Vossabygda",
        slug: lagSlug("Vossabygda"),
        beskrivelse: "Grenda for alle med hjertet i Voss — turer, dugnader og godt naboskap.",
        type: "AAPEN",
        kommune: "Voss",
        medlemmer: {
          create: [
            { brukerId: odd.id, rolle: "ADMIN" },
            { brukerId: kari.id, rolle: "MODERATOR" },
            { brukerId: lars.id },
          ],
        },
      },
    });
  }
  const bal = await hentUkasBal(grend.id);
  if (bal.svar.length === 0) {
    await prisma.balSvar.create({
      data: { balId: bal.id, brukerId: kari.id, innhold: "Godt spørsmål! Jeg sier Hanguren — kort vei, stor utsikt. ⛰️" },
    });
  }

  // Lukket grend
  const lukket = await prisma.grend.findFirst({ where: { navn: "Strikkeklubben" } });
  if (!lukket) {
    await prisma.grend.create({
      data: {
        navn: "Strikkeklubben",
        slug: lagSlug("Strikkeklubben"),
        beskrivelse: "Lukket klubb for oss som strikker. Søk om medlemskap!",
        type: "LUKKET",
        medlemmer: {
          create: [
            { brukerId: kari.id, rolle: "ADMIN" },
            { brukerId: ingrid.id, status: "VENTER" },
          ],
        },
      },
    });
  }

  // Stove
  let stove = await prisma.stove.findFirst({ where: { navn: "Voss IL" } });
  if (!stove) {
    stove = await prisma.stove.create({
      data: {
        navn: "Voss IL",
        slug: lagSlug("Voss IL"),
        kategori: "Idrett",
        beskrivelse: "Idrettslaget for hele bygda — følg oss for treninger og kampoppsett.",
        roller: { create: { brukerId: odd.id, rolle: "ADMIN" } },
        folgere: { create: [{ brukerId: odd.id }, { brukerId: kari.id }, { brukerId: lars.id }] },
      },
    });
  }

  // Stevner
  const omTreDager = new Date(Date.now() + 3 * 24 * 3600 * 1000);
  omTreDager.setHours(11, 0, 0, 0);
  let stevne = await prisma.stevne.findFirst({ where: { tittel: "Søndagstur til Hanguren" } });
  if (!stevne) {
    stevne = await prisma.stevne.create({
      data: {
        tittel: "Søndagstur til Hanguren",
        beskrivelse: "Vi tar gondolen ned og går opp — ta med niste og godt humør!",
        start: omTreDager,
        sted: "Voss gondol",
        synlighet: "OFFENTLIG",
        arrangorId: odd.id,
        grendId: grend.id,
        svar: {
          create: [
            { brukerId: odd.id, svar: "KOMMER" },
            { brukerId: kari.id, svar: "KOMMER" },
            { brukerId: lars.id, svar: "KANSKJE" },
          ],
        },
      },
    });
  }

  // Innlegg med ulike synligheter og feedback-regler
  const antallInnlegg = await prisma.innlegg.count();
  if (antallInnlegg === 0) {
    const i1 = await prisma.innlegg.create({
      data: {
        forfatterId: kari.id,
        innhold: "Ferske skillingsboller rett fra ovnen! Hvem stikker innom? 🥐",
        synlighet: "OFFENTLIG",
        feedbackPolicy: "ALLE",
      },
    });
    await prisma.innlegg.create({
      data: {
        forfatterId: odd.id,
        innhold: "Tanker etter dagens tur: vi burde arrangere fellestur for hele grenda. Hvem er med?",
        synlighet: "VENNER",
        feedbackPolicy: "VENNER",
      },
    });
    await prisma.innlegg.create({
      data: {
        forfatterId: lars.id,
        innhold: "Dagens fangst fra Vangsvatnet 🎣 Tre ørreter — grillkveld i helga!",
        synlighet: "OFFENTLIG",
        feedbackPolicy: "ALLE",
        grendId: grend.id,
      },
    });
    await prisma.innlegg.create({
      data: {
        forfatterId: ingrid.id,
        innhold: "Nordlyset i natt var helt magisk. Deler bilder snart — men dette innlegget er bare til å nyte, ikke kommentere. 😌",
        synlighet: "OFFENTLIG",
        feedbackPolicy: "INGEN",
      },
    });
    await prisma.innlegg.create({
      data: {
        forfatterId: odd.id,
        innhold: "Treningstidene for høsten er klare! Sjekk oppslagstavla på klubbhuset eller send oss en melding.",
        synlighet: "OFFENTLIG",
        stoveId: stove.id,
      },
    });

    await prisma.fyrstikk.createMany({
      data: [
        { brukerId: odd.id, innleggId: i1.id, type: "KOS" },
        { brukerId: lars.id, innleggId: i1.id, type: "FYR" },
      ],
    });
    const k1 = await prisma.kommentar.create({
      data: { innleggId: i1.id, forfatterId: odd.id, innhold: "Er der om ti minutter! 🏃" },
    });
    await prisma.kommentar.create({
      data: { innleggId: i1.id, forfatterId: kari.id, innhold: "Haha, kaffen står klar!", parentId: k1.id },
    });
  }

  console.log("✅ Demodata på plass!");
  console.log(`   Brukere: ${BRUKERE.map((b) => b.brukernavn).join(", ")}`);
  console.log(`   Passord: ${PASSORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((feil) => {
    console.error(feil);
    process.exit(1);
  });
