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
