const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  const t = email.trim().toLowerCase();
  return t.length > 3 && EMAIL_RE.test(t);
}
