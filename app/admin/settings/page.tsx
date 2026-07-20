import { connectDB } from "@/lib/db";
import { getSetting, SETTING_KEYS } from "@/models/Setting";
import { CAMP_START, CAMP_END } from "@/lib/site";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

const DEFAULT_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL ?? "registrations@immersia.ng";

export default async function SettingsPage() {
  await connectDB();

  // Read each operational setting with the SAME canonical default the rest of the app
  // uses (public config route, pricing, site), so the admin always sees the value that's
  // actually in force — never a blank field just because a key hasn't been persisted yet.
  // Prices are configured via env (lib/pricing.ts) and are not editable here.
  const [capacity, campStart, campEnd, alertEmail] = await Promise.all([
    getSetting<number>(SETTING_KEYS.CAPACITY, 50),
    getSetting<string>(SETTING_KEYS.CAMP_START_DATE, CAMP_START),
    getSetting<string>(SETTING_KEYS.CAMP_END_DATE, CAMP_END),
    getSetting<string>(SETTING_KEYS.ADMIN_ALERT_EMAIL, DEFAULT_ALERT_EMAIL),
  ]);

  const initial = {
    [SETTING_KEYS.CAPACITY]: capacity,
    [SETTING_KEYS.CAMP_START_DATE]: campStart,
    [SETTING_KEYS.CAMP_END_DATE]: campEnd,
    [SETTING_KEYS.ADMIN_ALERT_EMAIL]: alertEmail,
  };

  return (
    <div className="p-6 sm:p-10 lg:p-12 max-w-3xl">
      <div className="mb-9">
        <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-1.5">Cohort 01</div>
        <h1 className="font-display font-extrabold uppercase text-[clamp(28px,3.4vw,40px)] leading-[.95] tracking-tight">
          Settings
        </h1>
        <p className="text-[13.5px] text-neutral-600 mt-3 max-w-[480px]">
          Edit cohort dates and capacity. Changes save automatically when you click out of each field.
          Prices are set via environment variables — see the Pricing note below.
        </p>
      </div>

      <SettingsForm initial={initial} />
    </div>
  );
}
