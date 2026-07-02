/**
 * DEV-ONLY auth bypass — lets you preview the gated portals (/admin, /account,
 * /teacher) without logging in, e.g. via the /test passageway.
 *
 * Active ONLY when the AUTH_BYPASS environment variable is exactly "1".
 * Turn it on locally by adding this line to .env.local, then restart `npm run dev`:
 *
 *     AUTH_BYPASS=1
 *
 * ⚠️  NEVER set AUTH_BYPASS in a real production deployment. While on, it disables
 * every portal login gate and runs with the synthetic preview identities below.
 * Leave it unset (or "0") on Vercel/production. Delete this file when you no
 * longer need the preview shortcut.
 */
export const AUTH_BYPASS = process.env.AUTH_BYPASS === "1";

// `sub` must be a valid 24-char hex ObjectId — some routes build
// `new Types.ObjectId(session.sub)` (e.g. settings save stores updatedBy), which
// throws on a non-hex string.
export const DEV_ADMIN = {
  sub: "000000000000000000000a11",
  email: "dev-admin@immersia.test",
  name: "Dev Admin (preview)",
};

export const DEV_PARENT = {
  sub: "000000000000000000000a22",
  email: "dev-parent@immersia.test",
  name: "Dev Parent (preview)",
};

export const DEV_TEACHER = {
  sub: "000000000000000000000a33",
  email: "dev-teacher@immersia.test",
  name: "Dev Teacher (preview)",
};
