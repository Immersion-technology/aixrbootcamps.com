import { Suspense } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import MetaPixel from "@/components/MetaPixel";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      <MetaPixel />
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
