import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — AI & XR Summer Tech Bootcamp",
  description: "How IMMERSIA collects, uses, and protects the data you share when registering a camper.",
};

export default function PrivacyPage() {
  return (
    <section className="relative pt-12 pb-24 dot-grid">
      <div className="max-w-[760px] mx-auto px-5 sm:px-7">
        <div className="inline-flex items-center gap-2 frosted-glass rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.22em] mb-5 anim-fade-up">
          <span className="w-1.5 h-1.5 rounded-full bg-aqua-brand inline-block anim-pulse" />
          LEGAL · LAST UPDATED MAY 2026
        </div>

        <h1 className="font-bubble leading-[1] tracking-tight text-[clamp(38px,5.6vw,64px)] mb-3 anim-fade-up delay-1 text-ink">
          PRIVACY POLICY
        </h1>
        <p className="text-[14px] sm:text-[15px] text-neutral-700 leading-relaxed max-w-[620px] mb-10 anim-fade-up delay-2">
          Plain-English version. We collect a small amount of information to enrol your child and keep them safe during camp. We don&apos;t sell it, we don&apos;t share it for marketing, and we delete it when it&apos;s no longer needed.
        </p>

        <div className="space-y-10 text-[14.5px] leading-relaxed text-ink/90">
          <Section title="1. Who we are">
            <p>
              IMMERSIA (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the AI &amp; XR Summer Bootcamp, a summer programme for kids aged 10–17 split into two back-to-back two-week cohorts and based in Lagos, Nigeria. This policy applies to everything on this site and to information you give us during registration.
            </p>
          </Section>

          <Section title="2. What we collect">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>About the camper:</strong> full name, date of birth, gender, school, class/grade, t-shirt size.</li>
              <li><strong>About the parent / guardian:</strong> full name, relationship, phone numbers, email, home address.</li>
              <li><strong>Emergency contact:</strong> name, phone, relationship.</li>
              <li><strong>Medical notes:</strong> only what you choose to disclose (allergies, conditions we should know about).</li>
              <li><strong>Payment metadata:</strong> Paystack reference + status. We do <em>not</em> store card numbers or bank details — those live with Paystack.</li>
              <li><strong>Site analytics:</strong> anonymous page-view data and request IPs used briefly for rate-limiting abuse.</li>
            </ul>
          </Section>

          <Section title="3. Why we collect it">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To enrol your child in the cohort, assign them to courses, and produce their name badge / t-shirt.</li>
              <li>To reach you about logistics, drop-off, pick-up, schedule changes, and Demo Day.</li>
              <li>To contact your emergency contact if your child needs medical attention.</li>
              <li>To process payment via Paystack.</li>
              <li>To comply with the Nigeria Data Protection Regulation (NDPR) and the Nigeria Data Protection Act 2023.</li>
            </ul>
          </Section>

          <Section title="4. Who we share it with">
            <p>
              By default — <strong>nobody outside the IMMERSIA team</strong>. The exceptions:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Paystack</strong>, to process payment.</li>
              <li><strong>Our email provider</strong>, to send registration confirmations, receipts and pre-camp logistics.</li>
              <li><strong>Medical responders</strong>, only if your child needs urgent care during camp.</li>
              <li><strong>Law enforcement</strong>, only if compelled by a valid Nigerian court order.</li>
            </ul>
            <p className="mt-2">
              We do <strong>not</strong> sell, rent, or trade your data to anyone.
            </p>
          </Section>

          <Section title="5. How long we keep it">
            <p>
              Registration records and payment metadata are kept for <strong>two years</strong> after the cohort ends, then permanently deleted. Anonymous analytics are kept for up to 12 months. Medical notes are deleted within 30 days of camp ending unless required for an ongoing incident report.
            </p>
          </Section>

          <Section title="6. Your rights">
            <p>Under NDPR you may at any time:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Ask for a copy of the data we hold on you or your child.</li>
              <li>Ask us to correct anything inaccurate.</li>
              <li>Ask us to delete your data (we&apos;ll comply unless we&apos;re legally required to retain it).</li>
              <li>Withdraw consent for marketing communications.</li>
            </ul>
            <p className="mt-2">
              Email any of these requests to <a className="font-semibold underline underline-offset-2 decoration-2 hover:text-aqua-deep" href="mailto:privacy@immersia.ng">privacy@immersia.ng</a> and we&apos;ll respond within 14 days.
            </p>
          </Section>

          <Section title="7. Children specifically">
            <p>
              The camp is for kids 10–17. We only collect a camper&apos;s data with the explicit consent of a parent or legal guardian completing the registration form. We do not market directly to children. Photos taken during camp are only used in cohort communications and IMMERSIA channels with parental consent given on the registration form (you can opt out at registration or by emailing us).
            </p>
          </Section>

          <Section title="8. Security">
            <p>
              Data is encrypted in transit (HTTPS) and at rest. Access is limited to the IMMERSIA team members who need it to run the cohort. We do not store any payment card data — Paystack handles that under PCI-DSS rules.
            </p>
          </Section>

          <Section title="9. Changes to this policy">
            <p>
              If we change anything material, we&apos;ll email everyone who has an active registration and update the &ldquo;Last updated&rdquo; date at the top of this page.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Privacy questions: <a className="font-semibold underline underline-offset-2 decoration-2 hover:text-aqua-deep" href="mailto:privacy@immersia.ng">privacy@immersia.ng</a>
              <br />
              General questions: <Link className="font-semibold underline underline-offset-2 decoration-2 hover:text-aqua-deep" href="/contact">/contact</Link>
            </p>
          </Section>
        </div>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link href="/register" className="btn-grass">
            Reserve a slot <span aria-hidden>→</span>
          </Link>
          <Link href="/terms" className="text-[13px] font-semibold underline underline-offset-4 decoration-2 hover:text-aqua-deep transition">
            Read the rules of conduct
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
