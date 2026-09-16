import type { ConfirmationResult } from 'firebase/auth';

// Mirrors MboaTrustFrontend/src/api/phoneAuthState.ts — a Firebase
// ConfirmationResult can't be serialized into navigation params or storage;
// this survives the Signup/Login → OTP navigation only because React
// Navigation doesn't reload the JS context. Cleared once used.
let pending: ConfirmationResult | null = null;
let pendingPhone: string | null = null;

export function setPendingPhoneConfirmation(c: ConfirmationResult | null) {
  pending = c;
}
export function getPendingPhoneConfirmation(): ConfirmationResult | null {
  return pending;
}

/** The E.164 number a code was just sent to — OTPScreen displays it and
 * reuses it if the user asks to resend. */
export function setPendingPhone(phone: string | null) {
  pendingPhone = phone;
}
export function getPendingPhone(): string | null {
  return pendingPhone;
}

/** Mirrors MboaTrustFrontend/src/screens/Onboarding.tsx's `toE164`. */
export function toE164(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, '');
  const lastPlus = cleaned.lastIndexOf('+');
  return lastPlus >= 0 ? cleaned.slice(lastPlus) : `+${cleaned}`;
}
