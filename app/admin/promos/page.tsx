import { connectDB } from "@/lib/db";
import { PromoCode } from "@/models/PromoCode";
import PromoManager, { type PromoRow } from "./PromoManager";

export const dynamic = "force-dynamic";

export default async function PromosPage() {
  await connectDB();
  const docs = await PromoCode.find().sort({ createdAt: -1 }).lean();

  const promos: PromoRow[] = docs.map((p) => ({
    id: String(p._id),
    code: p.code,
    description: p.description ?? "",
    discountType: p.discountType,
    discountValue: p.discountValue,
    maxUses: p.maxUses ?? null,
    usedCount: p.usedCount ?? 0,
    minSubtotalKobo: p.minSubtotalKobo ?? null,
    active: p.active,
    expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString() : null,
  }));

  return (
    <div className="p-6 sm:p-10 lg:p-12 max-w-4xl">
      <div className="mb-9">
        <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-1.5">Promotions</div>
        <h1 className="font-display font-extrabold uppercase text-[clamp(28px,3.4vw,40px)] leading-[.95] tracking-tight">
          Promo codes
        </h1>
        <p className="text-[13.5px] text-neutral-600 mt-3 max-w-[540px]">
          Create discount codes campers apply at checkout — a percentage or a fixed amount off,
          with an optional expiry and usage cap. Discounts always leave a payable balance; a code
          can never make a registration free (use a manual payment for full comps).
        </p>
      </div>

      <PromoManager initial={promos} />
    </div>
  );
}
