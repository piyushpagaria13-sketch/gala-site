/** Singapore local numbers are 8 digits. +65 is the country code, not part of that count. */

const LOCAL_DIGITS = 8;

function hasCountryCode(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("+65") || trimmed.startsWith("+ 65");
}

export function singaporeLocalDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (hasCountryCode(value) && digits.startsWith("65")) {
    return digits.slice(2);
  }
  return digits;
}

export function isValidSingaporePhone(value: string | undefined): boolean {
  return singaporeLocalDigits(value ?? "").length === LOCAL_DIGITS;
}

export function singaporePhoneTooLong(value: string): boolean {
  return singaporeLocalDigits(value).length > LOCAL_DIGITS;
}
