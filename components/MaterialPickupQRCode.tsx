import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
import { QrCode, Check, Copy, X, PackageCheck } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { fmt } from './fmt';
import { PillButton } from './PillButton';
import { useToast } from './Toast';

interface Props {
  visible: boolean;
  orderNumber: string;
  projectName: string;
  quincaillerieName: string;
  totalAmount: number;
  items: { name: string; quantity: number; unit: string }[];
  onClose: () => void;
}

export function MaterialPickupQRCode({
  visible,
  orderNumber,
  projectName,
  quincaillerieName,
  totalAmount,
  items,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const { show: showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const verificationCode = `MB-PICKUP-${orderNumber.replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase()}`;

  const copyCode = () => {
    setCopied(true);
    showToast({ title: 'Code Copied', description: verificationCode, tone: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ width: '100%', maxWidth: 360, backgroundColor: colors.surface, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.parchmentDark }}>
          {/* Header */}
          <View style={{ padding: 16, backgroundColor: colors.forestDark, alignItems: 'center', position: 'relative' }}>
            <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Material Pickup Voucher
            </Text>
            <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 17, marginTop: 2 }}>
              {quincaillerieName}
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
              {projectName}
            </Text>

            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} color="#fff" />
            </Pressable>
          </View>

          {/* Visual QR Code Card */}
          <View style={{ padding: 20, alignItems: 'center', backgroundColor: colors.parchment }}>
            <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 2, borderColor: colors.forest, borderStyle: 'dashed', alignItems: 'center' }}>
              <Svg width={160} height={160} viewBox="0 0 180 180">
                <Rect width="180" height="180" fill="#FFFFFF" rx="8" />
                {/* Position Markers */}
                <Rect x="15" y="15" width="45" height="45" fill="#0A5B3D" rx="6" />
                <Rect x="23" y="23" width="29" height="29" fill="#FFFFFF" rx="4" />
                <Rect x="29" y="29" width="17" height="17" fill="#0A5B3D" rx="2" />

                <Rect x="120" y="15" width="45" height="45" fill="#0A5B3D" rx="6" />
                <Rect x="128" y="23" width="29" height="29" fill="#FFFFFF" rx="4" />
                <Rect x="134" y="29" width="17" height="17" fill="#0A5B3D" rx="2" />

                <Rect x="15" y="120" width="45" height="45" fill="#0A5B3D" rx="6" />
                <Rect x="23" y="128" width="29" height="29" fill="#FFFFFF" rx="4" />
                <Rect x="29" y="134" width="17" height="17" fill="#0A5B3D" rx="2" />

                {/* Matrix Elements */}
                <Rect x="70" y="20" width="10" height="10" fill="#0A5B3D" rx="2" />
                <Rect x="90" y="20" width="10" height="10" fill="#0A5B3D" rx="2" />
                <Rect x="80" y="35" width="10" height="10" fill="#0A5B3D" rx="2" />
                <Rect x="100" y="35" width="10" height="10" fill="#0A5B3D" rx="2" />

                <Rect x="70" y="70" width="40" height="40" fill="#C9971E" rx="8" />
                <Circle cx="90" cy="90" r="12" fill="#FFFFFF" />
                <Path d="M85 90L89 94L96 86" stroke="#0A5B3D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                <Rect x="125" y="70" width="10" height="10" fill="#0A5B3D" rx="2" />
                <Rect x="145" y="70" width="10" height="10" fill="#0A5B3D" rx="2" />
                <Rect x="70" y="125" width="10" height="10" fill="#0A5B3D" rx="2" />
                <Rect x="90" y="135" width="10" height="10" fill="#0A5B3D" rx="2" />
                <Rect x="125" y="125" width="10" height="10" fill="#0A5B3D" rx="2" />
                <Rect x="145" y="135" width="10" height="10" fill="#0A5B3D" rx="2" />
              </Svg>

              <Pressable
                onPress={copyCode}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#f3f4f6', borderRadius: 8 }}
              >
                <Text style={{ fontFamily: FONT.mono, fontSize: 12, fontWeight: '700', color: '#1f2937' }}>
                  {verificationCode}
                </Text>
                {copied ? <Check size={13} color={colors.forest} /> : <Copy size={13} color="#6b7280" />}
              </Pressable>
            </View>

            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, textAlign: 'center', marginTop: 10 }}>
              Show this voucher to <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink }}>{quincaillerieName}</Text> for instant material disbursement.
            </Text>
          </View>

          {/* Itemized Order List */}
          <View style={{ padding: 14, maxHeight: 150 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Authorized Materials ({items.length})
            </Text>
            <ScrollView style={{ maxHeight: 90 }}>
              {items.map((it, idx) => (
                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: colors.parchmentDark }}>
                  <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12 }}>{it.name}</Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 12, fontWeight: '700' }}>
                    {it.quantity} {it.unit}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, marginTop: 4, borderTopWidth: 1, borderTopColor: colors.parchmentDark }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 12 }}>Escrow Amount</Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 13 }}>{fmt(totalAmount)}</Text>
            </View>
          </View>

          {/* Action Button */}
          <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: colors.parchmentDark }}>
            <PillButton variant="primary" onPress={onClose} fullWidth>
              Close Voucher
            </PillButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}
