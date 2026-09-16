import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  updateProfile as updateFirebaseProfile,
  type ApplicationVerifier,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import { firebaseAuthInstance, firebaseConfigured } from '../config/firebase';

// Real email/password/Google/Phone auth against the same Firebase project web
// uses (see config/firebase.ts) — ported from
// MboaTrustFrontend/src/api/firebaseAuth.ts. Google here takes an ID token
// (obtained via expo-auth-session's Google provider — see
// components/GoogleAuthButton.tsx — instead of web's DOM `signInWithPopup`,
// which has no RN equivalent) and exchanges it for a Firebase credential.
// Phone takes an `ApplicationVerifier` supplied by the calling screen (a ref
// to a mounted `FirebaseRecaptchaVerifierModal` — see
// components/PhoneRecaptchaModal.tsx — standing in for web's DOM-bound
// invisible reCAPTCHA, which also has no RN equivalent). Re-export
// firebaseConfigured so screens don't need a second import path for it.
export { firebaseConfigured };

function requireAuth() {
  if (!firebaseAuthInstance) throw new Error('Firebase is not configured — set EXPO_PUBLIC_FIREBASE_* env vars first');
  return firebaseAuthInstance;
}

export function onFirebaseAuthChange(callback: (user: User | null) => void): () => void {
  if (!firebaseConfigured || !firebaseAuthInstance) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(firebaseAuthInstance, callback);
}

export async function signUpWithEmail(email: string, password: string, fullName?: string): Promise<User> {
  const auth = requireAuth();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (fullName) {
    // Sets the Firebase profile immediately so the name is available locally
    // right away; the backend still gets it explicitly via PATCH /users/me
    // (see screens/onboarding/SignupScreen.tsx) rather than waiting on the ID
    // token to pick up the new claim on its next refresh.
    await updateFirebaseProfile(result.user, { displayName: fullName });
  }
  return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const auth = requireAuth();
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/** Exchanges a Google ID token (from expo-auth-session's
 * `useIdTokenAuthRequest`) for a Firebase session — the RN equivalent of
 * web's `signInWithGoogle`, which uses a DOM popup instead. */
export async function signInWithGoogleIdToken(idToken: string): Promise<User> {
  const auth = requireAuth();
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

/** Kicks off real phone sign-in — Firebase texts a code to `phoneNumber`
 * (E.164 format, e.g. "+237677234891"). `verifier` is a ref to a mounted
 * `FirebaseRecaptchaVerifierModal` (components/PhoneRecaptchaModal.tsx). */
export async function startPhoneSignIn(phoneNumber: string, verifier: ApplicationVerifier): Promise<ConfirmationResult> {
  const auth = requireAuth();
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

export async function confirmPhoneCode(confirmation: ConfirmationResult, code: string): Promise<User> {
  const result = await confirmation.confirm(code);
  return result.user;
}

/** Sends a "reset your password" email via Firebase's own hosted flow. */
export async function sendPasswordReset(email: string): Promise<void> {
  const auth = requireAuth();
  await sendPasswordResetEmail(auth, email);
}

/** Adds Google as an additional sign-in method to the currently signed-in
 * account (e.g. a phone-first user adding Google from Settings). Takes an
 * ID token (from expo-auth-session, see components/GoogleAuthButton.tsx)
 * rather than web's DOM popup, which RN has no equivalent for. Throws
 * `auth/credential-already-in-use` if that Google account is already tied
 * to a different Mboa Trust account — same as web's linkGoogleToCurrentUser. */
export async function linkGoogleToCurrentUser(idToken: string): Promise<User> {
  const auth = requireAuth();
  if (!auth.currentUser) throw new Error('No signed-in user to link to');
  const result = await linkWithCredential(auth.currentUser, GoogleAuthProvider.credential(idToken));
  return result.user;
}

/** Adds email + password as an additional sign-in method to the currently
 * signed-in account. Mirrors web's linkEmailPasswordToCurrentUser exactly. */
export async function linkEmailPasswordToCurrentUser(email: string, password: string): Promise<User> {
  const auth = requireAuth();
  if (!auth.currentUser) throw new Error('No signed-in user to link to');
  const credential = EmailAuthProvider.credential(email, password);
  const result = await linkWithCredential(auth.currentUser, credential);
  return result.user;
}

export async function firebaseSignOut(): Promise<void> {
  if (!firebaseAuthInstance) return;
  await signOut(firebaseAuthInstance);
}

export function getCurrentFirebaseUser(): User | null {
  return firebaseAuthInstance?.currentUser ?? null;
}

export async function getCurrentIdToken(forceRefresh = false): Promise<string | null> {
  const user = firebaseAuthInstance?.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}
