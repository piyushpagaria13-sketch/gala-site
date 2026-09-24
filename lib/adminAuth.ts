import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "gala_admin";
/** A few days. */
export const ADMIN_MAX_AGE = 60 * 60 * 24 * 3;

export function expectedAdminToken(
  password = process.env.ADMIN_PASSWORD ?? "",
): string {
  if (!password) return "";
  return createHmac("sha256", password).update("gala-admin-v1").digest("hex");
}

export function passwordsMatch(
  presented: string,
  expected = process.env.ADMIN_PASSWORD ?? "",
): boolean {
  if (!expected || !presented) return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function adminCookieMatches(value: string | undefined | null): boolean {
  const expected = expectedAdminToken();
  if (!expected || !value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Null when the cookie is a valid admin session. Routes return this body otherwise. */
export function adminGuard(
  cookie: string | undefined | null,
): { status: number; body: { error: string } } | null {
  if (adminCookieMatches(cookie)) return null;
  return { status: 401, body: { error: "unauthorized" } };
}
