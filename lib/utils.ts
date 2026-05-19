import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a kobo amount as a Naira string (₦8,000). */
export function formatNaira(kobo: number): string {
  const naira = Math.round(kobo) / 100;
  return `₦${naira.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

/**
 * Normalize a Nigerian phone number to +234… form.
 * Strips spaces, dashes, brackets and converts a leading 0 to +234.
 * Returns the input unchanged if it doesn't look Nigerian.
 */
export function normalizePhone(input: string): string {
  if (!input) return "";
  const cleaned = input.replace(/[\s()-]/g, "");
  if (/^\+234\d{10}$/.test(cleaned)) return cleaned;
  if (/^234\d{10}$/.test(cleaned)) return `+${cleaned}`;
  if (/^0\d{10}$/.test(cleaned)) return `+234${cleaned.slice(1)}`;
  return cleaned;
}

/** Format a sequence number into a short, human-readable registration ID. */
export function shortRegistrationId(seq: number): string {
  return `IMM-${String(seq).padStart(4, "0")}`;
}

/** Pull the best-available client IP out of request headers. */
export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/**
 * Tiny in-memory rate limiter.
 * Returns true while the caller is under the limit, false once they exceed it.
 * Process-local — fine for a single-instance deploy; swap for Redis-backed
 * limiting if/when this scales horizontally.
 */
const RATE_BUCKETS = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = RATE_BUCKETS.get(key);
  if (!bucket || bucket.resetAt < now) {
    RATE_BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

/** Compute age in years from an ISO date-of-birth string. */
export function calcAge(dateOfBirth: string | Date): number {
  const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  if (isNaN(dob.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}
