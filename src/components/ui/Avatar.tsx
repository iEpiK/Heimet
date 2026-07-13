const storrelser = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-xl",
  xl: "size-28 text-4xl",
} as const;

export function Avatar({
  bilde,
  navn,
  storrelse = "md",
  className = "",
}: {
  bilde?: string | null;
  navn: string;
  storrelse?: keyof typeof storrelser;
  className?: string;
}) {
  const initialer = navn
    .split(/\s+/)
    .map((d) => d[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (bilde) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={bilde}
        alt={navn}
        className={`${storrelser[storrelse]} rounded-full object-cover border border-kant ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${storrelser[storrelse]} rounded-full bg-primar/15 text-primar font-semibold inline-flex items-center justify-center border border-kant ${className}`}
    >
      {initialer || "?"}
    </span>
  );
}
