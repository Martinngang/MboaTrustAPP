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

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
if (firebaseConfigured) {
  app = initializeApp(config);
  auth = Platform.OS === 'web' ? getAuth(app) : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}

export { app as firebaseApp, auth as firebaseAuthInstance };
