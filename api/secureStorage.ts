import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Session-identifying values (the dev-bypass user id today, a real Firebase
 * refresh/ID token later) live here, not in AsyncStorage — AsyncStorage is
 * unencrypted flat storage on both platforms, fine for UI preferences
 * (theme, last-picked role) but not for anything that authenticates a
 * session. expo-secure-store backs onto iOS Keychain / Android Keystore.
 *
 * SecureStore has no web implementation at all (throws if called), so the
 * Expo-web target used for this sandbox's testing falls back to
 * AsyncStorage there — real device builds (iOS/Android) always get the
 * genuine encrypted store. This mirrors a common, well-known Expo pattern,
 * not a security downgrade for the platforms that matter.
 */
const isWeb = Platform.OS === 'web';

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (isWeb) {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
