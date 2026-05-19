import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <body className="bg-paper text-ink font-body antialiased">
        <main className="relative min-h-screen dot-grid flex items-center justify-center px-5 py-12">
          <div className="max-w-[640px] w-full text-center">
            <div className="inline-flex items-center gap-2 frosted-glass rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.22em] mb-6 anim-fade-up">
              <span className="w-1.5 h-1.5 rounded-full bg-aqua-brand inline-block anim-pulse" />
              ERROR · 404
            </div>

            <h1 className="font-bubble leading-[.95] tracking-tight text-[clamp(48px,10vw,112px)] mb-5 anim-fade-up delay-1 text-ink">
              LOST IN THE<br />
              <span className="wordmark wordmark--green">METAVERSE</span>
            </h1>

            <p className="text-[14.5px] text-neutral-700 max-w-[460px] mx-auto leading-relaxed mb-9 anim-fade-up delay-2">
              That page doesn&apos;t exist — or it never did. Head back to base and start again, or jump straight into the programme.
            </p>

            <div className="flex flex-wrap gap-3 justify-center anim-fade-up delay-3">
              <Link href="/" className="btn-grass">Back home <span aria-hidden>→</span></Link>
              <Link href="/#courses" className="text-[13px] font-semibold underline underline-offset-4 decoration-2 hover:text-aqua-deep transition">
                See the courses
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
