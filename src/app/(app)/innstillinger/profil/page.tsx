import { krevBruker } from "@/lib/session";
import { ProfilSkjema } from "@/components/innstillinger/ProfilSkjema";

export const metadata = { title: "Profilinnstillinger" };

export default async function ProfilInnstillinger() {
  const bruker = await krevBruker();
  return (
    <ProfilSkjema
      start={{
        navn: bruker.name,
        bio: bruker.bio ?? "",
        kommune: bruker.kommune ?? "",
        fodselsdato: bruker.fodselsdato
          ? bruker.fodselsdato.toISOString().slice(0, 10)
          : "",
        avatar: bruker.image,
        cover: bruker.coverbilde,
      }}
    />
  );
}
