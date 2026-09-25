import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Incremental Reach Calculator" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <svg viewBox="0 0 32 32" className="mx-auto mb-3 h-12 w-12" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill="#1B2B3C" />
            <circle cx="13" cy="16" r="7" fill="none" stroke="#378ADD" strokeWidth="2.5" />
            <circle cx="19" cy="16" r="7" fill="none" stroke="#1D9E75" strokeWidth="2.5" />
          </svg>
          <h1 className="text-xl font-semibold text-white">Incremental Reach Calculator</h1>
          <p className="mt-1 text-sm text-slate-300">Cross-media audience deduplication · Total Overlap Model</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
