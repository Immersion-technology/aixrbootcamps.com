import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { getSetting, SETTING_KEYS } from "@/models/Setting";
import { redirect } from "next/navigation";
import RegistrationForm from "./RegistrationForm";

export const dynamic = "force-dynamic";

const FALLBACK = {
  capacity: 50,
  paid: 0,
  earlyBirdCutoff: "2026-06-30T23:59:59.000Z",
  earlyBirdPrice: 15000000,  // ₦150,000 — first 10
  regularPrice: 20000000,    // ₦200,000
  laptopPrice: 2000000,      // +₦20,000
};

async function getRegisterData() {
  try {
    await connectDB();
    const [capacity, paid, earlyBirdCutoff] =
      await Promise.all([
        getSetting<number>(SETTING_KEYS.CAPACITY, 50),
        Registration.countDocuments({ paymentStatus: "paid" }),
        getSetting<string>(SETTING_KEYS.EARLY_BIRD_CUTOFF, FALLBACK.earlyBirdCutoff),
      ]);
    // Force the new two-tier pricing here (₦100k early-bird / ₦150k regular) until
    // the DB settings are updated. The DB Setting fields are intentionally ignored.
    return {
      capacity,
      paid,
      earlyBirdCutoff,
      earlyBirdPrice: FALLBACK.earlyBirdPrice,
      regularPrice: FALLBACK.regularPrice,
      laptopPrice: FALLBACK.laptopPrice,
    };
  } catch {
    return FALLBACK;
  }
}

export default async function RegisterPage() {
  const { capacity, paid, earlyBirdCutoff, earlyBirdPrice, regularPrice, laptopPrice } =
    await getRegisterData();

  if (paid >= capacity) {
    redirect("/register/closed");
  }

  const isEarlyBird = new Date() < new Date(earlyBirdCutoff);
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
          Four short steps. Takes about three minutes. Your camper&apos;s slot is held the moment payment lands — Paystack confirms in seconds.
        </p>

        <RegistrationForm
          pricing={{
            isEarlyBird,
            earlyBirdPrice,
            regularPrice,
            laptopPrice,
          }}
          slotsLeft={slotsLeft}
        />
      </div>
    </section>
  );
}
