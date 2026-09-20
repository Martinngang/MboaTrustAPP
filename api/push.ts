import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
import type * as Notifications from 'expo-notifications';
import { api } from './client';

// `expo-notifications` must NOT be imported at module scope. Its index
// re-exports `DevicePushTokenAutoRegistration.fx`, a side-effect module that
// calls `addPushTokenListener()` as it loads — which calls
// `warnOfExpoGoPushUsage()`, and that *throws* (not warns) on Android inside
// Expo Go since SDK 53. A static import therefore crashes the whole app at
// startup with "[runtime not ready]" before anything renders, even though
// every call site below is already permission-guarded. Loading it lazily,
// only once we know we're not in Expo Go, keeps the app bootable there while
// leaving real builds completely unchanged.
const loadNotifications = async () => import('expo-notifications');

// Ported from MboaTrustFrontend/src/api/push.ts's useSetDeviceTokenMutation
// — but web's version actually POSTs the wrong field name (`fcmDeviceToken`)
// against a backend route validated as `z.object({ token: z.string().min(1) })`
// (see MboaTrustBackend/src/routes/userRoutes.js), so every call web makes
// fails validation silently. This sends the field the backend actually
// validates and reads (userController.setDeviceToken reads `req.body.token`).
export function useSetDeviceTokenMutation() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post<{ success: true }>('/users/me/device-token', { token });
      return data;
    },
  });
}

/** Push tokens don't work on simulators/emulators (and this module has no
 * meaningful behavior in the web preview build) — mirrors web's own
 * isPushAvailable() gate that hides the toggle entirely rather than showing
 * one that would just fail every time it's tapped. Expo Go is excluded for
 * the same reason: it dropped remote push in SDK 53, so the toggle could
 * never do anything but fail there (and see loadNotifications above — this
 * gate is also what keeps the module from ever being imported in Expo Go). */
export function isPushAvailable(): boolean {
  return Platform.OS !== 'web' && Device.isDevice && !isRunningInExpoGo();
}

/** The backend's notificationService.js delivers push via Firebase Admin
 * SDK's `admin.messaging().send({ token: user.fcmDeviceToken })` — a direct
 * FCM send, not Expo's push-relay service. On Android, expo-notifications'
 * raw device token *is* a real FCM registration token, so that send call
 * works unmodified. On iOS, the raw device token is an APNs token; Admin
 * SDK's direct `.send()` can't deliver to that without the app also
 * integrating `@react-native-firebase/messaging` to exchange it for a real
 * FCM registration token first — a separate, larger native-dependency
 * addition. Settings surfaces this honestly (Android-only real delivery)
 * rather than claiming full cross-platform support a toggle can't back up. */
export function isPushFullySupported(): boolean {
  return Platform.OS === 'android';
}

export async function getPushPermissionStatus(): Promise<Notifications.PermissionStatus | null> {
  if (!isPushAvailable()) return null;
  const Notifications = await loadNotifications();
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Requests OS push permission (if not already decided) and, once granted,
 * returns the raw native device push token (see isPushFullySupported's
 * comment for why this must be the raw token, not an Expo push token).
 * Returns null (never throws) on any failure — denied permission, simulator,
 * provider error — so callers can show a plain "couldn't enable push"
 * message rather than an unhandled rejection, matching web's requestPushToken.
 */
export async function requestPushToken(): Promise<string | null> {
  if (!isPushAvailable()) return null;
  try {
    const Notifications = await loadNotifications();
    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;
    if (finalStatus !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }
    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const result = await Notifications.getDevicePushTokenAsync();
    return typeof result.data === 'string' ? result.data : null;
  } catch (err) {
    console.warn('[push] failed to get device push token', err);
    return null;
  }
}
