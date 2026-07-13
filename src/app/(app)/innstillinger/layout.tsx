import { InnstillingerMeny } from "@/components/innstillinger/InnstillingerMeny";

export const metadata = { title: "Innstillinger" };

export default function InnstillingerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 md:flex-row heim-inn">
      <aside className="md:w-52 shrink-0">
        <h1 className="px-3 pb-3 text-xl font-semibold">Innstillinger</h1>
        <InnstillingerMeny />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
