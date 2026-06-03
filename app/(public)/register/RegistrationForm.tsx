"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationCreateSchema, type RegistrationCreateInput } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { CURRICULUM, type CurriculumItem } from "@/lib/curriculum";

interface Pricing {
  isEarlyBird: boolean;
  earlyBirdPrice: number;
  regularPrice: number;
  laptopPrice: number;
  roboticsPrice: number;
}

interface Props {
  pricing: Pricing;
  slotsLeft: number;
}

const STEPS = ["Camper", "Guardian", "Programme", "Pay"] as const;

// Every camper attends every core class. Electives (e.g. Robotics) are opt-in,
// carry their own fee, and are offered separately below.
const CLASSES: CurriculumItem[] = CURRICULUM.filter((c) => c.type === "class");
const ALWAYS_ATTENDED: CurriculumItem[] = CLASSES.filter((c) => !c.isElective);
const ELECTIVES: CurriculumItem[] = CLASSES.filter((c) => c.isElective);

export default function RegistrationForm({ pricing }: Props) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const bootCampFee = pricing.isEarlyBird ? pricing.earlyBirdPrice : pricing.regularPrice;
  const laptopFee = values.laptopRental ? pricing.laptopPrice : 0;
  const roboticsFee = values.roboticsElective ? pricing.roboticsPrice : 0;
  const total = bootCampFee + laptopFee + roboticsFee;
  const naira = (k: number) => `₦${(k / 100).toLocaleString("en-NG")}`;

  async function onSubmit(data: RegistrationCreateInput) {
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/public/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
                done && "bg-grass-brand text-ink shadow-[0_4px_12px_-4px_rgba(34,197,94,.5)]",
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

      {/* ============= STEP 1: CAMPER ============= */}
      {step === 0 && (
        <div className="frosted-glass rounded-3xl p-6 md:p-9 space-y-5 anim-fade-up">
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
          </Field>
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

          <Field label="Home address" error={formState.errors.parent?.address?.message}>
            <textarea rows={2} className="input" {...register("parent.address")} />
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

          {/* Enrolled-in summary */}
          <div className="frosted-glass rounded-3xl p-6 md:p-7">
            <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
              <div className="text-[10.5px] font-bold tracking-[.22em] text-aqua-deep uppercase">
                Enrolled in all {ALWAYS_ATTENDED.length} courses below
              </div>
              <span className="text-[11px] text-neutral-500">+ 3 daily active breaks</span>
            </div>
            <ul className="space-y-2.5">
              {ALWAYS_ATTENDED.map((c) => (
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

          {/* Active breaks (info only, not pickable) */}
          <div className="frosted-glass-dark rounded-3xl p-6 md:p-7">
            <div className="text-[10.5px] font-bold tracking-[.22em] text-white/70 uppercase mb-3">
              ☕ Daily active breaks · 30 min · free choice
            </div>
            <p className="text-[13px] text-white/85 leading-relaxed">
              Pro Gaming, Table Tennis and Go Karting are available every single day from 12:00–12:30. Your camper picks freely each day. All included.
            </p>
          </div>

          {/* Electives — opt-in paid courses, not part of the base fee */}
          {ELECTIVES.map((c) => (
            <label key={c.slug} className="ticket-card frosted-glass rounded-2xl p-4 flex items-start gap-3 cursor-pointer border-2 border-aqua-brand/30">
              <input type="checkbox" {...register("roboticsElective")} className="accent-aqua-brand mt-1" />
              <div className="flex-1">
                <div className="text-[10px] font-bold tracking-[.18em] text-aqua-deep mb-0.5">✦ OPTIONAL ELECTIVE</div>
                <div className="text-[14px] font-semibold text-ink">{c.name}</div>
                <div className="text-[12px] text-neutral-600 mt-0.5 leading-snug">{c.shortDesc}</div>
              </div>
              <div className="font-accent font-extrabold text-[18px] text-ink shrink-0">+{naira(c.electiveFeeKobo ?? 0)}</div>
            </label>
          ))}

          {/* Laptop rental, ticket-style highlight */}
          <label className="ticket-card frosted-glass-dark rounded-2xl p-4 flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("laptopRental")} className="accent-aqua-brand mt-0.5" />
            <div className="flex-1">
              <div className="text-[10px] font-bold tracking-[.18em] text-white/70 mb-0.5">OPTIONAL ADD-ON</div>
              <div className="text-[13.5px] font-semibold">Rent a laptop for the two weeks of your cohort</div>
            </div>
            <div className="font-accent font-extrabold text-[18px]">+{naira(pricing.laptopPrice)}</div>
          </label>
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

          <ReviewCard title="Programme" data={[
            ["Core courses", `${ALWAYS_ATTENDED.length} (all attended)`],
            ["Active breaks", "Pro Gaming · Table Tennis · Go Karting"],
            ["Robotics elective", values.roboticsElective ? `Yes (+${naira(pricing.roboticsPrice)})` : "No"],
            ["Laptop rental", values.laptopRental ? `Yes (+${naira(pricing.laptopPrice)})` : "No"],
          ]} onEdit={() => setStep(2)} />

          {/* Total + pay */}
          <div className="frosted-glass-dark rounded-3xl p-6 md:p-8">
            <div className="text-[10.5px] font-bold tracking-[.2em] text-white/70 mb-4">YOU&apos;RE PAYING</div>
            <table className="w-full text-[13.5px] mb-5">
              <tbody className="text-white/80">
                <tr>
                  <td className="py-1.5">Boot camp ({pricing.isEarlyBird ? "early bird" : "regular"})</td>
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
                <tr className="border-t border-white/15">
                  <td className="pt-3 text-white font-bold">Total</td>
                  <td className="text-right pt-3 font-accent font-extrabold text-white text-[24px]">{naira(total)}</td>
                </tr>
              </tbody>
            </table>

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
              className="w-full bg-grass-brand text-ink rounded-full py-4 min-h-[56px] font-bubble text-[18px] sm:text-[20px] tracking-tight hover:bg-grass-deep hover:text-white transition disabled:opacity-60 shadow-[0_14px_30px_-10px_rgba(34,197,94,.6)]"
            >
              {submitting ? "REDIRECTING TO MONNIFY…" : `PAY ${naira(total)} VIA MONNIFY →`}
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
