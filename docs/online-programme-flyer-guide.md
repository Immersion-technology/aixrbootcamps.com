# Online Programme — Flyer Guide

A copy-and-layout brief for the **IMMERSIA Online Track** flyer (social + print). Hand this to
a designer, or use it to brief a tool like Canva/Figma. It captures *what to say*, *what not to
say*, and *how it should feel* so the flyer matches the live site and the registration system.

> **Source of truth:** prices live in `lib/pricing.ts` (env-configurable). Always confirm the
> live numbers before printing — see **Numbers to confirm** at the bottom.

---

## 1. The offer in one line

**Join IMMERSIA live online — three real tech courses, from anywhere in Nigeria, for ₦50,000.**

A trimmed, lower-priced version of our in-person Lagos camp: same energy, delivered to your
screen, with a welcome kit shipped to your door.

---

## 2. Headline options (pick one)

- **LEARN TO BUILD. FROM ANYWHERE.** — Online tech camp · ₦50,000
- **BIG TECH SKILLS, SMALL SCREEN.** — Live online · ₦50,000
- **CODE. CREATE. GO 3D. ONLINE.** — ₦50,000 · kit delivered to you

**Sub-headline:** Three live courses over your cohort's two weeks — taught remotely by the same
facilitators, with a welcome kit posted to your address.

---

## 3. What's included (the three courses)

Use these exact names + one-line hooks:

| Course | Hook |
|---|---|
| **Vibe Coding & AI Prompt Engineering** | Pair-program with AI to ship a real, deployed web app — zero prior code needed. |
| **Content Creation** | Shoot, edit and post like a creator — a portfolio of real content by the end. |
| **3D Character Design & VR World Creation** | Model a character and build a walkable 3D/VR world. |

Plus: **a welcome kit** (IMMERSIA t-shirt + course materials) **delivered anywhere in Nigeria**.

---

## 4. What's NOT on the online track (say this clearly — avoid over-promising)

The online track **does not** include, and the flyer must **not** imply, any of:

- ❌ **Demo Day pitch, the live jury, or the prize** — in-person only.
- ❌ **AI Music Production** and **Entrepreneurship & Pitching** — in-person only.
- ❌ **Robotics & Embedded Systems** (the Arduino elective) — in-person only.
- ❌ On-site side attractions (Pro Gaming, Table Tennis, Go-Karting) and laptop rental.

A small honest line works well: *"Demo Day pitch, prize, Robotics, Music & Entrepreneurship are
part of the in-person Lagos camp."*

---

## 5. Price block

> **₦50,000** — full online programme
> **+ flat nationwide delivery** for your welcome kit (shown at checkout)

Notes for the designer:
- Lead with **₦50,000** big and bold (this is the hook vs. the in-person fee).
- Mention delivery as a small, separate add-on so it doesn't muddy the headline price.
- If a promo is running, add a "use code ___ at checkout" strip — codes are managed in admin.

---

## 6. Dates & format

- **Cohorts:** 27 July – 4 September 2026, as three back-to-back 2-week sessions
  (Cohort 1: 27 Jul–7 Aug · Cohort 2: 10–21 Aug · Cohort 3: 24 Aug–4 Sep). Pick one.
- **Live sessions:** Monday–Friday, 9:00 AM – 1:30 PM (WAT), joined remotely.
- **Audience:** young creators (school-age). *(Registration currently accepts all ages — keep the
  age framing consistent with whatever the main site shows when this ships.)*

---

## 7. Call to action

- **Primary CTA:** **Register online →**
- **Link / QR target:** `https://www.aixrbootcamp.com/register?mode=online`
  (the `?mode=online` param preselects the online track — do not drop it).
- Generate a QR code to that exact URL for print/social.
- Secondary contact: WhatsApp / "Talk to a human" → the site's contact page.

---

## 8. Brand direction (match the website)

**Feel:** playful, confident, sticker-poster energy — bold rounded display type, chunky pill
buttons, soft "frosted-glass" cards on a warm paper background, a subtle dot-grid.

**Colours** (from `tailwind.config.ts`):

| Role | Name | Hex |
|---|---|---|
| Background | paper | `#FAF7F2` |
| Text / ink | ink | `#0f0f0f` |
| Primary accent (headers, "online" energy) | aqua-brand | `#3a86ff` |
| CTA / buttons | grass-brand (blaze orange) | `#fb5607` |
| Pop accent | violet-brand | `#8338ec` |
| Fresh accent | jade-brand (emerald) | `#06d6a0` |
| Hot accent (sparingly) | pink-brand | `#ff006e` |

**Type:** a rounded "bubble" display face for the big headline (site uses `--font-bubble`); a
clean sans for body; a techy/monospace-ish face for the price/ID accents (site uses `--font-accent`,
Orbitron-style). Reuse the logo wordmark **IMMERSIA**.

**Accessibility:** never signal meaning with colour alone; keep body text ≥ 14px; maintain strong
contrast on the paper background.

---

## 9. Suggested layout (portrait, e.g. 1080×1350 social / A5 print)

1. **Top:** IMMERSIA wordmark + tiny eyebrow "ONLINE TECH CAMP 2026".
2. **Hero:** the headline (§2) — 2–3 punchy lines, bubble type, one accent-coloured word.
3. **Price sticker:** tilted pill with **₦50,000**, small "+ delivery" beneath.
4. **Three course cards:** stacked or 3-up, each a name + hook (§3), each with its own accent hue.
5. **Kit line:** "📦 Welcome kit delivered to your door."
6. **Honest strip:** the one-line "in-person only" note (§4).
7. **Dates line:** "27 Jul – 4 Sep 2026 · Mon–Fri 9:00–1:30 · pick your 2-week cohort."
8. **CTA block:** big grass-orange pill "Register online →" + QR code to the `?mode=online` link.
9. **Footer:** website, WhatsApp/contact, socials.

---

## 10. Ready-to-paste copy

> **ONLINE TECH CAMP · 2026**
> ## Learn to build. From anywhere.
> Live online with IMMERSIA — three real tech courses over two weeks, taught remotely, with a
> welcome kit shipped to your door.
>
> **₦50,000** · + flat nationwide delivery
>
> • **Vibe Coding & AI Prompt Engineering** — build & deploy a real app with AI
> • **Content Creation** — shoot, edit and post like a creator
> • **3D Character Design & VR World Creation** — model a character, build a VR world
>
> 📦 IMMERSIA welcome kit (t-shirt + materials) delivered anywhere in Nigeria.
> *Demo Day pitch, prize, Robotics, Music & Entrepreneurship are part of the in-person Lagos camp.*
>
> 27 Jul – 4 Sep 2026 · Mon–Fri, 9:00 AM–1:30 PM · pick your 2-week cohort.
>
> **Register → aixrbootcamp.com/register?mode=online**

---

## Numbers to confirm before printing

- **₦50,000** online fee = `PRICE_ONLINE_KOBO` (default 5,000,000 kobo). ✅ matches the plan.
- **Delivery fee** = `DELIVERY_FEE_KOBO`. This currently ships with a **placeholder default
  (₦5,000)** — confirm the real flat amount and set it in the environment before promoting an
  exact figure. Prefer "flat nationwide delivery, shown at checkout" on the flyer unless the final
  number is locked.
- Cohort dates are admin-editable (Settings → Cohort dates); confirm they still read
  27 Jul – 4 Sep 2026.
