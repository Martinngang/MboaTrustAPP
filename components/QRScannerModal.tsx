import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { ScanLine, CheckCircle2, XCircle, X, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { fmt } from './fmt';
import { PillButton } from './PillButton';
import { useToast } from './Toast';

interface Props {
  visible: boolean;
  onClose: () => void;
  onVerifiedOrder: (orderCode: string) => void;
}

export function QRScannerModal({ visible, onClose, onVerifiedOrder }: Props) {
  const { colors } = useTheme();
  const { show: showToast } = useToast();

  const [inputCode, setInputCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedData, setVerifiedData] = useState<{
    orderNumber: string;
    contractor: string;
    project: string;
    items: string;
    amount: number;
  } | null>(null);

  const handleSimulateScan = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerifiedData({
        orderNumber: 'ORD-2025-9481',
        contractor: 'Emmanuel Njang (EN BTP SARL)',
        project: '4-Bedroom Villa Bastos (Phase 1 Foundation)',
        items: '50x Cimencam 42.5R Bags, 24x Rebar FeE500 12mm',
        amount: 385000,
      });
    }, 1200);
  };

  const handleConfirmDisbursement = () => {
    if (!verifiedData) return;
    showToast({
      title: 'Materials Disbursed & Signed!',
      description: `Order ${verifiedData.orderNumber} successfully released. Escrow funds unlocked.`,
      tone: 'success',
    });
    onVerifiedOrder(verifiedData.orderNumber);
    setVerifiedData(null);
    setInputCode('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ width: '100%', maxWidth: 360, backgroundColor: colors.surface, borderRadius: 24, overflow: 'hidden' }}>
          {/* Header */}
          <View style={{ padding: 16, backgroundColor: colors.forestDark, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ScanLine size={18} color="#FFD700" />
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 16 }}>
                Scan Pickup Voucher
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={18} color="#fff" />
            </Pressable>
          </View>

          {/* Scanner Viewport or Result */}
          {!verifiedData ? (
            <View style={{ padding: 20, alignItems: 'center', gap: 14 }}>
              {/* Animated Scanner Box */}
              <View style={{ width: 200, height: 200, borderRadius: 20, borderWidth: 2, borderColor: colors.forest, borderStyle: 'dashed', backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <ScanLine size={48} color={colors.forestLight} />
                <View style={{ position: 'absolute', bottom: 12, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 }}>
                  <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 10 }}>Align QR inside frame</Text>
                </View>
              </View>

              {verifying && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color={colors.forest} />
                  <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 12 }}>
                    Verifying escrow voucher on blockchain…
                  </Text>
                </View>
              )}

              {/* Demo Simulator Scan Button */}
              <PillButton variant="secondary" onPress={handleSimulateScan} fullWidth>
                📷 Simulate Instant Camera QR Scan
              </PillButton>

              {/* Manual Code Input */}
              <View style={{ width: '100%', gap: 6, borderTopWidth: 1, borderTopColor: colors.parchmentDark, paddingTop: 12 }}>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                  Or Enter 6-Digit Code
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    placeholder="e.g. MB-PICKUP-9481"
                    value={inputCode}
                    onChangeText={setInputCode}
                    style={{ flex: 1, borderWidth: 1.5, borderColor: colors.parchmentDark, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontFamily: FONT.mono, fontSize: 12, backgroundColor: colors.parchment }}
                  />
                  <PillButton variant="primary" onPress={handleSimulateScan} disabled={!inputCode.trim()}>
                    Verify
                  </PillButton>
                </View>
              </View>
            </View>
          ) : (
            /* Verified Order Confirmation Card */
            <View style={{ padding: 18, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: '#dcfce7', borderRadius: 12 }}>
                <CheckCircle2 size={20} color="#15803d" />
                <View>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: '#15803d', fontSize: 13 }}>
                    Voucher Authenticated & Funded
                  </Text>
                  <Text style={{ fontFamily: FONT.mono, color: '#166534', fontSize: 10 }}>
                    {verifiedData.orderNumber}
                  </Text>
                </View>
              </View>

              <View style={{ gap: 6, backgroundColor: colors.parchment, padding: 12, borderRadius: 12 }}>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11 }}>
                  Contractor: <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink }}>{verifiedData.contractor}</Text>
                </Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11 }}>
                  Project: <Text style={{ fontFamily: FONT.sans, color: colors.ink }}>{verifiedData.project}</Text>
                </Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11 }}>
                  Materials: <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest }}>{verifiedData.items}</Text>
                </Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11 }}>
                  Payout Value: <Text style={{ fontFamily: FONT.serifBold, color: colors.forest }}>{fmt(verifiedData.amount)}</Text>
                </Text>
              </View>

              <PillButton variant="primary" onPress={handleConfirmDisbursement} fullWidth>
                Confirm Release & Sign Waybill
              </PillButton>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
