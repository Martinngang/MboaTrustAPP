import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useOfflineQueue } from '../context/OfflineQueueContext';

/**
 * Mobile port of MboaTrustFrontend/src/components/ConnectivityBar.tsx —
 * lives in Header so it's visible on every screen, not just Home.
 * Deliberately unobtrusive when there's nothing to report (online, empty
 * queue) — just a small dot — and only grows into a labeled pill with a tap
 * to retry when there's something a field worker actually needs to know
 * about (offline, or evidence still waiting to sync).
 */
export function ConnectivityIndicator() {
  const { statusTones } = useTheme();
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineQueue();

  if (isOnline && pendingCount === 0) {
    return (
      <View
        accessible
        accessibilityLabel="Online"
        style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusTones.success.text }}
      />
    );
  }

  const tone = isOnline ? statusTones.warning : statusTones.error;
  const label = !isOnline ? 'Offline' : isSyncing ? 'Syncing' : `${pendingCount} pending`;
  const canRetry = isOnline && pendingCount > 0 && !isSyncing;

  return (
    <Pressable
      onPress={canRetry ? syncNow : undefined}
      accessibilityRole={canRetry ? 'button' : 'text'}
      accessibilityLabel={!isOnline ? 'Offline — will sync automatically' : label}
      hitSlop={6}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: tone.bg,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tone.text }} />
      <Text style={{ fontFamily: FONT.mono, color: tone.text, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {label}
      </Text>
    </Pressable>
  );
}
