"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationCreateSchema, type RegistrationCreateInput } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { CURRICULUM, type CurriculumItem } from "@/lib/curriculum";

interface Pricing {
  isEarlyBird: boolean;
  earlyBirdPrice: number;
  regularPrice: number;
  onlinePrice: number;
  deliveryFee: number;
  laptopPrice: number;
  roboticsPrice: number;
}

interface Props {
  pricing: Pricing;
  slotsLeft: number;
  /** Preselected attendance track — set from the `?mode=online` deep-link (flyer). */
  initialMode?: "in_person" | "online";
}

const STEPS = ["Camper", "Guardian", "Programme", "Pay"] as const;

// Every camper attends every core class. Electives (e.g. Robotics) are opt-in,
// carry their own fee, and are offered separately below.
const CLASSES: CurriculumItem[] = CURRICULUM.filter((c) => c.type === "class");
const ALWAYS_ATTENDED: CurriculumItem[] = CLASSES.filter((c) => !c.isElective);
const ELECTIVES: CurriculumItem[] = CLASSES.filter((c) => c.isElective);
// The online track is trimmed: only core classes that aren't in-person-only, and no electives.
const ONLINE_ATTENDED: CurriculumItem[] = ALWAYS_ATTENDED.filter((c) => !c.inPersonOnly);

interface AppliedPromo {
  code: string;
  discountKobo: number;
  newTotalKobo: number;
}

