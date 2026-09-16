import { Platform } from 'react-native';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
// @ts-ignore — getReactNativePersistence exists at runtime (firebase/auth's RN
// entry point) but isn't in the published web type defs for this SDK version.
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mirrors MboaTrustFrontend/src/firebase.ts — same project, same public
// client config (safe to ship, not secrets). The one real difference: web
// (both the actual web app AND this app's `expo start --web` test target)
// gets browser localStorage persistence automatically via getAuth(); real
// iOS/Android need it wired explicitly via AsyncStorage, or signed-in state
// silently wouldn't survive an app restart.
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

// Raw config, re-exported for FirebaseRecaptchaVerifierModal (phone auth),
// which needs the same public client config passed to it directly rather
// than reading it off an already-initialized Auth instance.
export { config as firebaseWebConfig };

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
if (firebaseConfigured) {
  app = initializeApp(config);
  auth = Platform.OS === 'web' ? getAuth(app) : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

  // expo-firebase-recaptcha's web implementation (components/PhoneRecaptchaModal.tsx
  // renders it on any screen calling startPhoneSignIn, e.g. every Signup/Login
  // screen) is built on the legacy namespaced/compat SDK, not the modular one
  // above — it calls the global `firebase.auth()`, which has its own separate
  // app registry. Without this, that registry never gets a '[DEFAULT]' app and
  // the compat SDK throws "No Firebase App '[DEFAULT]' has been created"
  // (app-compat/no-app) the instant the modal mounts on web, crashing the
  // whole screen. Native iOS/Android don't hit this — that platform's
  // FirebaseRecaptchaVerifierModal renders a WebView-hosted challenge page
  // instead of calling the compat SDK directly in this process.
  if (Platform.OS === 'web') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const firebaseCompatModule = require('firebase/compat/app');
    require('firebase/compat/auth');
    // Metro's CJS interop wraps this as { default: firebaseNamespace } rather
    // than handing back the bare namespace object directly.
    const firebaseCompat = firebaseCompatModule.default ?? firebaseCompatModule;
    if (!firebaseCompat.apps?.length) {
      firebaseCompat.initializeApp(config);
    }
  }
}

export { app as firebaseApp, auth as firebaseAuthInstance };
