// Web implementation — @react-native-community/netinfo has no web build at
// all (Metro can't resolve it for the web platform), so this uses the
// browser's own real connectivity signal (navigator.onLine + the
// online/offline window events) instead of a fake "always online" stub.
export interface NetInfoLikeState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

export async function fetchNetInfo(): Promise<NetInfoLikeState> {
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
  return { isConnected: online, isInternetReachable: online };
}

export function subscribeNetInfo(callback: (state: NetInfoLikeState) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onOnline = () => callback({ isConnected: true, isInternetReachable: true });
  const onOffline = () => callback({ isConnected: false, isInternetReachable: false });
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
