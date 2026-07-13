import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 text-3xl font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        🏔️ Heimet
      </Link>
      <div className="w-full max-w-md heim-inn">{children}</div>
      <p className="mt-8 max-w-sm text-center text-xs text-dus">
        Heimet selger aldri dataene dine og viser aldri annonser.
      </p>
    </main>
  );
}