export default function RegistrationForm({ pricing, initialMode = "in_person" }: Props) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Promo code (applied separately from the RHF fields; the server re-validates on submit).
  const [promoInput, setPromoInput] = useState("");
  const [applied, setApplied] = useState<AppliedPromo | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoNote, setPromoNote] = useState<string | null>(null);
  const appliedRef = useRef(false);

  const form = useForm<RegistrationCreateInput>({
    resolver: zodResolver(registrationCreateSchema),
    mode: "onTouched",
    defaultValues: {
      participant: {
        fullName: "", dateOfBirth: "", gender: "Male" as const,
        school: "", classGrade: "", tshirtSize: "M" as const,
      },
      parent: {
        fullName: "", relationship: "Mother" as const,
        phonePrimary: "", phoneSecondary: "",
        email: "", address: "",
      },
      emergencyContact: { fullName: "", phone: "", relationship: "" },
      medicalNotes: "",
      attendanceMode: initialMode,
      laptopRental: false,
      roboticsElective: false,
      agreedToTerms: false as unknown as true,
    },
  });

  const { register, handleSubmit, watch, setValue, formState, trigger } = form;
  const values = watch();

  async function next() {
    const fieldsForStep = (() => {
      if (step === 0) return ["participant"];
      if (step === 1) return ["parent", "emergencyContact"];
      // step 2 (Programme) has no user-pickable fields, nothing to validate.
      return [];
    })();
    const ok = await trigger(fieldsForStep as any, { shouldFocus: true });
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  // The online track is a flat-priced, trimmed programme: fixed online fee + a mandatory
  // welcome-kit delivery fee, and no paid add-ons. In-person keeps early-bird/regular + add-ons.
  const isOnline = values.attendanceMode === "online";
  const attendedCourses = isOnline ? ONLINE_ATTENDED : ALWAYS_ATTENDED;
  const electives = isOnline ? [] : ELECTIVES;

  const bootCampFee = isOnline
    ? pricing.onlinePrice
    : pricing.isEarlyBird
      ? pricing.earlyBirdPrice
      : pricing.regularPrice;
  const laptopFee = !isOnline && values.laptopRental ? pricing.laptopPrice : 0;
  const roboticsFee = !isOnline && values.roboticsElective ? pricing.roboticsPrice : 0;
  const deliveryFee = isOnline ? pricing.deliveryFee : 0;
  const subtotal = bootCampFee + laptopFee + roboticsFee;
  const discountKobo = applied ? applied.discountKobo : 0;
  // Delivery is added on top of the (discounted) subtotal — it is never discounted.
  const payableTotal = Math.max(0, subtotal - discountKobo) + deliveryFee;
  const naira = (k: number) => `₦${(k / 100).toLocaleString("en-NG")}`;

  // The online track can't buy add-ons — if the camper switches to online, clear any that
  // were ticked while on the in-person track so the payload stays valid (the API rejects them).
  useEffect(() => {
    if (isOnline) {
      if (values.laptopRental) setValue("laptopRental", false);
      if (values.roboticsElective) setValue("roboticsElective", false);
    }
  }, [isOnline, values.laptopRental, values.roboticsElective, setValue]);

  // A promo's discount depends on the boot-camp fee, so if the track or add-ons change after a
  // code was applied we drop it and ask the camper to re-apply — keeping the shown total honest.
  useEffect(() => {
    if (appliedRef.current) {
      appliedRef.current = false;
      setApplied(null);
      setPromoError(null);
      setPromoNote("Your order changed — re-apply your promo code.");
    }
  }, [values.laptopRental, values.roboticsElective, values.attendanceMode]);

  async function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoChecking(true);
    setPromoError(null);
    setPromoNote(null);
    try {
      const r = await fetch("/api/public/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          attendanceMode: values.attendanceMode,
          laptopRental: values.laptopRental,
          roboticsElective: values.roboticsElective,
        }),
      });
      const json = await r.json();
      if (json.valid) {
        setApplied({ code: json.code, discountKobo: json.discountKobo, newTotalKobo: json.newTotalKobo });
        appliedRef.current = true;
        setPromoNote(json.message ?? "Discount applied.");
      } else {
        setApplied(null);
        appliedRef.current = false;
        setPromoError(json.message ?? "That code isn't valid.");
      }
    } catch {
      setPromoError("Couldn't check that code. Try again.");
    } finally {
      setPromoChecking(false);
    }
  }

  function removePromo() {
    setApplied(null);
    appliedRef.current = false;
    setPromoInput("");
    setPromoError(null);
    setPromoNote(null);
  }

  async function onSubmit(data: RegistrationCreateInput) {
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/public/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The applied code is sent alongside the form; the server re-validates and is the
        // authoritative source of the charged amount.
        body: JSON.stringify({ ...data, promoCode: applied?.code }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? "Could not create registration");
      window.location.href = json.authorizationUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7 pb-24 lg:pb-0">
      {/* ============= STEPPER =============
          Sticker pills. Color + checkmark + number, never color alone, per a11y. */}
      <ol className="grid grid-cols-4 gap-2 anim-fade-up" aria-label="Registration progress">
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li
              key={label}
              aria-current={current ? "step" : undefined}
              className={cn(
                "rounded-full px-3 py-2.5 text-[10.5px] font-bold tracking-[.16em] uppercase text-center transition flex items-center justify-center gap-1.5 min-h-[44px]",
                done && "bg-grass-brand text-ink shadow-[0_4px_12px_-4px_rgba(251,86,7,.5)]",
                current && "bg-ink text-white shadow-[0_4px_12px_-4px_rgba(15,15,15,.4)]",
                !done && !current && "bg-paper text-neutral-500 border-2 border-black/[.08]",
              )}
            >
              <span className="font-bubble text-[13px] leading-none">{done ? "✓" : i + 1}</span>
              <span className="hidden sm:inline">{label}</span>
            </li>
          );
        })}
      </ol>

      {/* ============= STEP 1: TRACK + CAMPER ============= */}
      {step === 0 && (
        <div className="space-y-5 anim-fade-up">
          {/* Track chooser — pick online vs in-person FIRST; prices, courses and add-ons adapt. */}
          <div className="frosted-glass rounded-3xl p-6 md:p-7">
            <div className="text-[10.5px] font-bold tracking-[.22em] text-aqua-deep uppercase mb-1">
              First, choose your track
            </div>
            <p className="text-[12.5px] text-neutral-600 mb-4">Prices, courses and add-ons update to match.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                {
                  value: "in_person",
                  title: "In-person · Lagos",
                  desc: "Full programme at our supervised Lagos venue — every course, the Demo Day pitch & prize, optional Robotics.",
                  price: pricing.isEarlyBird ? pricing.earlyBirdPrice : pricing.regularPrice,
                  priceNote: pricing.isEarlyBird ? "early-bird" : "regular",
                },
                {
                  value: "online",
                  title: "Online · anywhere",
                  desc: "Three live courses from home (Vibe Coding, Content Creation, 3D/VR). Welcome kit delivered to your door.",
                  price: pricing.onlinePrice,
                  priceNote: "+ delivery",
                },
              ].map((opt) => {
                const active = values.attendanceMode === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      "ticket-card frosted-glass rounded-2xl p-4 flex flex-col gap-2 cursor-pointer border-2 transition",
                      active ? "border-aqua-brand" : "border-aqua-brand/20",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <input type="radio" value={opt.value} {...register("attendanceMode")} className="accent-aqua-brand mt-1" />
                      <div className="flex-1">
                        <div className="text-[14px] font-semibold text-ink">{opt.title}</div>
                        <div className="text-[12px] text-neutral-600 mt-0.5 leading-snug">{opt.desc}</div>
                      </div>
                    </div>
                    <div className="pl-7 font-accent font-extrabold text-[18px] text-ink">
                      {naira(opt.price)}{" "}
                      <span className="text-[11px] font-sans font-semibold text-neutral-500">{opt.priceNote}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Camper details */}
          <div className="frosted-glass rounded-3xl p-6 md:p-9 space-y-5">
          <Header eyebrow="Step 1 of 4" title="Tell us about the camper" />

          <Field label="Full name" error={formState.errors.participant?.fullName?.message}>
            <input className="input" {...register("participant.fullName")} />
          </Field>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Date of birth" error={formState.errors.participant?.dateOfBirth?.message}>
              <input type="date" className="input" {...register("participant.dateOfBirth")} />
            </Field>
            <Field label="Gender" error={formState.errors.participant?.gender?.message}>
              <select className="input" {...register("participant.gender")}>
                <option>Male</option>
                <option>Female</option>
                <option>Prefer not to say</option>
              </select>
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="School name" error={formState.errors.participant?.school?.message}>
              <input className="input" {...register("participant.school")} />
            </Field>
            <Field label="Class / grade (optional)">
              <input className="input" {...register("participant.classGrade")} />
            </Field>
          </div>

          <Field label="T-shirt size">
            <select className="input" {...register("participant.tshirtSize")}>
              {["XS", "S", "M", "L", "XL"].map((s) => <option key={s}>{s}</option>)}
            </select>
            {isOnline && (
              <p className="text-[11.5px] text-neutral-500 mt-1.5">
                We ship this size in your online welcome kit.
              </p>
            )}
          </Field>
          </div>
        </div>
      )}

      {/* ============= STEP 2: GUARDIAN + EMERGENCY ============= */}
      {step === 1 && (
        <div className="frosted-glass rounded-3xl p-6 md:p-9 space-y-5 anim-fade-up">
          <Header eyebrow="Step 2 of 4" title="Parent or guardian" />

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Full name" error={formState.errors.parent?.fullName?.message}>
              <input className="input" {...register("parent.fullName")} />
            </Field>
            <Field label="Relationship" error={formState.errors.parent?.relationship?.message}>
              <select className="input" {...register("parent.relationship")}>
                <option>Mother</option>
                <option>Father</option>
                <option>Guardian</option>
                <option>Other</option>
              </select>
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Primary phone" error={formState.errors.parent?.phonePrimary?.message}>
              <input className="input" placeholder="0801..." {...register("parent.phonePrimary")} />
            </Field>
            <Field label="Secondary phone (optional)">
              <input className="input" {...register("parent.phoneSecondary")} />
            </Field>
          </div>

          <Field label="Email" error={formState.errors.parent?.email?.message}>
            <input type="email" className="input" {...register("parent.email")} />
          </Field>

          <Field
            label={isOnline ? "Delivery address" : "Home address"}
            error={formState.errors.parent?.address?.message}
          >
            <textarea
              rows={2}
              className="input"
              placeholder={isOnline ? "Where we ship the welcome kit" : undefined}
              {...register("parent.address")}
            />
            {isOnline && (
              <p className="text-[11.5px] text-neutral-500 mt-1.5">
                Your online welcome kit ships here — please give a full, reachable address.
              </p>
            )}
          </Field>

          <div className="pt-3 border-t border-black/5">
            <Header eyebrow="Emergency contact" title="In case we need to reach someone fast" small />
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <Field label="Full name" error={formState.errors.emergencyContact?.fullName?.message}>
                <input className="input" {...register("emergencyContact.fullName")} />
              </Field>
              <Field label="Phone" error={formState.errors.emergencyContact?.phone?.message}>
                <input className="input" {...register("emergencyContact.phone")} />
              </Field>
              <Field label="Relationship" error={formState.errors.emergencyContact?.relationship?.message}>
                <input className="input" {...register("emergencyContact.relationship")} />
              </Field>
            </div>
          </div>

          <Field label="Medical conditions or allergies (optional)">
            <textarea rows={2} className="input" {...register("medicalNotes")} />
          </Field>
        </div>
      )}

      {/* ============= STEP 3: PROGRAMME (read-only enrollment + paired-elective radio) ============= */}
      {step === 2 && (
        <div className="space-y-5 anim-fade-up">
          <Header eyebrow="Step 3 of 4" title="Your camper&rsquo;s programme" />

          {/* Chosen track (set in step 1) — read-only reminder + jump back to change it. */}
          <div className="frosted-glass rounded-3xl p-5 md:p-6 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[10.5px] font-bold tracking-[.22em] text-aqua-deep uppercase mb-1">Your track</div>
              <div className="text-[14px] font-semibold text-ink">
                {isOnline ? "Online · anywhere" : "In-person · Lagos"}
              </div>
              <div className="text-[12px] text-neutral-600 mt-0.5">
                {isOnline
                  ? "Live sessions from home, plus a welcome kit delivered to you."
                  : "On-site at our supervised Lagos venue, including Demo Day."}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(0)}
              className="text-[12px] font-semibold text-aqua-deep hover:text-ink underline underline-offset-2"
            >
              Change
            </button>
          </div>

          {/* Enrolled-in summary (course set follows the chosen track) */}
          <div className="frosted-glass rounded-3xl p-6 md:p-7">
            <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
              <div className="text-[10.5px] font-bold tracking-[.22em] text-aqua-deep uppercase">
                {isOnline
                  ? `Your ${attendedCourses.length} online courses`
                  : `Enrolled in all ${attendedCourses.length} courses below`}
              </div>
              {!isOnline && <span className="text-[11px] text-neutral-500">+ 3 daily active breaks</span>}
            </div>
            <ul className="space-y-2.5">
              {attendedCourses.map((c) => (
                <li key={c.slug} className="flex items-start gap-3">
                  <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-aqua-brand" />
                  <div>
                    <div className="font-semibold text-[14px] leading-snug">
                      {c.name}
                      {c.isCompulsory && (
                        <span className="ml-2 inline-block text-[9.5px] font-bold tracking-[.18em] uppercase bg-ink text-white px-2 py-0.5 rounded-full align-middle">
                          ★ Compulsory
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-neutral-600 mt-0.5">
                      {c.hoursPerWeek} hrs/wk
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Active breaks — on-site only, so in-person track only. */}
          {!isOnline && (
            <div className="frosted-glass-dark rounded-3xl p-6 md:p-7">
              <div className="text-[10.5px] font-bold tracking-[.22em] text-white/70 uppercase mb-3">
                ☕ Daily side attractions · 30 min · one token a day
              </div>
              <p className="text-[13px] text-white/85 leading-relaxed">
                Pro Gaming, Table Tennis and Go Karting are available every single day from 1:00–1:30 PM. Your camper picks one with a token each day. All included.
              </p>
            </div>
          )}

          {/* Welcome-kit delivery — mandatory on the online track. */}
          {isOnline && (
            <div className="ticket-card frosted-glass rounded-2xl p-4 flex items-start gap-3 border-2 border-aqua-brand/30">
              <span className="text-[20px] leading-none mt-0.5" aria-hidden>📦</span>
              <div className="flex-1">
                <div className="text-[10px] font-bold tracking-[.18em] text-aqua-deep mb-0.5">INCLUDED · DELIVERED</div>
                <div className="text-[14px] font-semibold text-ink">Welcome kit — t-shirt &amp; materials shipped to you</div>
                <div className="text-[12px] text-neutral-600 mt-0.5 leading-snug">
                  Flat nationwide delivery, added to your total below.
                </div>
              </div>
              <div className="font-accent font-extrabold text-[18px] text-ink shrink-0">+{naira(pricing.deliveryFee)}</div>
            </div>
          )}

          {/* Electives — opt-in paid courses (in-person only; empty on the online track). */}
          {electives.map((c) => (
            <label key={c.slug} className="ticket-card frosted-glass rounded-2xl p-4 flex items-start gap-3 cursor-pointer border-2 border-aqua-brand/30">
              <input type="checkbox" {...register("roboticsElective")} className="accent-aqua-brand mt-1" />
              <div className="flex-1">
                <div className="text-[10px] font-bold tracking-[.18em] text-aqua-deep mb-0.5">✦ OPTIONAL ELECTIVE</div>
                <div className="text-[14px] font-semibold text-ink">{c.name}</div>
                <div className="text-[12px] text-neutral-600 mt-0.5 leading-snug">{c.shortDesc}</div>
              </div>
              <div className="font-accent font-extrabold text-[18px] text-ink shrink-0">+{naira(pricing.roboticsPrice)}</div>
            </label>
          ))}

          {/* Laptop rental — in-person only. */}
          {!isOnline && (
            <label className="ticket-card frosted-glass-dark rounded-2xl p-4 flex items-center gap-3 cursor-pointer">
              <input type="checkbox" {...register("laptopRental")} className="accent-aqua-brand mt-0.5" />
              <div className="flex-1">
                <div className="text-[10px] font-bold tracking-[.18em] text-white/70 mb-0.5">OPTIONAL ADD-ON</div>
                <div className="text-[13.5px] font-semibold">Rent a laptop for the two weeks of your cohort</div>
              </div>
              <div className="font-accent font-extrabold text-[18px]">+{naira(pricing.laptopPrice)}</div>
            </label>
          )}
        </div>
      )}

      {/* ============= STEP 4: REVIEW & PAY ============= */}
      {step === 3 && (
        <div className="space-y-4 anim-fade-up">
          <Header eyebrow="Step 4 of 4" title="One last look, then pay" />

          <ReviewCard title="Camper" data={[
            ["Name", values.participant?.fullName],
            ["DOB", values.participant?.dateOfBirth],
            ["School", values.participant?.school],
            ["T-shirt", values.participant?.tshirtSize],
          ]} onEdit={() => setStep(0)} />

          <ReviewCard title="Parent / Guardian" data={[
            ["Name", values.parent?.fullName],
            ["Phone", values.parent?.phonePrimary],
            ["Email", values.parent?.email],
          ]} onEdit={() => setStep(1)} />

          <ReviewCard title="Programme" data={(isOnline
            ? [
                ["Attendance", "Online (anywhere)"],
                ["Courses", `${attendedCourses.length} live online courses`],
                ["Welcome kit", `Delivered (+${naira(pricing.deliveryFee)})`],
              ]
            : [
                ["Attendance", "In-person (Lagos)"],
                ["Core courses", `${attendedCourses.length} (all attended)`],
                ["Active breaks", "Pro Gaming · Table Tennis · Go Karting"],
                ["Robotics elective", values.roboticsElective ? `Yes (+${naira(pricing.roboticsPrice)})` : "No"],
                ["Laptop rental", values.laptopRental ? `Yes (+${naira(pricing.laptopPrice)})` : "No"],
              ]) as [string, string][]}
            onEdit={() => setStep(2)} />

          {/* Total + pay */}
          <div className="frosted-glass-dark rounded-3xl p-6 md:p-8">
            <div className="text-[10.5px] font-bold tracking-[.2em] text-white/70 mb-4">YOU&apos;RE PAYING</div>
            <table className="w-full text-[13.5px] mb-5">
              <tbody className="text-white/80">
                <tr>
                  <td className="py-1.5">
                    {isOnline ? "Online programme" : `Boot camp (${pricing.isEarlyBird ? "early bird" : "regular"})`}
                  </td>
                  <td className="text-right py-1.5 font-mono">{naira(bootCampFee)}</td>
                </tr>
                {values.roboticsElective && (
                  <tr>
                    <td className="py-1.5">Robotics elective</td>
                    <td className="text-right py-1.5 font-mono">{naira(roboticsFee)}</td>
                  </tr>
                )}
                {values.laptopRental && (
                  <tr>
                    <td className="py-1.5">Laptop rental</td>
                    <td className="text-right py-1.5 font-mono">{naira(laptopFee)}</td>
                  </tr>
                )}
                {applied && discountKobo > 0 && (
                  <tr className="text-grass-brand">
                    <td className="py-1.5">Promo ({applied.code})</td>
                    <td className="text-right py-1.5 font-mono">−{naira(discountKobo)}</td>
                  </tr>
                )}
                {isOnline && deliveryFee > 0 && (
                  <tr>
                    <td className="py-1.5">Welcome-kit delivery</td>
                    <td className="text-right py-1.5 font-mono">{naira(deliveryFee)}</td>
                  </tr>
                )}
                <tr className="border-t border-white/15">
                  <td className="pt-3 text-white font-bold">Total</td>
                  <td className="text-right pt-3 font-accent font-extrabold text-white text-[24px]">{naira(payableTotal)}</td>
                </tr>
              </tbody>
            </table>

            {/* Promo code — validated server-side; the discount above reflects the preview. */}
            <div className="mb-5">
              {!applied ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value.toUpperCase());
                        if (promoError) setPromoError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyPromo();
                        }
                      }}
                      placeholder="Promo code (optional)"
                      autoCapitalize="characters"
                      className="input flex-1 !bg-white/10 !border-white/20 !text-white placeholder:!text-white/40 uppercase"
                      aria-label="Promo code"
                    />
                    <button
                      type="button"
                      onClick={applyPromo}
                      disabled={promoChecking || !promoInput.trim()}
                      className="shrink-0 rounded-full px-5 bg-white/15 text-white text-[13px] font-bold hover:bg-white/25 transition disabled:opacity-40"
                    >
                      {promoChecking ? "Checking…" : "Apply"}
                    </button>
                  </div>
                  {promoError && <p className="text-[12px] text-pink-soft mt-2">⚠ {promoError}</p>}
                  {promoNote && !promoError && <p className="text-[12px] text-white/60 mt-2">{promoNote}</p>}
                </>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-grass-brand/15 border border-grass-brand/30 px-4 py-2.5">
                  <span className="text-[12.5px] text-white/90">
                    <span className="font-bold text-grass-brand">✓ {applied.code}</span> applied — you save {naira(discountKobo)}
                  </span>
                  <button
                    type="button"
                    onClick={removePromo}
                    className="text-[11.5px] font-semibold text-white/70 hover:text-white underline underline-offset-2"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <label className="flex items-start gap-3 mb-5 text-[13px] text-white/90">
              <input type="checkbox" {...register("agreedToTerms")} className="mt-1 accent-aqua-brand" />
              <span>I agree to the participant rules of conduct and confirm the information above is accurate.</span>
            </label>
            {formState.errors.agreedToTerms && (
              <p className="text-[12.5px] text-pink-soft mb-3">⚠ {formState.errors.agreedToTerms.message}</p>
            )}

            {error && <p className="text-[12.5px] text-pink-soft mb-3">⚠ {error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-grass-brand text-ink rounded-full py-4 min-h-[56px] font-bubble text-[18px] sm:text-[20px] tracking-tight hover:bg-grass-deep hover:text-white transition disabled:opacity-60 shadow-[0_14px_30px_-10px_rgba(251,86,7,.6)]"
            >
              {submitting ? "REDIRECTING TO PAYSTACK…" : `PAY ${naira(payableTotal)} VIA PAYSTACK →`}
            </button>
          </div>
        </div>
      )}

      {/* ============= STEP CONTROLS (desktop) ============= */}
      <div className="hidden lg:flex justify-between items-center pt-2">
        <button type="button" onClick={back} disabled={step === 0}
                className="text-[13px] font-semibold text-neutral-600 hover:text-ink disabled:opacity-30 transition">
          ← Back
        </button>
        {step < STEPS.length - 1 && (
          <button type="button" onClick={next} className="btn-dark !text-sm">
            Next <span>→</span>
          </button>
        )}
      </div>

      {/* ============= STICKY MOBILE BAR ============= */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 frosted-glass-dark border-t border-white/10 px-5 py-3 flex items-center justify-between gap-3">
        <button type="button" onClick={back} disabled={step === 0}
                className="text-[12px] font-semibold text-white/70 disabled:opacity-30">
          ← Back
        </button>
        <span className="text-[10.5px] font-bold tracking-[.18em] text-white/60">
          STEP {step + 1} / {STEPS.length}
        </span>
        {step < STEPS.length - 1 && (
          <button type="button" onClick={next}
                  className="bg-white text-ink rounded-full px-5 py-2 text-[12px] font-bold">
            Next →
          </button>
        )}
      </div>
    </form>
  );
}

function Header({ eyebrow, title, small }: { eyebrow: string; title: string; small?: boolean }) {
  return (
    <div>
      <div className="text-[10.5px] font-bold tracking-[.2em] text-aqua-deep uppercase mb-1.5">{eyebrow}</div>
      <h2 className={cn("font-bubble tracking-tight leading-tight text-ink", small ? "text-[20px]" : "text-[26px] sm:text-[32px]")}>
        {title}
      </h2>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
      {error && (
        <p className="field-error mt-1.5 flex items-start gap-1.5">
          <span aria-hidden>↩</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

function ReviewCard({
  title, data, onEdit,
}: { title: string; data: Array<[string, string | undefined]>; onEdit: () => void }) {
  return (
    <div className="frosted-glass rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-extrabold text-[17px]">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-[10.5px] font-bold tracking-[.18em] uppercase frosted-glass-dark px-3 py-1 rounded-full hover:bg-aqua-brand hover:text-ink transition"
        >
          Edit
        </button>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
        {data.map(([k, v]) => (
          <div key={k}>
            <dt className="text-neutral-500 text-[10.5px] uppercase tracking-wider">{k}</dt>
            <dd className="font-medium">{v || "–"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
