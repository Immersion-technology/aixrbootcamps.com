# IMMERSIA Admin Manual

A plain-English guide to running the AI &amp; XR Summer Tech Bootcamp admin dashboard.
Everything an organiser needs — logging in, managing registrations, running promo codes,
changing prices, adding facilitators, and exporting data.

---

## 1. Logging in

**Web address:** `https://www.aixrbootcamp.com/admin/login`

1. Go to that link in any browser (works on phone or laptop).
2. Enter your **email** and **password**.
   - Email: `admin@immersia.ng` (or whichever admin email was set up for you).
   - Password: the one chosen when the site was set up.
3. Tap **Sign in**. You land on the Dashboard.

**Good to know**
- A login lasts **12 hours**, then you'll be asked to sign in again.
- Sign out any time from the **"Sign out →"** link at the bottom of the left sidebar.
- There is **no public sign-up** and **no "forgot password" link** — admin accounts are created
  by the developer. To change your password or add another admin, ask your developer (it's a
  one-line change on their side).
- Keep the login private. Anyone with it can see every camper's contact and medical details.

---

## 2. The sidebar (your menu)

Once in, everything is reachable from the left sidebar:

| Menu item | What it's for |
|---|---|
| **Dashboard** | Snapshot: total sign-ups, paid count, slots left, revenue. |
| **Analytics** | Website traffic — visits, popular pages, 14-day trend. |
| **Registrations** | Every sign-up. View details, admit/reject, record offline payments. |
| **Attendance** | Daily attendance per camper (also used by facilitators). |
| **Teachers** | Add facilitators, assign courses, send them login links. |
| **Promos** | Create and manage discount codes. |
| **Waitlist** | People who signed up after the camp filled. |
| **Settings** | Cohort dates, capacity, alert email. |
| **Export** | Download all registrations as a spreadsheet (CSV). |

---

## 3. Dashboard

The first screen shows, at a glance:
- **Total registrations** and **paid** vs **capacity**.
- **Slots remaining**.
- **Revenue collected** (sum of all paid registrations).
- The **most recent registrations**.

Use it as your daily pulse-check.

---

## 4. Registrations (the core of your day)

**Registrations** lists every sign-up, newest first. Click any row to open the full detail page.

On a registration's detail page you can:
- See the **camper**, **parent/guardian**, **emergency contact**, **medical notes**, **courses**,
  and the full **pricing breakdown** (including any promo discount used).
- **Admit** or **reject** the camper (admission is automatic once they pay; this is a manual override).
- **Record an offline / bank-transfer payment** — use this when a parent pays outside Paystack
  (bank transfer, cash). It marks the registration paid and admits the camper.
- **Resend the confirmation email** (with the PDF receipt) if a parent lost it.

**Payment status meanings**
- **pending** — they started but haven't paid yet.
- **paid** — money confirmed (by Paystack, or an offline payment you recorded).
- **failed / abandoned** — payment didn't complete.

> Payments confirm automatically. When a parent pays on Paystack, the system verifies the amount
> with Paystack directly, marks them paid, admits the camper, creates their parent portal account,
> and emails a receipt — no action needed from you.

---

## 5. Promo codes

Open **Promos** to run discounts (early-bird pushes, referral codes, partner deals, etc.).

### Create a code
Fill the "Create a promo code" form:
- **Code** — what parents type at checkout, e.g. `EARLYBIRD20` (letters/numbers, shown in CAPITALS).
- **Discount type**
  - **Percentage (%)** — e.g. `20` = 20% off the order.
  - **Fixed amount (₦)** — e.g. `10000` = ₦10,000 off. (Enter naira; the system stores it correctly.)
