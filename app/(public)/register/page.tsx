import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { getSetting, SETTING_KEYS } from "@/models/Setting";
import { redirect } from "next/navigation";
import { PRICING, nairaFromKobo } from "@/lib/pricing";
import RegistrationForm from "./RegistrationForm";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return {
    title: "Register · Reserve your camper's slot",
    description: `Secure a place at the IMMERSIA AI & XR Summer Tech Bootcamp 2026. In-person for ${nairaFromKobo(PRICING.regular)} or online for ${nairaFromKobo(PRICING.online)}.`,
    alternates: { canonical: "/register" },
  };
}

async function getRegisterData() {
  // Prices come from lib/pricing.ts (env-configurable). Capacity comes from DB Settings.
  try {
    await connectDB();
    const [capacity, paid] = await Promise.all([
      getSetting<number>(SETTING_KEYS.CAPACITY, 50),
      Registration.countDocuments({ paymentStatus: "paid" }),
    ]);
    return { capacity, paid };
  } catch {
    return { capacity: 50, paid: 0 };
  }
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { mode?: string };
}) {
  const { capacity, paid } = await getRegisterData();

  if (paid >= capacity) {
    redirect("/register/closed");
  }

  // Flyer / landing "Join online" links land on /register?mode=online — preselect online.
  const initialMode = searchParams?.mode === "online" ? "online" : "in_person";
  // Match the hero: hold slotsLeft at full capacity until the DB-backed count is trusted.
  const slotsLeft = capacity;

  return (
    <section className="relative pt-12 pb-24 dot-grid min-h-[80vh]">
      <div className="max-w-[860px] mx-auto px-5 sm:px-7">
        {/* eyebrow */}
        <div className="inline-flex items-center gap-2 frosted-glass rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.18em] mb-5 anim-fade-up">
          <span className="w-1.5 h-1.5 rounded-full bg-aqua-brand inline-block anim-pulse" />
          STEP-BY-STEP · 3 MIN · {slotsLeft} SLOTS LEFT
        </div>

        {/* headline */}
        <h1 className="font-bubble leading-[1] tracking-tight text-[clamp(38px,5.6vw,64px)] mb-4 anim-fade-up delay-1 text-ink">
          RESERVE YOUR <span className="wordmark wordmark--green">SLOT</span>
        </h1>

        <p className="text-[14px] sm:text-[15px] text-neutral-700 leading-relaxed max-w-[560px] mb-10 anim-fade-up delay-2">
          Four short steps. Takes about three minutes. Your camper&apos;s slot is held the moment payment lands. Paystack confirms in seconds.
        </p>

        <RegistrationForm
          pricing={{
            regularPrice: PRICING.regular,
            onlinePrice: PRICING.online,
            onlineEmbeddedPrice: PRICING.onlineEmbedded,
            laptopPrice: PRICING.laptop,
            roboticsPrice: PRICING.robotics,
          }}
          slotsLeft={slotsLeft}
          initialMode={initialMode}
        />
      </div>
    </section>
  );
}
