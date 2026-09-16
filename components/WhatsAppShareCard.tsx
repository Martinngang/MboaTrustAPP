import React from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { MessageSquare, Share2, CheckCircle2, Copy } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { fmt } from './fmt';
import { PillButton } from './PillButton';
import { useToast } from './Toast';

interface Props {
  projectName: string;
  locationName: string;
  currentMilestone: string;
  milestoneIndex: number;
  totalMilestones: number;
  completionPercent: number;
  totalBudgetXaf: number;
  contractorName: string;
  verifierName?: string;
}

export function WhatsAppShareCard({
  projectName,
  locationName,
  currentMilestone,
  milestoneIndex,
  totalMilestones,
  completionPercent,
  totalBudgetXaf,
  contractorName,
  verifierName = 'Dr. Christian Nguema (ONGC #884)',
}: Props) {
  const { colors } = useTheme();
  const { show: showToast } = useToast();

  const shareText = `🏗️ *MboaTrust Project Progress Update*
🏠 *Project:* ${projectName} (${locationName})
📊 *Progress:* Milestone ${milestoneIndex}/${totalMilestones} (${completionPercent}%)
✅ *Completed:* ${currentMilestone}
👷 *Contractor:* ${contractorName}
🔍 *Civil Verification:* ${verifierName}
💰 *Protected Escrow:* ${fmt(totalBudgetXaf)}

🔒 _Secured & verified by MboaTrust Escrow Platform_`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: shareText,
        title: `MboaTrust: ${projectName} Update`,
      });
    } catch {
      showToast({ title: 'Share error', description: 'Could not open share dialog.', tone: 'error' });
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 16,
        gap: 12,
        borderWidth: 1.5,
        borderColor: colors.parchmentDark,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: '#10B981',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MessageSquare size={14} color="#fff" />
          </View>
          <View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 13 }}>
              WhatsApp Family Card
            </Text>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9 }}>
              1-Tap Branded Status Update
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#dcfce7' }}>
          <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: '#15803d', fontWeight: '700' }}>
            {completionPercent}% Done
          </Text>
        </View>
      </View>

      {/* Dark Preview Card */}
      <View style={{ backgroundColor: '#0B0F19', borderRadius: 14, padding: 12, gap: 6 }}>
        <Text style={{ fontFamily: FONT.mono, color: '#34D399', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>
          MboaTrust Verified Update
        </Text>
        <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 13 }}>
          {projectName}
        </Text>
        <Text style={{ fontFamily: FONT.sans, color: '#9CA3AF', fontSize: 11 }}>
          📍 {locationName} · Milestone {milestoneIndex}/{totalMilestones}
        </Text>
        <View style={{ backgroundColor: '#1F2937', padding: 8, borderRadius: 8, marginTop: 2 }}>
          <Text style={{ fontFamily: FONT.sans, color: '#E5E7EB', fontSize: 11 }}>
            <Text style={{ color: '#10B981', fontWeight: '700' }}>✓ Phase: </Text>
            {currentMilestone}
          </Text>
        </View>
      </View>

      {/* Share Button */}
      <PillButton variant="primary" onPress={handleShare} fullWidth>
        📲 Share Update to Family WhatsApp
      </PillButton>
    </View>
  );
}
