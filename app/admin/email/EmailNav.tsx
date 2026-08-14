import Link from "next/link";

/** Sub-navigation shared by the three email screens. */
export default function EmailNav({
  active,
  suppressionCount,
}: {
  active: "campaigns" | "templates" | "suppressions";
  suppressionCount?: number;
}) {
  const tabs = [
    { key: "campaigns", href: "/admin/email", label: "Campaigns" },
    { key: "templates", href: "/admin/email/templates", label: "Templates" },
    {
      key: "suppressions",
      href: "/admin/email/suppressions",
      label: suppressionCount !== undefined ? `Unsubscribed (${suppressionCount})` : "Unsubscribed",
    },
  ] as const;

  return (
    <div className="flex flex-wrap gap-1.5 mb-5">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`text-[12.5px] font-semibold px-4 py-2 rounded-full transition ${
            active === t.key
              ? "bg-neutral-900 text-white"
              : "bg-white border border-black/[.08] text-neutral-600 hover:text-violet-brand hover:border-violet-brand"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
