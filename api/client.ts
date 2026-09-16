import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { firebaseConfigured } from './firebaseAuth';
import { getCurrentIdToken } from './firebaseAuth';

/**
 * Dev-bypass bridge — mirrors MboaTrustFrontend/src/api/client.ts exactly. Real
 * phone/Google sign-in isn't wired up on web either yet (see backend's
 * devController.js comment), so mobile starts from the same DEV_AUTH_BYPASS path
 * the web app actually runs on today. `firebaseConfigured` stays false until a
 * real native Firebase config is added — nothing else needs to change when it is,
 * since this interceptor already prefers a real token over the dev header.
 */
let currentDevUserId: string | null = null;
export function setDevUserId(id: string | null) {
  currentDevUserId = id;
}
export function getDevUserId(): string | null {
  return currentDevUserId;
}

// Same env var name pattern as web (VITE_API_BASE_URL) but Expo's public-env
// convention (EXPO_PUBLIC_*) — see .env. No relative-URL fallback like web's
// vite proxy: RN has no dev-server proxy, so this must be an absolute URL.
//
// That absolute URL used to be a hardcoded LAN IP in .env, which broke every
// time the dev machine moved between home wifi / office wifi / phone hotspot:
// the IP it was pinned to simply stopped existing. Metro already knows the
// right address — the device is talking to it over that exact address right
// now — so in development we derive the API host from the dev server's host
// and only swap the port. Nothing to edit when the network changes.

/** The port the backend listens on (MboaTrustBackend's env.port). */
const DEV_API_PORT = process.env.EXPO_PUBLIC_API_PORT || '5000';

/**
 * The host the app was loaded from, or null if it can't be determined.
 * - Web (including `expo start --web`): the browser's own hostname.
 * - Dev client / Expo Go: Metro's `hostUri`, e.g. "192.168.1.232:8082".
 *   `debuggerHost` is the older Expo Go field, kept as a fallback.
 * - Production standalone build: no dev server, so null — production must
 *   set EXPO_PUBLIC_API_BASE_URL, which takes priority below anyway.
 */
function devServerHost(): string | null {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.location.hostname : null;
  }
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  const host = typeof hostUri === 'string' ? hostUri.split(':')[0] : null;
  // `expo start --tunnel` serves Metro from an *.exp.direct proxy that does
  // NOT forward our API, so deriving from it would point at a host with no
  // backend on it. Give up instead and let the env var / localhost decide.
  if (!host || host.endsWith('.exp.direct')) return null;
  return host;
}

function resolveApiBaseUrl(): string {
  // An explicit value always wins: that's how a production build (EAS env)
  // and any deliberate "point at a remote API" override are expressed.
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicit) return explicit;
  const host = devServerHost();
  if (host) return `http://${host}:${DEV_API_PORT}/api/v1`;
  // No explicit URL and no dev server to derive from. In development that's
  // a simulator on the same machine, where localhost is right. In a release
  // build it means EXPO_PUBLIC_API_BASE_URL was never set for the build
  // profile (see eas.json) — localhost is the device itself, so every
  // request will fail. Say so loudly rather than shipping a silent 100%
  // failure; the same "a fallback that looks like real data" trap as
  // fetchBidCount's catch-and-return-0.
  if (!__DEV__) {
    console.error(
      '[api] EXPO_PUBLIC_API_BASE_URL is not set in this build — falling back ' +
        'to localhost, which cannot reach any backend from a real device. Set ' +
        'it in the eas.json build profile.',
    );
  }
  return `http://localhost:${DEV_API_PORT}/api/v1`;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use(async (config) => {
  const idToken = firebaseConfigured ? await getCurrentIdToken().catch(() => null) : null;
  config.headers = config.headers ?? ({} as any);
  if (idToken) {
    (config.headers as any).Authorization = `Bearer ${idToken}`;
  } else if (currentDevUserId) {
    (config.headers as any)['x-dev-user-id'] = currentDevUserId;
  }
  return config;
});

/** A client-generated unique string per real user action, for the backend's
 * money-moving idempotency guard — no crypto.randomUUID() on RN without a
 * polyfill, and the backend only requires uniqueness, not UUID format. */
export function newIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface ApiErrorShape {
  error?: { message?: string };
}

export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorShape | undefined;
    return body?.error?.message || err.message || fallback;
  }
  return fallback;
}
