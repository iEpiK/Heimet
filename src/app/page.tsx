import Link from "next/link";
import { redirect } from "next/navigation";
import { hentBruker } from "@/lib/session";
import { Knapp } from "@/components/ui/Knapp";

const loefter = [
  {
    emoji: "🤝",
    tittel: "Dugnadsånd, ikke algoritmer",
    tekst:
      "Tunet ditt viser det venner og grender deler — i den rekkefølgen det skjedde. Ingen skjult sortering, ingen «anbefalt for deg».",
  },
  {
    emoji: "🔒",
    tittel: "Dataene dine er dine",
    tekst:
      "Vi selger aldri brukerdata og viser aldri annonser. Du kan laste ned alt du har delt, eller slette kontoen din, når som helst.",
  },
  {
    emoji: "🏔️",
    tittel: "Bygget for Norge",
    tekst:
      "Grender for bygda og interessene dine, stevner for alt fra skitur til rakfisklag, og et årshjul som følger norske sesonger.",
  },
  {
    emoji: "🗣️",
    tittel: "Du styrer samtalen",
    tekst:
      "For hvert innlegg velger du hvem som ser det og hvem som kan svare — alle, kun venner, eller ingen.",
  },
];

export default async function Forside() {
  const bruker = await hentBruker();
  if (bruker) redirect("/tunet");

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            🏔️ Heimet
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/logg-inn" className="text-sm text-dus hover:text-tekst transition-colors">
              Logg inn
            </Link>
            <Link href="/registrer">
              <Knapp>Bli med</Knapp>
            </Link>
          </nav>
        </header>

        <section className="py-20 text-center heim-inn">
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight text-balance">
            Der Norge møtes —<br />
            <span className="text-primar">uten annonser, uten sporing.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-dus text-pretty">
            Heimet er et sosialt nettverk bygget på norsk dugnadsånd. Del med de
            som betyr noe, finn grenda di, og møt folk på ordentlig — vi tjener
            aldri penger på dataene dine.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/registrer">
              <Knapp className="px-6 py-3 text-base">Kom heim 🏡</Knapp>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 py-8 sm:grid-cols-2">
          {loefter.map((l) => (
            <div key={l.tittel} className="rounded-xl border border-kant bg-flate p-6 shadow-heim">
              <div className="text-3xl">{l.emoji}</div>
              <h2 className="mt-3 text-lg font-semibold">{l.tittel}</h2>
              <p className="mt-1.5 text-sm text-dus leading-relaxed">{l.tekst}</p>
            </div>
          ))}
        </section>

        <footer className="border-t border-kant py-8 text-center text-sm text-dus">
          Heimet · bygget i Norge med ❤️ · ingen annonser · ingen datasalg
        </footer>
      </div>
    </main>
  );
}
