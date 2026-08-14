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

Open **Promos** to run discounts (referral codes, partner deals, limited-time pushes, etc.).

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

## 6. Prices

Boot-camp prices (regular fee, laptop rental, robotics elective, instalment deposit)
are set by the **developer through the site's configuration**, not in this dashboard. This keeps one
single source of truth for what parents are shown and charged. To change a price, ask your developer —
it's a quick config change + redeploy, and it updates **everywhere** on the site at once.

> For running **limited-time discounts yourself**, use **Promo codes** (Section 5) — no developer needed.

---

## 7. Settings

**Settings** holds the operational knobs:
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

These are separate from the campaigns you write yourself (next section), and they are **never**
blocked by an unsubscribe — a parent who opts out of camp updates still gets their receipt and
login links.

---

## 14. Emails you send yourself (Campaigns)

**Emails** in the sidebar is where you write to a group: "camp starts Monday", "a slot has opened",
a facilitator briefing.

### Writing one

1. **Emails → + New campaign.** Give it a name only you see, and optionally start from a template.
2. Fill in the **subject line** and the **preview text** (the grey line Gmail shows next to the subject).
3. Build the body from **blocks** — heading, paragraph, button, image, list, callout, divider. Add,
   reorder and delete them freely; the preview on the right updates as you type.
4. In any text you can use:
   - `**bold**`, `*italic*`, and `[link text](https://example.com)`
   - **Personalisation fields** like `{{firstName}}` or `{{cohortLabel}}` — click *Show all* in the
     Personalisation panel to see every option. Each parent sees their own details.
5. Your work **saves automatically** — the top-right corner tells you when.

### Choosing who gets it

Pick an **Audience**: paid campers, people who started but never paid, the waitlist, parent portal
accounts, facilitators, or a custom list of addresses you paste in. For camper audiences you can
narrow by cohort, in-person/online, or course.

The big number under the audience is **how many people will actually receive it** — anyone who has
unsubscribed is already excluded.

### Before you send

- **Send a test to myself** — delivers one copy to your own inbox with sample details. Always do this.
- Check the preview on both **Desktop** and **Mobile**.
- Then **Review & send**. You'll be asked to type the recipient count to confirm. That's deliberate:
  it's the last chance to catch the right email going to the wrong group.
- You can **schedule** it for a later date and time instead of sending now.

### While it sends

You'll see a live progress bar with delivered / remaining / failed counts. You can **Pause**,
**Resume** or **Cancel** at any point. Closing the tab is fine — sending continues, and the system
picks up anything outstanding on its own.

> **Daily limit.** The system sends at most **300 campaign emails per day**. This is not a bug — our
> mail provider allows a limited number of emails per day in total, and the cap protects the ones that
> really matter (payment receipts, login links) from being blocked. If a campaign hits the limit, it
> pauses and tells you, then finishes automatically the next day.
>
> **Planning a bigger send?** Talk to your developer first about moving to a proper bulk-email
> provider. Sending thousands from the current setup risks the mailbox being suspended.

### Templates

Save an email you send every cohort as a **template**, then start future campaigns from it instead of
rewriting. Editing a template never changes a campaign that has already gone out.

### Unsubscribed

Every campaign carries an unsubscribe link (required by Gmail and Yahoo — we can't remove it). Anyone
who uses it lands on the **Unsubscribed** tab and is skipped by every future campaign, automatically.

- Addresses also land here when a mailbox **bounces** (doesn't exist). Leaving them there protects
  delivery for everyone else.
- You can add an address by hand — useful when a parent asks you to stop over the phone.
- **Removing** someone means they'll be emailed again. Only do that if they asked to be added back.

---

## 15. Quick troubleshooting

| Situation | What to do |
|---|---|
| A parent paid but isn't showing as paid | Open their registration — the system re-checks Paystack automatically. If it was a bank transfer, record it via **offline payment**. |
| Parent lost their receipt | Open their registration → **Resend email**. |
| A promo code "isn't working" | Check it's **Active**, not **expired**, hasn't hit its **max uses**, and the order meets any **minimum**. |
| Need to give a full scholarship | Create the registration, then mark it paid via **offline payment** for ₦0 (don't use a 100% promo — codes never fully zero an order). |
| Price is wrong on the site | Prices are set in config by the developer — send them the correct amounts. |
| Camp shows "full" too early | Check **Settings → Total slot capacity**. |
| Can't log in | Sessions expire after 12h — just sign in again. Forgot the password? Ask your developer (there's no self-serve reset). |
| A campaign is stuck at "sending" | Check the banner — it's almost always the **daily limit**. It resumes by itself the next day. |
| A parent says they didn't get a campaign | Open their registration → **Campaign emails** shows exactly what was sent and any failure reason. Also check the **Unsubscribed** tab. |
| A campaign shows failures | Open it and expand the failures list. "Mailbox doesn't exist" means the address is wrong — those are auto-suppressed so they won't be retried. |
| I need to fix a typo in a sent campaign | You can't edit a sent email — it's already in people's inboxes. Duplicate it, fix it, and send a short correction if it matters. |

---

*Questions this manual doesn't answer? Contact your developer. Keep this document with your team's
handover notes.*
