import { ButtonHTMLAttributes } from "react";

type Variant = "primar" | "sekundar" | "farlig" | "flat";

const stiler: Record<Variant, string> = {
  primar:
    "bg-primar text-pa-primar hover:bg-primar-hover shadow-heim",
  sekundar:
    "bg-flate text-tekst border border-kant hover:border-primar hover:text-primar",
  farlig:
    "bg-flate text-negativ border border-kant hover:border-negativ",
  flat: "text-dus hover:text-tekst hover:bg-flate-dyp",
};

export function Knapp({
  variant = "primar",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${stiler[variant]} ${className}`}
      {...props}
    />
  );
}
