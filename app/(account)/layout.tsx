import Link from "next/link";
import { getParentFromCookie } from "@/lib/account-auth";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const parent = await getParentFromCookie();
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="border-b border-black/[.05] bg-paper/95 backdrop-blur sticky top-0 z-30">
        <nav className="max-w-[1180px] mx-auto px-5 sm:px-7 h-[64px] sm:h-[72px] flex items-center justify-between gap-4">
          <Link href="/" aria-label="AI & XR Summer Tech Bootcamp" className="block shrink-0">
            <img src="/imm.png" alt="IMMERSIA" className="h-8 sm:h-9 w-auto" loading="eager" decoding="async" fetchPriority="high" />
          </Link>
          {parent ? (
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-[12.5px] text-neutral-600">
                Signed in as <strong className="text-ink">{parent.name}</strong>
              </span>
              <form action="/api/account/logout" method="POST">
                <button type="submit" className="text-[12.5px] font-semibold underline underline-offset-4 decoration-2 hover:text-aqua-deep transition">
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link href="/account/login" className="text-[12.5px] font-semibold underline underline-offset-4 decoration-2 hover:text-aqua-deep transition">
              Sign in
            </Link>
          )}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-black/[.05] py-6 px-5 sm:px-7">
        <p className="max-w-[1180px] mx-auto text-[11.5px] text-neutral-500 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>© 2026 IMMERSIA</span>
          <Link href="/privacy" className="hover:text-ink transition">Privacy</Link>
          <Link href="/terms" className="hover:text-ink transition">Rules of conduct</Link>
          <Link href="/contact" className="hover:text-ink transition">Talk to a human</Link>
        </p>
      </footer>
    </div>
  );
}
