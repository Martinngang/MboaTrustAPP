import NetInfo from '@react-native-community/netinfo';

// Native (iOS/Android) implementation — thin wrapper around the real
// @react-native-community/netinfo module. See netInfoCompat.web.ts for why
// this file is platform-split at all: that package has no web build, so
// OfflineQueueContext.tsx importing it directly broke Metro's web bundle for
// every screen in the app (Metro couldn't resolve the module at all for the
// web platform, not just fail at runtime).
export interface NetInfoLikeState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

export async function fetchNetInfo(): Promise<NetInfoLikeState> {
  const state = await NetInfo.fetch();
  return { isConnected: state.isConnected, isInternetReachable: state.isInternetReachable };
}

export function subscribeNetInfo(callback: (state: NetInfoLikeState) => void): () => void {
  return NetInfo.addEventListener((state) => callback({ isConnected: state.isConnected, isInternetReachable: state.isInternetReachable }));
}
