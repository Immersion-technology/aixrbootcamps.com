import { cn } from "@/lib/utils";

const PORTRAIT_TONES = [
  "from-[#3a86ff] via-[#5b9bff] to-[#2d2e83]",
  "from-[#fb5607] via-[#ff7a33] to-[#c2410c]",
  "from-[#ff006e] via-[#ff4f95] to-[#8338ec]",
  "from-[#047857] via-[#0f9b73] to-[#2d2e83]",
  "from-[#ffbe0b] via-[#ffd54d] to-[#fb5607]",
];

export default function TeacherPortrait({
  name,
  photoUrl,
  className,
  initialsClassName,
}: {
  name: string;
  photoUrl?: string | null;
  className?: string;
  initialsClassName?: string;
}) {
  const initials = getInitials(name);
  const tone = PORTRAIT_TONES[stableIndex(name, PORTRAIT_TONES.length)];

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[28px] bg-neutral-100 ring-1 ring-black/5",
        className
      )}
      aria-label={`${name} profile portrait`}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${tone}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,.28),transparent_44%),radial-gradient(circle_at_80%_90%,rgba(255,255,255,.12),transparent_32%)]" />
        </div>
      )}

      {photoUrl ? (
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/25 to-transparent" />
      ) : (
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <div
            className={cn(
              "rounded-full border border-white/30 bg-white/10 px-4 py-3 text-center backdrop-blur-sm",
              initialsClassName
            )}
          >
            <div className="font-bubble text-[clamp(22px,3vw,34px)] leading-none text-white drop-shadow-[0_2px_12px_rgba(0,0,0,.35)]">
              {initials}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function stableIndex(value: string, modulo: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return modulo === 0 ? 0 : hash % modulo;
}
