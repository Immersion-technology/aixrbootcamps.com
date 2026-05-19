import { connectDB } from "@/lib/db";
import { Setting, SETTING_KEYS } from "@/models/Setting";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await connectDB();
  const all = await Setting.find({}).lean();
  const map: Record<string, unknown> = {};
  for (const s of all) map[s.key] = s.value;

  const initial = {
    [SETTING_KEYS.EARLY_BIRD_CUTOFF]: (map[SETTING_KEYS.EARLY_BIRD_CUTOFF] as string) ?? "",
    [SETTING_KEYS.CAPACITY]: (map[SETTING_KEYS.CAPACITY] as number) ?? 50,
    [SETTING_KEYS.EARLY_BIRD_PRICE]: (map[SETTING_KEYS.EARLY_BIRD_PRICE] as number) ?? 8000000,
    [SETTING_KEYS.REGULAR_PRICE]: (map[SETTING_KEYS.REGULAR_PRICE] as number) ?? 10000000,
    [SETTING_KEYS.LAPTOP_RENTAL_PRICE]: (map[SETTING_KEYS.LAPTOP_RENTAL_PRICE] as number) ?? 2000000,
    [SETTING_KEYS.CAMP_START_DATE]: (map[SETTING_KEYS.CAMP_START_DATE] as string) ?? "",
    [SETTING_KEYS.CAMP_END_DATE]: (map[SETTING_KEYS.CAMP_END_DATE] as string) ?? "",
    [SETTING_KEYS.ADMIN_ALERT_EMAIL]: (map[SETTING_KEYS.ADMIN_ALERT_EMAIL] as string) ?? "",
  };

  return (
    <div className="p-6 sm:p-10 lg:p-12 max-w-3xl">
      <div className="mb-9">
        <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-1.5">Cohort 01</div>
        <h1 className="font-display font-extrabold uppercase text-[clamp(28px,3.4vw,40px)] leading-[.95] tracking-tight">
          Settings
        </h1>
        <p className="text-[13.5px] text-neutral-600 mt-3 max-w-[480px]">
          Edit pricing, dates and capacity. Changes save automatically when you click out of each field.
        </p>
      </div>

      <SettingsForm initial={initial} />
    </div>
  );
}
