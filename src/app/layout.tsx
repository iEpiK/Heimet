import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Heimet — der Norge møtes",
    template: "%s · Heimet",
  },
  description:
    "Et norsk sosialt nettverk bygget på fellesskap og dugnadsånd — uten annonser, uten sporing, og uten salg av dataene dine.",
};

// Settes før første maling for å unngå temablink
const temaScript = `
try {
  var tema = localStorage.getItem("tema");
  if (tema === "morketid" || (!tema && matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("morketid");
  }
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
