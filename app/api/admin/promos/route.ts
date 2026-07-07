import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PromoCode } from "@/models/PromoCode";
import { getAdminFromCookie } from "@/lib/auth";
import { promoCreateSchema } from "@/lib/validations";
import { normalizeCode } from "@/lib/promo";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const promos = await PromoCode.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ promos });
}

export async function POST(req: Request) {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = promoCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  try {
    await connectDB();
    const code = normalizeCode(parsed.data.code);
    const existing = await PromoCode.findOne({ code }).lean();
    if (existing) {
      return NextResponse.json({ error: "A code with that name already exists." }, { status: 409 });
    }

    const promo = await PromoCode.create({
      ...parsed.data,
      code,
      createdBy: admin.email,
    });
    return NextResponse.json({ ok: true, id: String(promo._id) });
  } catch (e) {
    console.error("[promo-create]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
