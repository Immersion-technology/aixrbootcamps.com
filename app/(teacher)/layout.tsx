import Link from "next/link";
import Image from "next/image";
import { getTeacherFromCookie } from "@/lib/teacher-auth";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const teacher = await getTeacherFromCookie();
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="border-b border-black/[.05] bg-paper/95 backdrop-blur sticky top-0 z-30">
        <nav className="max-w-[1180px] mx-auto px-5 sm:px-7 h-[64px] sm:h-[72px] flex items-center justify-between gap-4">
          <Link href={teacher ? "/teacher" : "/"} aria-label="IMMERSIA facilitator portal" className="block shrink-0">
            <Image src="/logo.png" alt="IMMERSIA" width={1044} height={335} priority sizes="180px" className="h-8 sm:h-9 w-auto" />
          </Link>
          {teacher ? (
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-[11px] font-bold tracking-[.18em] uppercase text-aqua-deep">Facilitator</span>
              <span className="hidden sm:inline text-[12.5px] text-neutral-600">
                <strong className="text-ink">{teacher.name}</strong>
              </span>
              <form action="/api/teacher/logout" method="POST">
                <button type="submit" className="text-[12.5px] font-semibold underline underline-offset-4 decoration-2 hover:text-aqua-deep transition">
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link href="/teacher/login" className="text-[12.5px] font-semibold underline underline-offset-4 decoration-2 hover:text-aqua-deep transition">
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
          <Link href="/contact" className="hover:text-ink transition">Talk to a human</Link>
        </p>
      </footer>
    </div>
  );
}
