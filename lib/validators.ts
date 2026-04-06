export function normalizeIsraeliPhone(phone: string) {
  const cleaned = phone.replace(/\s|-/g, "");
  if (cleaned.startsWith("+972")) {
    return `0${cleaned.slice(4)}`;
  }
  if (cleaned.startsWith("972")) {
    return `0${cleaned.slice(3)}`;
  }
  return cleaned;
}

export function isValidIsraeliPhone(phone: string) {
  const normalized = normalizeIsraeliPhone(phone);
  return /^05\d{8}$/.test(normalized);
}

