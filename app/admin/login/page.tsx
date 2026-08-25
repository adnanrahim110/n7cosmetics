import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PasswordInput from "@/components/admin/PasswordInput";
import { getCurrentAdministrator } from "@/lib/auth/session";
import { loginAction } from "./actions";

export const metadata: Metadata = { title: "Admin sign in | N7 Cosmetics" };

export default async function LoginPage() {
  if (await getCurrentAdministrator()) redirect("/admin");

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f5f2] px-5 text-zinc-950">
      <section className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">N7 Cosmetics</p>
        <h1 className="mt-3 font-body text-2xl font-semibold tracking-tight text-zinc-950">Admin sign in</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">Use your administrator account to manage the store.</p>

        <form action={loginAction} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-zinc-700">
            Email
            <input
              autoComplete="username"
              className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-950 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
              maxLength={190}
              name="email"
              required
              type="email"
            />
          </label>
          <PasswordInput autoComplete="current-password" label="Password" maxLength={128} name="password" required />
          <div className="text-right"><Link className="text-sm font-medium text-amber-800 hover:text-amber-950" href="/admin/forgot-password">Forgot password?</Link></div>
          <button className="w-full rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
