/**
 * PhoneScreen: the IMMERSIA camper "today" dashboard, sized at iPhone 14
 * native resolution (390 × 844). Used:
 *   - directly in /mock/dashboard for screenshotting at 1:1
 *   - scaled & wrapped in a bezel inside the Mentorship section
 *
 * Keep the content sparse: the empty space is half the design.
 */
export default function PhoneScreen() {
  return (
    <div className="w-[390px] h-[844px] bg-cream text-ink flex flex-col relative overflow-hidden shrink-0">
      {/* status bar */}
      <div className="flex items-center justify-between px-7 pt-3.5 pb-2 text-[12px] font-semibold">
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] tracking-tight">5G</span>
          <span className="w-5 h-2.5 rounded-[3px] border border-ink/80 relative">
            <span className="absolute inset-[2px] right-[6px] bg-ink rounded-[1px]" />
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-7 gap-5 pt-3 pb-6">
        {/* greeting */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-violet-brand/15 border-2 border-violet-brand/30 flex items-center justify-center font-display font-extrabold text-violet-brand text-[18px]">
              T
            </div>
            <h1 className="font-display font-extrabold text-[24px] leading-none">
              Hi, Tunde&nbsp;👋
            </h1>
          </div>
          <span className="text-[10px] font-bold tracking-[.18em] bg-ink text-white rounded-full px-3 py-2 whitespace-nowrap">
            DAY 6 / 21
          </span>
        </div>

        {/* progress */}
        <div>
          <div className="h-1.5 rounded-full bg-black/[.07] overflow-hidden">
            <div className="h-full bg-ink rounded-full" style={{ width: "29%" }} />
          </div>
          <div className="flex justify-between text-[10px] font-bold tracking-[.16em] opacity-50 mt-1.5">
            <span>WEEK 2 OF 4</span>
            <span>29%</span>
          </div>
        </div>

        {/* today */}
        <div className="bg-white rounded-[22px] p-5 border border-black/[.04] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-[11px] font-bold tracking-[.18em] text-violet-brand">TODAY</span>
            <span className="text-[11px] font-semibold opacity-50">WED · 5 AUG</span>
          </div>
          <ul className="flex flex-col gap-4">
            <ScheduleRow time="9:00"  title="Blender basics"     sub="with Mr. Kola" />
            <ScheduleRow time="11:30" title="VR build session"   sub="Lab 2 · headsets provided" />
            <ScheduleRow time="2:00"  title="Demo prep"          sub="with your team" />
          </ul>
        </div>

        {/* announcements */}
        <div className="bg-violet-brand/[.08] rounded-[22px] p-5 border border-violet-brand/[.18]">
          <span className="text-[11px] font-bold tracking-[.18em] text-violet-brand">ANNOUNCEMENTS</span>
          <p className="text-[14px] leading-snug mt-2">Demo Day photos go live Friday 🎉</p>
        </div>

        <div className="flex-1" />

        {/* cta */}
        <button className="w-full bg-ink text-white rounded-full py-4 font-semibold text-[14px] flex items-center justify-center gap-2">
          Submit today&apos;s work <span>→</span>
        </button>

        {/* home indicator */}
        <div className="flex justify-center -mb-1 mt-1">
          <div className="w-32 h-1 rounded-full bg-ink/30" />
        </div>
      </div>
    </div>
  );
}

function ScheduleRow({ time, title, sub }: { time: string; title: string; sub: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="font-accent font-extrabold text-[14px] w-14 shrink-0 opacity-80">{time}</span>
      <div className="min-w-0">
        <p className="font-semibold text-[14px] leading-tight">{title}</p>
        <p className="text-[12px] opacity-60 mt-0.5">{sub}</p>
      </div>
    </li>
  );
}
