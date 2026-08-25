import Link from "next/link";
import PasswordInput from "@/components/admin/PasswordInput";
import { resetPasswordAction } from "./actions";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const query = await searchParams;
  const hasToken = Boolean(query.token);
  return <main className="grid min-h-screen place-items-center bg-[#f6f5f2] px-5 text-zinc-950"><section className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">N7 Cosmetics</p><h1 className="mt-3 font-body text-2xl font-semibold tracking-tight">Reset password</h1>{hasToken ? <form action={resetPasswordAction} className="mt-6 space-y-4"><input name="token" type="hidden" value={query.token} /><PasswordInput autoComplete="new-password" label="New password" maxLength={128} minLength={12} name="password" required /><PasswordInput autoComplete="new-password" label="Confirm new password" maxLength={128} minLength={12} name="passwordConfirmation" required /><button className="w-full rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white" type="submit">Reset password</button></form> : <p className="mt-4 text-sm leading-6 text-zinc-500">Request a new link to reset your password.</p>}<Link className="mt-5 block text-center text-sm font-medium text-amber-800" href={hasToken ? "/admin/login" : "/admin/forgot-password"}>{hasToken ? "Back to sign in" : "Request reset link"}</Link></section></main>;
}