- **Max uses** — how many times it can be used in total. Leave blank for unlimited.
- **Minimum order (₦)** — optional; the code only works if the order is at least this much.
- **Expires** — optional date/time after which it stops working.
- **Description** — a private note for you (parents don't see it).

Click **Create code**.

### Manage codes
The table shows every code with its discount, **uses (used / max)**, expiry, and status.
- **Pause** — temporarily switch a code off (keeps it for later).
- **Activate** — switch a paused code back on.
- **Delete** — remove it permanently.

### How discounts behave (important)
- The discount is checked and applied **on our server**, so a parent can't fake a bigger discount.
- A code **can never make a registration free** — a small balance (at least ₦100) is always payable.
  For a full scholarship/comp, use the **offline payment** option on the registration instead
  (mark them paid for ₦0 manually).
- A code's **"used" count only goes up when a registration is actually paid** — unpaid attempts
  don't burn a use.
- The discount shows on the parent's receipt and email, and on the registration detail in admin.

---

## 6. Prices &amp; the early-bird deadline

### Prices
Boot-camp prices (regular fee, early-bird fee, laptop rental, robotics elective, instalment deposit)
are set by the **developer through the site's configuration**, not in this dashboard. This keeps one
single source of truth for what parents are shown and charged. To change a price, ask your developer —
it's a quick config change + redeploy, and it updates **everywhere** on the site at once.

> For running **limited-time discounts yourself**, use **Promo codes** (Section 5) — no developer needed.

### Early-bird
Early-bird is controlled by a **cutoff date**:
- Before the cutoff → parents see the **early-bird price** and a promo banner.
- On/after the cutoff → the banner disappears and everyone sees the **regular price**.

You can move the cutoff under **Settings → Cohort dates → Early-bird cutoff**.
- Set a **future** date to run/extend early-bird.
- Set a **past** date to end early-bird immediately (regular pricing everywhere).

---

## 7. Settings

**Settings** holds the operational knobs:
- **Early-bird cutoff** (see above).
- **Camp start / end dates.**
- **Total slot capacity** — once paid registrations reach this, the site shows "camp full" and
  sends new sign-ups to the waitlist.
- **Admin alert email** — where "new paid registration" notifications go.

Each field **saves automatically** when you click out of it (you'll see a small "Saved" toast).

---

## 8. Teachers (facilitators)

Open **Teachers** to manage your teaching team:
- **Add a facilitator** with their name and email; optionally assign the courses they teach.
- They receive a **one-time login link** by email to their own facilitator portal, where they mark
  daily attendance and see camper safety details. No password for them to remember.
- You can deactivate a facilitator at any time.

---

## 9. Attendance

**Attendance** shows the daily roster. Facilitators usually mark this from their own portal, but
you can view and adjust it here.

---

## 10. Waitlist

If the camp fills (paid registrations reach capacity), new sign-ups are added to the **Waitlist**
instead of paying. This screen lists them with contact details so you can reach out if a slot opens.

---

## 11. Analytics

**Analytics** is your website traffic dashboard:
- Total page views and unique visitors (all-time, last 7 days, today).
- A 14-day trend showing views vs. unique visitors.
- Your most-visited pages.
- Breakdowns by device, browser, country, and traffic source (last 7 days).
- A recent-visitors table: entry page, approximate location, device, masked IP, pages viewed, and last-seen time.

Visitors are identified by an anonymous cookie set on their device — not by name, email, or account.
This lets you see repeat vs. new visitors and how many pages someone looked at in one visit, without
tying traffic data to a real identity. IP addresses are shown partially masked and are only used for
abuse detection and rough geography, matching what's described in the site's Privacy Policy.

Useful for seeing whether a campaign or post drove traffic, and whether visitors are exploring the
site or bouncing after one page.

---

## 12. Export

**Export** downloads **every registration as a CSV spreadsheet** (opens in Excel / Google Sheets),
including camper and parent details, courses, **promo code and discount used**, amount paid, and
status. You can filter (e.g. only paid) before exporting. Great for check-in lists and record-keeping.

---

## 13. Emails the system sends automatically

You don't send these by hand — they fire on their own:
- **Payment confirmation** to the parent (with a PDF receipt) the moment payment is verified.
- **New paid registration alert** to your admin alert email.
- **Facilitator welcome / login link** when you add a teacher.
- **Waitlist confirmation** when someone joins the waitlist.
- **Parent portal login links** (passwordless) when a parent signs in to track their camper.

---

## 14. Quick troubleshooting

| Situation | What to do |
|---|---|
| A parent paid but isn't showing as paid | Open their registration — the system re-checks Paystack automatically. If it was a bank transfer, record it via **offline payment**. |
| Parent lost their receipt | Open their registration → **Resend email**. |
| A promo code "isn't working" | Check it's **Active**, not **expired**, hasn't hit its **max uses**, and the order meets any **minimum**. |
| Need to give a full scholarship | Create the registration, then mark it paid via **offline payment** for ₦0 (don't use a 100% promo — codes never fully zero an order). |
| Price is wrong on the site | Prices are set in config by the developer — send them the correct amounts. |
| Camp shows "full" too early | Check **Settings → Total slot capacity**. |
| Can't log in | Sessions expire after 12h — just sign in again. Forgot the password? Ask your developer (there's no self-serve reset). |

---

*Questions this manual doesn't answer? Contact your developer. Keep this document with your team's
handover notes.*
