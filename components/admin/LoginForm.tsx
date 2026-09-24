"use client";

import { useActionState } from "react";
import { loginAdmin } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, { error: "" });

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#131008] px-4">
      <form
        action={action}
        className="w-full max-w-[400px] rounded-card border border-[#6e5a2b] bg-[#1a1610] px-7 py-8"
      >
        <p className="text-[12px] font-medium tracking-[2px] text-[#9a7f3e]">
          CLASS OF 2027 GALA
        </p>
        <h1 className="mt-3 font-display text-[32px] font-medium text-[#e3c46a]">
          Bookings admin
        </h1>
        <label htmlFor="admin-password" className="mt-6 block text-[13px] text-[#9a7f3e]">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 w-full rounded-[12px] border border-[#6e5a2b] bg-[#131008] px-4 py-3 text-[16px] text-[#e8d9a8] outline-none focus:border-[#d4af37]"
        />
        {state.error && (
          <p className="mt-3 text-[14px] text-[#e0937d]">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-pill bg-[#d4af37] py-3 text-[16px] font-semibold text-[#241a06] disabled:opacity-50"
        >
          {pending ? "Checking…" : "Enter"}
        </button>
      </form>
    </main>
  );
}
