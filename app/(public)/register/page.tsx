import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { getSetting, SETTING_KEYS } from "@/models/Setting";
import { redirect } from "next/navigation";
import { PRICING, EARLY_BIRD_CUTOFF_DEFAULT, isEarlyBird as isEarlyBirdNow, nairaFromKobo } from "@/lib/pricing";
import RegistrationForm from "./RegistrationForm";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  // Reflect the price a visitor actually pays right now (early-bird vs regular).
  let cutoff = EARLY_BIRD_CUTOFF_DEFAULT;
  try {
    await connectDB();
    cutoff = await getSetting<string>(SETTING_KEYS.EARLY_BIRD_CUTOFF, EARLY_BIRD_CUTOFF_DEFAULT);
  } catch {
    /* fall back to the default cutoff */
  }
  const price = isEarlyBirdNow(cutoff) ? PRICING.earlyBird : PRICING.regular;
  return {
    title: "Register · Reserve your camper's slot",
    description: `Secure a place at the IMMERSIA AI & XR Summer Tech Bootcamp 2026. Four short steps, about three minutes. Boot camp fee ${nairaFromKobo(price)}.`,
    alternates: { canonical: "/register" },
  };
}

async function getRegisterData() {
  // Prices come from lib/pricing.ts (env-configurable). Capacity + cutoff are admin-editable
  // via DB Settings, falling back to the single shared defaults.
  try {
    await connectDB();
    const [capacity, paid, earlyBirdCutoff] = await Promise.all([
      getSetting<number>(SETTING_KEYS.CAPACITY, 50),
      Registration.countDocuments({ paymentStatus: "paid" }),
      getSetting<string>(SETTING_KEYS.EARLY_BIRD_CUTOFF, EARLY_BIRD_CUTOFF_DEFAULT),
    ]);
    return { capacity, paid, earlyBirdCutoff };
  } catch {
    return { capacity: 50, paid: 0, earlyBirdCutoff: EARLY_BIRD_CUTOFF_DEFAULT };
  }
}

export default async function RegisterPage() {
  const { capacity, paid, earlyBirdCutoff } = await getRegisterData();

  if (paid >= capacity) {
    redirect("/register/closed");
  }

  const isEarlyBird = isEarlyBirdNow(earlyBirdCutoff);
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
            isEarlyBird,
            earlyBirdPrice: PRICING.earlyBird,
            regularPrice: PRICING.regular,
            laptopPrice: PRICING.laptop,
            roboticsPrice: PRICING.robotics,
          }}
          slotsLeft={slotsLeft}
        />
      </div>
    </section>
  );
}
