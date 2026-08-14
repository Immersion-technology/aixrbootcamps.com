# IMMERSIA Summer Tech Boot Camp · Registration Platform

Next.js 14 (App Router) · TypeScript · Tailwind · MongoDB (Mongoose) · Paystack · SMTP (Nodemailer) · JWT auth · PDF receipts.

## Setup

```bash
npm install
cp .env.example .env.local        # fill in MONGODB_URI, JWT_SECRET, Paystack, SMTP
npm run seed                      # creates admin + 10 courses + default settings
npm run dev                       # http://localhost:3000
```

Default admin login (override in `.env.local`):
- email: `admin@immersia.ng`
- password: `change-on-first-login`

## Project layout

```
app/
  (public)/                       public routes: landing, register, courses, teachers, faq, contact
    page.tsx                      landing (hero, programmes, courses, timetable, FAQ)
    register/                     multi-step form + promo codes + Paystack flow
      page.tsx
      RegistrationForm.tsx
      success/                    Paystack callback lands here
      failed/                     retry page
      closed/                     waitlist when sold out
  (account)/                      parent portal (passwordless magic-link login)
  (teacher)/                      facilitator portal (roster + attendance)
  admin/                          JWT-protected admin dashboard
    page.tsx                      stats + recent activity
    analytics/                    traffic dashboard
    registrations/                list + detail + admit/reject
    attendance/                   daily attendance
    teachers/                     facilitator manager
    promos/                       promo-code manager (create / pause / delete)
    settings/                     cohort dates, capacity, alert email (prices are via env)
    export/                       CSV download
    waitlist/                     waitlist viewer
  api/
    public/                       config, courses, registrations, promo/validate, paystack webhook, waitlist
    admin/                        auth, stats, registrations CRUD, settings, promos, teachers, export
lib/
  db, auth, pricing, promo, paystack, confirm-payment, mailer, pdf, utils, validations, curriculum, site
models/
  Admin, Registration, Payment, PromoCode, Course, Setting, Waitlist, Counter,
  Teacher, Attendance, ParentAccount, LoginToken, PageView
middleware.ts                     gates /admin and /api/admin
scripts/seed.ts                   one-shot DB seeder
```

## Money

All amounts are stored as **kobo** (₦1 = 100 kobo) and rendered with `formatNaira()` from `lib/utils.ts`. Paystack also works in **kobo**, so no conversion is needed: the registration route passes `amountKobo = total` directly, and the webhook compares Paystack's `amount` to `pricing.total` kobo-for-kobo.

Any promo discount is baked into `pricing.total` **server-side before** both `Registration.create` and Paystack init, so `pricing.total` always equals what Paystack charges (the confirm step rejects any mismatch as `amount_mismatch`).

## Pricing & promo codes

**Prices are configured via environment variables** — the single source of truth is `lib/pricing.ts`, which reads `PRICE_REGULAR_KOBO`, `PRICE_LAPTOP_RENTAL_KOBO`, `PRICE_ROBOTICS_ELECTIVE_KOBO` (all kobo), each with a sensible default. Every price shown or charged flows from here — the register page, homepage, public config API and the charge route. To change a price, set the env var and redeploy. (The admin Settings page no longer edits prices; it manages cohort dates, capacity and the alert email.)

**Promo codes** are managed in the admin panel at `/admin/promos`: create percentage or fixed-amount codes with an optional expiry and usage cap. A camper enters a code at checkout; it's previewed via `POST /api/public/promo/validate` and **re-validated + applied authoritatively** in the charge route (`lib/promo.ts` + `applyPromo` in `lib/pricing.ts`). Discounts always leave a payable balance (`MIN_PAYABLE_KOBO`) — a code can never zero an order; use an admin manual payment for full comps. A code's `usedCount` is incremented once per **paid** registration in `reconcileAndConfirm`.

## Paystack flow

