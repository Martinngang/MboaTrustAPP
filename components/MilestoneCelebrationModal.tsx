import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, Share } from 'react-native';
import { Award, CheckCircle2, Share2, Sparkles, X } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { fmt } from './fmt';
import { PillButton } from './PillButton';
import { useToast } from './Toast';

interface Props {
  visible: boolean;
  milestoneTitle: string;
  amountXaf: number;
  projectName: string;
  contractorName: string;
  onClose: () => void;
}

export function MilestoneCelebrationModal({
  visible,
  milestoneTitle,
  amountXaf,
  projectName,
  contractorName,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const { show: showToast } = useToast();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🏗️ Project Update: "${projectName}"\n✅ Milestone Completed: ${milestoneTitle}\n💰 Escrow Disbursed: ${fmt(amountXaf)}\n👷 Contractor: ${contractorName}\n\n🔒 Verified & Protected by MboaTrust Escrow Platform`,
        title: 'MboaTrust Milestone Celebration',
      });
    } catch {
      showToast({ title: 'Share error', description: 'Could not open share sheet.', tone: 'error' });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View
          style={{
            width: '100%',
            maxWidth: 320,
            backgroundColor: colors.surface,
            borderRadius: 28,
            padding: 24,
            alignItems: 'center',
            gap: 16,
            borderWidth: 1.5,
            borderColor: colors.parchmentDark,
          }}
        >
          {/* Trophy Emblem */}
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: '#FEF3C7',
              borderWidth: 3,
              borderColor: '#F59E0B',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Award size={38} color="#D97706" />
          </View>

          {/* Title */}
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: colors.forest, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700' }}>
              Milestone Escrow Released
            </Text>
            <Text style={{ fontFamily: FONT.serifBold, fontSize: 20, color: colors.ink, textAlign: 'center' }}>
              Milestone Complete!
            </Text>
            <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: colors.inkMuted, textAlign: 'center' }}>
              {milestoneTitle}
            </Text>
          </View>

          {/* Amount Card */}
          <View
            style={{
              width: '100%',
              backgroundColor: colors.forest + '15',
              borderWidth: 1,
              borderColor: colors.forest + '40',
              borderRadius: 16,
              padding: 14,
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: colors.forest, textTransform: 'uppercase', fontWeight: '700' }}>
              Disbursed to {contractorName}
            </Text>
            <Text style={{ fontFamily: FONT.serifBold, fontSize: 22, color: colors.forest, marginTop: 2 }}>
              {fmt(amountXaf)}
            </Text>
            <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: colors.inkSubtle }}>
              {projectName} · BEAC Escrow Settled
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{ width: '100%', gap: 8 }}>
            <PillButton variant="primary" onPress={handleShare} fullWidth>
              📲 Share on WhatsApp
            </PillButton>
            <PillButton variant="ghost" onPress={onClose} fullWidth>
              Done
            </PillButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}
