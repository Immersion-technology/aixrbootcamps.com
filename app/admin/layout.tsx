import Link from "next/link";
import Image from "next/image";
import { getAdminFromCookie } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Middleware ensures only authenticated users reach /admin/* (except /admin/login).
  const admin = await getAdminFromCookie();

  return (
    <div className="min-h-screen flex bg-cream">
      {admin && (
        <aside className="w-60 shrink-0 bg-white/80 backdrop-blur border-r border-black/5 p-5 sticky top-0 h-screen flex flex-col">
          {/* brand block */}
          <Link href="/admin" className="frosted-glass rounded-2xl p-3 mb-6 block hover:scale-[1.02] transition">
            <Image src="/logo.png" alt="IMMERSIA admin" width={668} height={668} priority sizes="180px" className="h-8 w-auto" />
            <div className="text-[9.5px] font-bold tracking-[.22em] text-violet-brand mt-1.5 uppercase">Admin</div>
          </Link>

          <nav className="flex flex-col gap-1 text-[13px]">
            <NavLink href="/admin">Dashboard</NavLink>
            <NavLink href="/admin/analytics">Analytics</NavLink>
            <NavLink href="/admin/registrations">Registrations</NavLink>
            <NavLink href="/admin/attendance">Attendance</NavLink>
            <NavLink href="/admin/teachers">Teachers</NavLink>
            <NavLink href="/admin/waitlist">Waitlist</NavLink>
            <NavLink href="/admin/settings">Settings</NavLink>
            <NavLink href="/admin/export">Export</NavLink>
          </nav>

          <div className="mt-auto pt-4 border-t border-black/5">
            <div className="text-[10.5px] font-bold tracking-[.18em] text-neutral-500 uppercase mb-1">Signed in</div>
            <div className="text-[12.5px] font-medium truncate" title={admin.email}>{admin.name}</div>
            <form action="/api/admin/auth/logout" method="POST" className="mt-3">
              <button className="text-[11.5px] font-semibold text-neutral-500 hover:text-violet-brand transition">
                Sign out →
              </button>
            </form>
          </div>
        </aside>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-lg hover:bg-violet-brand/8 hover:text-violet-brand font-medium transition"
    >
      {children}
    </Link>
  );
}
