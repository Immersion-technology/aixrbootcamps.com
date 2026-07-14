import Link from "next/link";
import { PRICING, nairaFromKobo } from "@/lib/pricing";

export const metadata = {
  title: "Rules of Conduct | AI & XR Summer Tech Bootcamp",
  description: "The rules every camper, parent and facilitator agrees to before camp starts.",
};

export default function TermsPage() {
  return (
    <section className="relative pt-12 pb-24 dot-grid">
      <div className="max-w-[760px] mx-auto px-5 sm:px-7">
        <div className="inline-flex items-center gap-2 frosted-glass rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.22em] mb-5 anim-fade-up">
          <span className="w-1.5 h-1.5 rounded-full bg-grass-brand inline-block anim-pulse" />
          LEGAL · LAST UPDATED MAY 2026
        </div>

        <h1 className="font-bubble leading-[1] tracking-tight text-[clamp(38px,5.6vw,64px)] mb-3 anim-fade-up delay-1 text-ink">
          RULES OF CONDUCT
        </h1>
        <p className="text-[14px] sm:text-[15px] text-neutral-700 leading-relaxed max-w-[620px] mb-10 anim-fade-up delay-2">
          The short list parents and campers agree to when they register. We keep it tight on purpose. The longer a rule book gets, the less it gets read.
        </p>

        <div className="space-y-10 text-[14.5px] leading-relaxed text-ink/90">
          <Section title="1. Who can enrol">
            <p>
              The bootcamp is for kids aged <strong>10 to 17</strong> as of 27 July 2026. A parent or legal guardian must complete registration and approve payment. By submitting the form, you confirm you have the right to enrol the named camper.
            </p>
          </Section>

          <Section title="2. Camp dates &amp; hours">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Three cohorts of 2 weeks each.</strong> Identical curriculum and instructors across all three — pick whichever fits your family&apos;s calendar.</li>
              <li><strong>Cohort 1:</strong> 27 July – 7 August 2026.</li>
              <li><strong>Cohort 2:</strong> 10 August – 21 August 2026.</li>
              <li><strong>Cohort 3:</strong> 24 August – 4 September 2026.</li>
              <li>Monday to Friday, <strong>9:00 AM – 1:30 PM</strong>.</li>
              <li>Demo Day is on the Saturday after each cohort ends, and attendance for the pitch is part of the programme.</li>
            </ul>
          </Section>

          <Section title="3. What the fee covers">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>All five core courses plus the four side attractions (Go-Kart Racing, Table Tennis, FIFA &rsquo;26, VR Games), for the full two weeks of your cohort. (Robotics is an optional paid elective — see below.)</li>
              <li>Note: lunch, snacks and drinks are not provided. Campers bring their own food and water bottle.</li>
              <li>IMMERSIA t-shirt + all course materials and consumables.</li>
              <li>Use of camp laptops, headsets, robotics kits and gaming rigs.</li>
              <li>Demo Day, including the live pitch panel and prize for the winning team.</li>
            </ul>
            <p className="mt-2">Not included: transport to and from the venue, take-home equipment beyond what&apos;s explicitly stated, the optional Robotics elective (+{nairaFromKobo(PRICING.robotics)}, which covers the Arduino kit and components your camper keeps), and the optional laptop rental add-on.</p>
            <p className="mt-3"><strong>Online track ({nairaFromKobo(PRICING.online)}, fully remote):</strong> a separate programme covering three live courses taught online — Vibe Coding, Content Creation, and 3D &amp; VR. Online campers may add an optional <strong>Embedded Systems elective for {nairaFromKobo(PRICING.onlineEmbedded)}</strong>; that price is all-in and includes the hardware kit delivered anywhere in Nigeria (there is no separate delivery fee). The online track does <strong>not</strong> include the on-site side attractions, laptop rental, or the Demo Day pitch and prize — those are exclusive to the in-person camp.</p>
          </Section>

          <Section title="4. Payment, holds and refunds">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Payment is processed by <strong>Paystack</strong>. A slot is only held once payment clears.</li>
              <li>The in-person boot camp fee is <strong>{nairaFromKobo(PRICING.regular)}</strong>; the online track is a flat <strong>{nairaFromKobo(PRICING.online)}</strong> (optional Embedded Systems elective +{nairaFromKobo(PRICING.onlineEmbedded)}, kit delivery included). Any promo-code discount is applied and shown at checkout before you pay.</li>
              <li><strong>Instalments:</strong> {nairaFromKobo(PRICING.deposit)} deposit on registration holds your slot; balance is due two weeks before your cohort starts.</li>
              <li><strong>Refunds:</strong> none. All payments are final once a slot is confirmed.</li>
            </ul>
          </Section>

          <Section title="5. Camper behaviour">
            <p>Every camper agrees to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Treat every other camper, facilitator and visitor with respect. No bullying, harassment or discrimination of any kind.</li>
              <li>Follow facilitator instructions, especially around equipment safety (soldering iron, karts, gaming rigs).</li>
              <li>Show up on time, stay through the day, and pick a side attraction every day.</li>
              <li>Take care of camp equipment. Damage caused by gross misuse may be billed to the parent.</li>
              <li>Keep their phone in their bag during class blocks, except when shooting for Content Creation.</li>
            </ul>
            <p className="mt-2">
              Serious or repeated breaches (violence, theft, harassment) can result in removal from the cohort. No refund applies in those cases.
            </p>
          </Section>

          <Section title="6. Drop-off, pick-up &amp; medical">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>The named parent or guardian (or a person they nominate in writing) drops off and picks up the camper.</li>
              <li>If your camper has any condition we need to know about (allergies, asthma, medication), declare it in the medical notes during registration.</li>
              <li>For minor injuries during camp, the facilitator on duty handles first aid and contacts you. For anything serious, we call your emergency contact and the nearest hospital immediately.</li>
              <li>You authorise us to seek emergency medical care for your camper if you can&apos;t be reached in time.</li>
            </ul>
          </Section>

          <Section title="7. Photos and media">
            <p>
              We take photos and short videos during camp for cohort recaps, social posts and Demo Day. By registering, you give us permission to use those images in IMMERSIA channels. You can opt out at registration or by emailing <a className="font-semibold underline underline-offset-2 decoration-2 hover:text-aqua-deep" href="mailto:privacy@immersia.ng">privacy@immersia.ng</a> at any time.
            </p>
          </Section>

          <Section title="8. Camper work &amp; IP">
            <p>
              Anything your camper builds during camp (code, characters, tracks, videos, robots) <strong>belongs to them</strong>. We may show their work in IMMERSIA channels with permission, but ownership stays with the camper. AI-generated content follows the terms of the underlying tool (Suno, Udio, etc.).
            </p>
          </Section>

          <Section title="9. Liability">
            <p>
              We run a safe, supervised camp. By registering, you accept that some activities (robotics, karting, gaming) carry normal physical risks, and that IMMERSIA&apos;s liability is limited to gross negligence on our part. We carry public-liability insurance for the venue and karting circuit.
            </p>
          </Section>

          <Section title="10. Changes to these rules">
            <p>
              If we change anything material, we&apos;ll email every active registration and update the &ldquo;Last updated&rdquo; date at the top of this page. Continuing in the programme after a change means you accept the updated rules.
            </p>
          </Section>

          <Section title="11. Governing law">
            <p>
              These rules are governed by the laws of the Federal Republic of Nigeria. Any dispute we can&apos;t resolve in conversation goes to the Lagos State courts.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>
              Questions or disputes: <a className="font-semibold underline underline-offset-2 decoration-2 hover:text-aqua-deep" href="mailto:hello@immersia.ng">hello@immersia.ng</a>
              <br />
              Or talk to a human: <Link className="font-semibold underline underline-offset-2 decoration-2 hover:text-aqua-deep" href="/contact">/contact</Link>
            </p>
          </Section>
        </div>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link href="/register" className="btn-grass">
            Reserve a slot <span aria-hidden>→</span>
          </Link>
          <Link href="/privacy" className="text-[13px] font-semibold underline underline-offset-4 decoration-2 hover:text-aqua-deep transition">
            Read the privacy policy
          </Link>
        </div>
      </div>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-bubble text-[22px] sm:text-[26px] leading-[1.05] mb-3 text-ink">{title}</h2>
      <div className="space-y-2 text-ink/85">{children}</div>
    </div>
  );
}
