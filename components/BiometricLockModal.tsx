import React, { useState } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { ShieldCheck, Delete, Fingerprint, Lock, X } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useToast } from './Toast';

interface Props {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function BiometricLockModal({
  visible,
  title = 'Authorize Escrow Security PIN',
  subtitle = 'Enter 4-digit PIN or use Biometrics',
  onSuccess,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const { show: showToast } = useToast();
  const [pin, setPin] = useState('');

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => {
          showToast({ title: 'PIN Authenticated', description: 'Authorized with bank-grade security.', tone: 'success' });
          onSuccess();
          setPin('');
          onClose();
        }, 250);
      }
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
  };

  const handleBiometric = () => {
    showToast({ title: 'Face ID / Fingerprint Verified', description: 'Biometric authorization successful.', tone: 'success' });
    onSuccess();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View
          style={{
            width: '100%',
            maxWidth: 320,
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 22,
            alignItems: 'center',
            gap: 16,
          }}
        >
          {/* Lock Icon */}
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: colors.forestDark,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={22} color="#fff" />
          </View>

          {/* Title */}
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={{ fontFamily: FONT.serifBold, fontSize: 16, color: colors.ink, textAlign: 'center' }}>
              {title}
            </Text>
            <Text style={{ fontFamily: FONT.sans, fontSize: 11, color: colors.inkMuted, textAlign: 'center' }}>
              {subtitle}
            </Text>
          </View>

          {/* 4 Dots */}
          <View style={{ flexDirection: 'row', gap: 14, marginVertical: 4 }}>
            {[0, 1, 2, 3].map((idx) => {
              const filled = pin.length > idx;
              return (
                <View
                  key={idx}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    borderWidth: 2,
                    borderColor: colors.forest,
                    backgroundColor: filled ? colors.forest : 'transparent',
                  }}
                />
              );
            })}
          </View>

          {/* Keypad */}
          <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <Pressable
                key={d}
                onPress={() => handleDigit(d)}
                style={{
                  width: 72,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: colors.parchment,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: FONT.mono, fontSize: 18, fontWeight: '700', color: colors.ink }}>
                  {d}
                </Text>
              </Pressable>
            ))}

            {/* Biometric */}
            <Pressable
              onPress={handleBiometric}
              style={{
                width: 72,
                height: 52,
                borderRadius: 16,
                backgroundColor: colors.forest + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Fingerprint size={20} color={colors.forest} />
            </Pressable>

            {/* Zero */}
            <Pressable
              onPress={() => handleDigit('0')}
              style={{
                width: 72,
                height: 52,
                borderRadius: 16,
                backgroundColor: colors.parchment,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: FONT.mono, fontSize: 18, fontWeight: '700', color: colors.ink }}>
                0
              </Text>
            </Pressable>

            {/* Delete */}
            <Pressable
              onPress={handleDelete}
              style={{
                width: 72,
                height: 52,
                borderRadius: 16,
                backgroundColor: colors.parchment,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Delete size={18} color={colors.inkMuted} />
            </Pressable>
          </View>

          {/* Cancel */}
          <Pressable onPress={onClose} style={{ marginTop: 4 }}>
            <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 12, color: colors.inkSubtle }}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
