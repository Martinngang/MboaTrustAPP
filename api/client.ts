import axios from 'axios';
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
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

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
