// Ported 1:1 from MboaTrustFrontend/src/api/authErrors.ts — same Firebase
// error codes, same copy, so a user hitting the same failure sees the same
// message regardless of which client they're on.
const MESSAGES: Record<string, string> = {
  'auth/invalid-email': "That email address doesn't look right.",
  'auth/user-disabled': 'This account has been disabled. Contact support for help.',
  'auth/user-not-found': 'No account found with that email. Check the address or sign up.',
  'auth/wrong-password': 'Incorrect password. Try again or reset it below.',
  'auth/invalid-credential': 'Incorrect email or password. Try again or reset your password.',
  'auth/invalid-login-credentials': 'Incorrect email or password. Try again or reset your password.',
  'auth/email-already-in-use': 'An account already exists with that email.',
  'auth/weak-password': 'Choose a stronger password — at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error — check your connection and try again.',
  'auth/requires-recent-login': 'Please sign in again to complete this action.',
  'auth/missing-password': 'Enter a password.',
  'auth/operation-not-allowed': "This sign-in method isn't enabled yet for this app. Please try another method or contact support.",
  'auth/unauthorized-domain': "Sign-in isn't available from this address yet. Please contact support.",
  'auth/internal-error': 'Something went wrong on our end. Please try again in a moment.',
};

export function firebaseErrorCode(err: unknown): string | null {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: unknown }).code;
    return typeof code === 'string' && code.startsWith('auth/') ? code : null;
  }
  return null;
}

export function friendlyAuthError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const code = firebaseErrorCode(err);
  if (code && MESSAGES[code]) return MESSAGES[code];
  return fallback;
}
