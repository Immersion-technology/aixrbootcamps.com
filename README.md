# IMMERSIA Summer Tech Boot Camp — Registration Platform

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
  (public)/                       public routes — landing, register, faq, contact
    page.tsx                      landing (SOFT HARP-styled)
    register/                     multi-step form + Paystack flow
      page.tsx
      RegistrationForm.tsx
      success/                    Paystack callback lands here
      failed/                     retry page
      closed/                     waitlist when sold out
  admin/                          JWT-protected admin dashboard
    page.tsx                      stats + recent activity
    registrations/                list + detail + admit/reject
    settings/                     edit pricing, cutoff date, capacity
    export/                       CSV download
    waitlist/                     waitlist viewer
  api/
    public/                       config, courses, registrations, paystack webhook, waitlist
    admin/                        auth, stats, registrations CRUD, settings, export
lib/
  db.ts, auth.ts, paystack.ts, mailer.ts, pdf.ts, utils.ts, validations.ts
models/
  Admin, Registration, Payment, Course, Setting, Waitlist, Counter
middleware.ts                     gates /admin and /api/admin
scripts/seed.ts                   one-shot DB seeder
```

## Money

All amounts are stored as **kobo** (₦1 = 100 kobo) and rendered with `formatNaira()` from `lib/utils.ts`. Paystack speaks kobo natively.

## Paystack flow

1. User completes the multi-step form → POST `/api/public/registrations`.
2. We create a `Registration` with `paymentStatus: "pending"` and call Paystack `transaction/initialize`.
3. User is redirected to Paystack-hosted checkout; on completion → `/register/success?reference=...`.
4. Paystack also fires a webhook → `/api/public/paystack/webhook` (signature-verified, idempotent). This is the authoritative confirmation.
5. Webhook updates payment status, writes a `Payment` doc, sends confirmation email (PDF receipt attached) + admin alert.

## Email deliverability

Set up SPF, DKIM, and DMARC on the `immersia.ng` domain before launch. Without these, confirmation emails will land in Gmail's spam folder for most parents. The SMTP provider's docs (Brevo, ZeptoMail, etc.) give the exact DNS records to add.

## Admin auth

Email + password (bcrypt hashed). JWT in an httpOnly + secure + sameSite=strict cookie. `middleware.ts` gates everything under `/admin` and `/api/admin` (except the login endpoint).

To create more admins, seed them manually with a script — there is no public signup.

## Deploy

- **Frontend + API**: Vercel (Hobby tier is free).
- **Database**: MongoDB Atlas M0 (free tier).
- Set every variable from `.env.example` in Vercel's project settings (use the live Paystack keys in production).
- Point the `immersia.ng` DNS at Vercel.
- Verify the webhook URL `https://immersia.ng/api/public/paystack/webhook` is registered in the Paystack dashboard.

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
