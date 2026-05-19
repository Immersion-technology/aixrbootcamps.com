import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {/* pb-[76px] clears the fixed mobile bottom tab bar (60px min-height + 16px iOS safe-area buffer).
          The tab bar hides itself on /register, but the padding is a no-op there. */}
      <main className="pb-[76px] md:pb-0">{children}</main>
      <Footer />
    </>
  );
}
