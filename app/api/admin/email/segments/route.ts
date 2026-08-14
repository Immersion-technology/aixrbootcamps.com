import { NextResponse } from "next/server";
import { SEGMENTS, resolveSegment, getSegment, describeSegment, type SegmentFilters } from "@/lib/email/segments";
import { suppressedSet } from "@/models/EmailSuppression";
import { COHORTS } from "@/lib/cohorts";
import { CURRICULUM } from "@/lib/curriculum";
import { requireAdmin, unauthorized, badRequest } from "@/lib/email/api-helpers";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Audience picker data + a live recipient count.
 *
 * The count is what the admin approves before sending, and the send route
 * re-checks it, so this must apply exactly the same suppression rules the
 * sender will. It also returns a small sample of addresses — seeing real
 * recipients is the cheapest way to catch "wrong audience" before it's too late.
 */
export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const sp = new URL(req.url).searchParams;
  const source = sp.get("source");

  // No source → just the picker metadata.
  if (!source) {
    return NextResponse.json({
      segments: SEGMENTS.map((s) => ({
        key: s.key,
        label: s.label,
        description: s.description,
        supportsFilters: s.supportsFilters,
      })),
      cohorts: COHORTS.map((c) => ({ id: c.id, label: `${c.label} · ${c.range}` })),
      courses: CURRICULUM.map((c) => c.name),
    });
  }

  if (!getSegment(source)) return badRequest(`Unknown audience "${source}"`);

  const filters: SegmentFilters = {
    cohort: sp.get("cohort") ? Number(sp.get("cohort")) : undefined,
    attendanceMode: sp.get("attendanceMode") ?? undefined,
    course: sp.get("course") ?? undefined,
    emails: sp.get("emails") ?? undefined,
  };

  try {
    const recipients = await resolveSegment(source, filters);
    const blocked = await suppressedSet(recipients.map((r) => r.email));
    const sendable = recipients.filter((r) => !blocked.has(r.email));

    return NextResponse.json({
      label: describeSegment(source, filters),
      /** What will actually be emailed — this is the number to approve. */
      count: sendable.length,
      matched: recipients.length,
      suppressed: recipients.length - sendable.length,
      sample: sendable.slice(0, 10).map((r) => ({ email: r.email, name: r.name })),
    });
  } catch (e) {
    console.error("[segment-preview]", e);
    return NextResponse.json({ error: "Couldn't resolve that audience." }, { status: 500 });
  }
}
