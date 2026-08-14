/**
 * Shared plumbing for the campaign API routes — kept in one place so every
 * route enforces the same guards rather than each reimplementing them.
 */
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { getAdminFromCookie, type AdminPayload } from "@/lib/auth";
import { publicBaseUrl } from "./base-url";
import { blocksSchema, validateBlocks, type Blocks } from "./blocks";
import { EDITABLE_STATUSES, type CampaignStatus } from "@/models/Campaign";

export const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
export const notFound = (what = "Not found") => NextResponse.json({ error: what }, { status: 404 });
export const badRequest = (message: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error: message, ...extra }, { status: 400 });
export const conflict = (message: string) => NextResponse.json({ error: message }, { status: 409 });

/** Every admin route starts here. Returns null when the caller isn't an admin. */
export async function requireAdmin(): Promise<AdminPayload | null> {
  return getAdminFromCookie();
}

/**
 * Absolute base URL for links inside emails.
 *
 * NOTE: this resolves the PUBLIC site origin, not the server's own address —
 * see lib/email/base-url.ts for why. Use `sendableBaseUrl()` on paths that
 * actually deliver mail, so a dev/misconfigured origin fails loudly instead of
 * shipping dead unsubscribe links.
 */
export function baseUrlFrom(req: Request): string {
  return publicBaseUrl(new URL(req.url).origin);
}

export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

/** First zod message, matching the error shape the existing admin routes return. */
export function zodMessage(error: z.ZodError): string {
  return error.errors[0]?.message ?? "Invalid request";
}

export interface ParsedBlocks {
  ok: true;
  blocks: Blocks;
}
export interface BlocksError {
  ok: false;
  error: string;
  issues?: Array<{ index: number; message: string }>;
}

/**
 * Parse + semantically validate a block body.
 *
 * Two layers on purpose: zod checks shape, `validateBlocks` checks meaning
 * (unknown merge fields, unsafe links). Both run on save AND again before a
 * send, so a campaign edited by one admin can't be sent by another with a
 * broken link in it.
 */
export function parseBlocksOrError(input: unknown): ParsedBlocks | BlocksError {
  const parsed = blocksSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: zodMessage(parsed.error) };
  }
  const issues = validateBlocks(parsed.data);
  if (issues.length > 0) {
    return { ok: false, error: issues[0].message, issues };
  }
  return { ok: true, blocks: parsed.data };
}

/**
 * A campaign's content is frozen the moment it starts sending. Anything already
 * in an inbox must keep matching what we stored, so edits are refused rather
 * than silently diverging.
 */
export function assertEditable(status: CampaignStatus): NextResponse | null {
  if (EDITABLE_STATUSES.includes(status)) return null;
  return conflict(
    `This campaign is ${status} and can no longer be edited. Duplicate it to make changes.`
  );
}
