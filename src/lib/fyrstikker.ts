import type { FyrstikkType } from "@/generated/prisma/enums";

export const FYRSTIKKER: { type: FyrstikkType; emoji: string; navn: string }[] = [
  { type: "FYR", emoji: "🔥", navn: "Fyr" },
  { type: "STORSLATT", emoji: "🏔️", navn: "Storslått" },
  { type: "KOS", emoji: "❤️", navn: "Kos" },
  { type: "DUGNAD", emoji: "🤝", navn: "Dugnadsånd" },
  { type: "HUMRING", emoji: "😄", navn: "Humring" },
];
