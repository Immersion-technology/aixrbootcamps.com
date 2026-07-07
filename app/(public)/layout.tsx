import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { PRICING, EARLY_BIRD_CUTOFF_DEFAULT } from "@/lib/pricing";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnalyticsTracker />
      <AnnouncementBanner
        earlyBirdCutoff={EARLY_BIRD_CUTOFF_DEFAULT}
        earlyBirdKobo={PRICING.earlyBird}
        regularKobo={PRICING.regular}
      />
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
