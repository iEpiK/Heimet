"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const lenker = [
  { href: "/tunet", etikett: "Tunet", emoji: "🏡" },
  { href: "/grender", etikett: "Grender", emoji: "🏘️" },
  { href: "/stover", etikett: "Stover", emoji: "🪵" },
  { href: "/stevner", etikett: "Stevner", emoji: "📅" },
  { href: "/meldinger", etikett: "Meldinger", emoji: "✉️" },
];

export function Navigasjon({ ulesteSamtaler = 0 }: { ulesteSamtaler?: number }) {
  const sti = usePathname();
  return (
    <nav className="flex items-center gap-1">
      {lenker.map((l) => {
        const aktiv = sti === l.href || sti.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              aktiv
                ? "bg-primar/10 text-primar"
                : "text-dus hover:text-tekst hover:bg-flate-dyp"
            }`}
          >
            <span aria-hidden>{l.emoji}</span>
            <span className="hidden md:inline">{l.etikett}</span>
            {l.href === "/meldinger" && ulesteSamtaler > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-aksent px-1 text-[10px] font-bold text-white">
                {ulesteSamtaler > 9 ? "9+" : ulesteSamtaler}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
