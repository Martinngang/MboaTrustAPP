import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Wifi, WifiOff, CheckCircle2, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';

interface Props {
  isOffline?: boolean;
  queuedItemsCount?: number;
  onSyncNow?: () => void;
}

export function OfflineSyncBanner({
  isOffline = false,
  queuedItemsCount = 0,
  onSyncNow,
}: Props) {
  const { colors } = useTheme();

  if (!isOffline && queuedItemsCount === 0) return null;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 8,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 14,
        backgroundColor: isOffline ? '#fef3c7' : '#dcfce7',
        borderWidth: 1,
        borderColor: isOffline ? '#fde047' : '#86efac',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
        {isOffline ? <WifiOff size={16} color="#854d0e" /> : <CheckCircle2 size={16} color="#15803d" />}
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 11, color: isOffline ? '#854d0e' : '#15803d' }}>
            {isOffline ? 'Working Offline' : 'Connected & Synced'}
          </Text>
          <Text style={{ fontFamily: FONT.sans, fontSize: 10, color: isOffline ? '#a16207' : '#166534' }}>
            {isOffline
              ? `${queuedItemsCount} photo proofs queued on device`
              : 'All milestone updates synced with Cameroon server'}
          </Text>
        </View>
      </View>

      {isOffline && onSyncNow && (
        <Pressable
          onPress={onSyncNow}
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: '#854d0e',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <RefreshCw size={11} color="#fff" />
          <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 10, color: '#fff' }}>Sync</Text>
        </Pressable>
      )}
    </View>
  );
}
