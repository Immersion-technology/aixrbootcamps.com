import Image from "next/image";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-cream dot-grid px-5 py-10">
      <div className="w-full max-w-[420px] frosted-glass-dark rounded-3xl p-8 sm:p-10 anim-fade-up">
        <div className="flex justify-center mb-7">
          <Image src="/logo.png" alt="IMMERSIA" width={1044} height={335} priority sizes="220px" className="h-12 w-auto" />
        </div>

        <div className="text-center mb-7">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-white/70 uppercase mb-1.5">Admin</div>
          <h1 className="font-display font-extrabold text-[28px] leading-tight">Sign in</h1>
          <p className="text-[13px] text-white/70 mt-2">Authorized staff only.</p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
