# IMMERSIA Summer Tech Boot Camp · Registration Platform

Next.js 14 (App Router) · TypeScript · Tailwind · MongoDB (Mongoose) · Monnify · SMTP (Nodemailer) · JWT auth · PDF receipts.

## Setup

```bash
npm install
cp .env.example .env.local        # fill in MONGODB_URI, JWT_SECRET, Monnify, SMTP
npm run seed                      # creates admin + 10 courses + default settings
npm run dev                       # http://localhost:3000
```

Default admin login (override in `.env.local`):
- email: `admin@immersia.ng`
- password: `change-on-first-login`

## Project layout

```
app/
  (public)/                       public routes: landing, register, faq, contact
    page.tsx                      landing (SOFT HARP-styled)
    register/                     multi-step form + Monnify flow
      page.tsx
      RegistrationForm.tsx
      success/                    Monnify callback lands here
      failed/                     retry page
      closed/                     waitlist when sold out
  admin/                          JWT-protected admin dashboard
    page.tsx                      stats + recent activity
    registrations/                list + detail + admit/reject
    settings/                     edit pricing, cutoff date, capacity
    export/                       CSV download
    waitlist/                     waitlist viewer
  api/
    public/                       config, courses, registrations, monnify webhook, waitlist
    admin/                        auth, stats, registrations CRUD, settings, export
lib/
  db.ts, auth.ts, monnify.ts, mailer.ts, pdf.ts, utils.ts, validations.ts
models/
  Admin, Registration, Payment, Course, Setting, Waitlist, Counter
middleware.ts                     gates /admin and /api/admin
scripts/seed.ts                   one-shot DB seeder
```

## Money

All amounts are stored as **kobo** (₦1 = 100 kobo) and rendered with `formatNaira()` from `lib/utils.ts`. Monnify works in **naira**, so the registration route converts (`amountNaira = total / 100`) when initializing a transaction, and the webhook converts back (`amountPaid * 100`) when reconciling.

## Monnify flow

1. User completes the multi-step form → POST `/api/public/registrations`.
2. We create a `Registration` with `paymentStatus: "pending"`, generate our own `paymentReference`, and call Monnify `init-transaction` (after minting a bearer token from `/auth/login`).
3. User is redirected to the Monnify-hosted `checkoutUrl`; on completion → `/register/success?paymentReference=...&transactionReference=...`.
4. Monnify fires a `SUCCESSFUL_TRANSACTION` webhook → `/api/public/monnify/webhook`. The handler verifies the `monnify-signature` (HMAC-SHA512 of the raw body), is idempotent, and **reconciles against Monnify's status API** (amount/currency/status) before trusting the event. This is the authoritative confirmation.
5. Webhook updates payment status, writes a `Payment` doc (storing Monnify's `transactionReference` for refunds/audit), sends confirmation email (PDF receipt attached) + admin alert.

## Email deliverability

Set up SPF, DKIM, and DMARC on the `immersia.ng` domain before launch. Without these, confirmation emails will land in Gmail's spam folder for most parents. The SMTP provider's docs (Brevo, ZeptoMail, etc.) give the exact DNS records to add.

## Admin auth

Email + password (bcrypt hashed). JWT in an httpOnly + secure + sameSite=strict cookie. `middleware.ts` gates everything under `/admin` and `/api/admin` (except the login endpoint).

To create more admins, seed them manually with a script; there is no public signup.

## Deploy

- **Frontend + API**: Vercel (Hobby tier is free).
- **Database**: MongoDB Atlas M0 (free tier).
- Set every variable from `.env.example` in Vercel's project settings (use the live Monnify keys and `MONNIFY_BASE_URL=https://api.monnify.com` in production).
- Point the `immersia.ng` DNS at Vercel.
- Verify the webhook URL `https://immersia.ng/api/public/monnify/webhook` is registered in the Monnify dashboard.

## Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | Lint |
| `npm run seed` | One-time seed: admin, courses, settings |

## What's out of scope (per spec)

No participant logins, facilitator portal, assignment submission, grading, attendance, certificates, or in-app messaging. Communication happens via email and WhatsApp. The admin dashboard is the single source of truth.
