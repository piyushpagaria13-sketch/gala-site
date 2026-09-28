/** Contact email on the first booking step. Must look like name@domain.tld. */

export function isValidEmail(value: string | undefined): boolean {
  const trimmed = (value ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function emailLooksInvalid(value: string): boolean {
  return value.trim().length > 0 && !isValidEmail(value);
}
