import { Suspense } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AnalyticsTracker from "@/components/AnalyticsTracker";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
