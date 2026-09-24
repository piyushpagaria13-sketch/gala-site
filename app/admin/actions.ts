"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  ADMIN_MAX_AGE,
  expectedAdminToken,
  passwordsMatch,
} from "@/lib/adminAuth";

export async function loginAdmin(
  _prev: { error: string },
  formData: FormData,
): Promise<{ error: string }> {
  const password = String(formData.get("password") ?? "");
  if (!passwordsMatch(password)) return { error: "Wrong password" };
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, expectedAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
  redirect("/admin");
}
