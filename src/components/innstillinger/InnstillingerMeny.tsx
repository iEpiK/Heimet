"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const punkter = [
  { href: "/innstillinger/profil", etikett: "Profil", emoji: "👤" },
  { href: "/innstillinger/personvern", etikett: "Personvern", emoji: "🔒" },
  { href: "/innstillinger/sikkerhet", etikett: "Sikkerhet", emoji: "🛡️" },
];

export function InnstillingerMeny() {
  const sti = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {punkter.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
            sti === p.href
              ? "bg-primar/10 text-primar"
              : "text-dus hover:text-tekst hover:bg-flate-dyp"
          }`}
        >
          <span aria-hidden>{p.emoji}</span> {p.etikett}
        </Link>
      ))}
    </nav>
  );
}