1. User completes the multi-step form → POST `/api/public/registrations`.
2. We create a `Registration` with `paymentStatus: "pending"`, generate our own `paymentReference`, and call Paystack `/transaction/initialize` (passing our `paymentReference` as the Paystack `reference`).
3. User is redirected to the Paystack-hosted `authorization_url`; on completion → `/register/success?reference=...&trxref=...`.
4. Confirmation runs through one shared, idempotent path (`lib/confirm-payment.ts → reconcileAndConfirm`) that always **re-queries Paystack's `/transaction/verify` endpoint** (amount/currency/status) before trusting anything. It is triggered by **two** independent layers:
   - **Webhook** → `/api/public/paystack/webhook`: verifies the `x-paystack-signature` (HMAC-SHA512 of the raw body) and acts on `charge.success`.
   - **Success-page redirect**: the `/register/success` server component verifies the reference the instant the camper returns, so payment is confirmed even if the webhook is delayed.
5. Confirmation updates payment status, writes a `Payment` doc (storing Paystack's `reference` for refunds/audit), provisions the parent portal account, and sends the confirmation email (PDF receipt attached) + admin alert.

## Email campaigns (`/admin/email`)

Admins compose broadcasts from content **blocks** (heading, paragraph, button, image, list, callout,
divider), pick an **audience**, preview, test-send, then send or schedule. Everything lives under
`lib/email/`:

| File | Role |
| --- | --- |
| `shell.ts` | The one branded email wrapper — shared with `lib/mailer.ts` so the two can't drift |
| `blocks.ts` | Block schemas + the renderer. Author text is escaped, then a tiny inline grammar (`**bold**`, `*italic*`, `[label](url)`) is re-introduced — **XSS-proof by construction, no sanitizer** |
| `merge.ts` | `{{firstName}}`-style fields. Values are escaped and substituted *after* the markup pass, so a camper's name can never become markup or a link |
| `segments.ts` | Audience queries over existing collections, **deduped by email** (a parent with two campers gets one email, `{{childNames}}` covers both) |
| `transport.ts` | Delivery seam: `smtp` (default) or `console` (dry run). Also classifies failures transient vs permanent |
| `queue.ts` | The outbox worker — claim, throttle, retry, daily cap, finalise |
| `unsubscribe.ts` | Stateless HMAC tokens for RFC 8058 one-click unsubscribe |

**The rule that matters most:** campaigns always respect the suppression list; transactional mail
never does. A parent who unsubscribes from camp updates still gets their receipt and login links —
those are contractual, not marketing, so `lib/mailer.ts` has no knowledge of suppressions by design.

### How sending works

A campaign's recipients are materialised into an `EmailMessage` outbox (one row per recipient), then
drained in small batches. This shape exists because Vercel functions are short-lived and Gmail
throttles:

- **One worker per message.** A single atomic `findOneAndUpdate` flips `queued → sending` and stamps
  a lease, so overlapping drains share work instead of double-sending. An expired lease is reclaimed
  by the same query, so a worker dying mid-send is self-healing.
- **Idempotent enqueue** via a unique `(campaignId, email)` index — a double-clicked Send can't
  duplicate the list.
- **Retries**: transient failures back off exponentially (3 attempts); permanent ones stop, and
  "no such mailbox" bounces auto-suppress.
- **Immutable once sent** — content is frozen when a campaign leaves draft. Duplicate it to re-send.
- **Driven by** the composer (loops the drain while you watch), with `/api/cron/email-drain` as a
  daily backstop for scheduled sends and anything the cap paused.

### Sending limits — read this before your first broadcast

`SMTP_FROM` is currently a **@gmail.com address on Gmail SMTP**. That means a hard ceiling of ~500
recipients/day, no DMARC alignment to `immersia.ng`, no bounce or complaint feedback, and a real risk
of the account being throttled or suspended for bulk sending.

`MAIL_DAILY_CAMPAIGN_CAP` (default **300**) enforces the ceiling in code and deliberately reserves
~200 of Gmail's daily allowance for transactional mail. When a campaign hits the cap it pauses and
says so, rather than failing silently, and resumes on the next drain.

**Before broadcasting to more than ~200 people, move to a real ESP** (Resend / Brevo / ZeptoMail) on
the `immersia.ng` domain with SPF, DKIM and DMARC. That's a `MAIL_TRANSPORT` value plus one adapter
in `transport.ts` — the queue, retries, suppression and unsubscribe handling are unchanged. An ESP
also gives you bounce/complaint webhooks; wire those to `suppress()` in `models/EmailSuppression.ts`.

### Compliance

Every campaign carries `List-Unsubscribe` + `List-Unsubscribe-Post` (RFC 8058) and a footer
unsubscribe link the renderer appends — it is not a block an operator can delete. Gmail/Yahoo bulk
rules require one-click unsubscribe and a spam-complaint rate under 0.3%. Unsubscribing is honoured
instantly and needs no login. Open tracking is **off by default**, per-campaign, and disclosed in the
privacy policy.

### Testing without sending

```bash
npm run email:check         # renderer + XSS/URL-safety regression checks (offline)
npm run email:queue-check   # concurrency, idempotency, suppression, cap (forces the console transport)
npm run email:drain         # drain the queue from the CLI
```

Set `MAIL_TRANSPORT=console` in `.env.local` to rehearse a whole campaign against real data — each
email is written to `.mail-outbox/` and nothing is sent.

## Email deliverability

Set up SPF, DKIM, and DMARC on the `immersia.ng` domain before launch. Without these, confirmation emails will land in Gmail's spam folder for most parents. The SMTP provider's docs (Brevo, ZeptoMail, etc.) give the exact DNS records to add.

## SMTP setup

For Nodemailer, I need these values in `.env.local`:

- `SMTP_HOST` - your provider's SMTP host
- `SMTP_PORT` - usually `587` or `465`
- `SMTP_SECURE` - `true` for port `465`, otherwise `false`
- `SMTP_USER` - the full email address that logs into SMTP
- `SMTP_PASS` - the SMTP password or app password
- `SMTP_FROM` - the from name/address parents will see
- `ADMIN_ALERT_EMAIL` - inbox for admin alerts and dashboard feedback

If you're using Gmail, the "16-digit password" is an App Password. You cannot view it again after Google shows it once. Open Google Account > Security > 2-Step Verification > App passwords, then generate a new one if needed.
For Gmail / Google Workspace SMTP, use `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, and set `SMTP_USER` to the mailbox that generated the app password.

## Admin auth

Email + password (bcrypt hashed). JWT in an httpOnly + secure + sameSite=strict cookie. `middleware.ts` gates everything under `/admin` and `/api/admin` (except the login endpoint).

> **Non-technical operator guide:** [`docs/ADMIN_MANUAL.md`](docs/ADMIN_MANUAL.md) — login, registrations, promo codes, settings, exports.

To create more admins, seed them manually with a script; there is no public signup.

## Deploy

- **Frontend + API**: Vercel (Hobby tier is free).
- **Database**: MongoDB Atlas M0 (free tier).
- Set every variable from `.env.example` in Vercel's project settings (use the live `sk_live_…` / `pk_live_…` Paystack keys in production).
- Point the production DNS at Vercel.
- Verify the webhook URL `https://www.aixrbootcamp.com/api/public/paystack/webhook` is registered in the Paystack dashboard (Settings → API Keys & Webhooks).

## Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | Lint |
| `npm run seed` | One-time seed: admin, courses, settings |

## Included

Parent portal (passwordless magic-link login to track a camper), facilitator portal (roster + daily attendance), promo codes, a traffic analytics dashboard, CSV export, and PDF receipts. Parents and facilitators log in via one-time email links; there is no public admin signup.

## Out of scope

Assignment submission, grading, certificates, and in-app messaging. Parent/facilitator comms happen via email and WhatsApp; the admin dashboard remains the operational source of truth.
