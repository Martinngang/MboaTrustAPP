import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  type User,
} from 'firebase/auth';
import { firebaseAuthInstance, firebaseConfigured } from '../config/firebase';

// Real email/password auth against the same Firebase project web uses (see
// config/firebase.ts) — ported from MboaTrustFrontend/src/api/firebaseAuth.ts.
// Google and Phone sign-in are deliberately NOT implemented here: Google needs
// a platform-registered OAuth client (Android/iOS) this environment has no way
// to create, and Firebase's phone auth needs a DOM-bound reCAPTCHA that has no
// real RN equivalent without ejecting or a WebView-based package. Building
// either as a UI button that doesn't actually work would violate "don't fake
// functionality" — Email is the one method that's 100% real end-to-end here,
// so it's the only one exposed. Re-export firebaseConfigured so screens don't
// need a second import path for it.
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

/** Sends a "reset your password" email via Firebase's own hosted flow. */
export async function sendPasswordReset(email: string): Promise<void> {
  const auth = requireAuth();
  await sendPasswordResetEmail(auth, email);
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
