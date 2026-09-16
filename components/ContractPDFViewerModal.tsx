import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Share,
} from 'react-native';
import { FileText, ShieldCheck, X, Share2, Scale } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { generateContractData, type ContractData } from '../utils/contractGenerator';
import { fmt } from './fmt';
import { PillButton } from './PillButton';
import { useToast } from './Toast';

interface Props {
  visible: boolean;
  contractParams: {
    funderName: string;
    contractorName: string;
    projectName: string;
    location: string;
    totalBudgetXaf: number;
    milestones?: { title: string; amountXaf: number; durationDays: number }[];
  };
  onClose: () => void;
}

export function ContractPDFViewerModal({ visible, contractParams, onClose }: Props) {
  const { colors } = useTheme();
  const { show: showToast } = useToast();

  const [data] = useState<ContractData>(() => generateContractData(contractParams));
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  const handleShare = async () => {
    try {
      await Share.share({
        message: `MboaTrust OHADA Construction Contract & Escrow Certificate #${data.contractReference}\nProject: ${data.projectName}\nBudget: ${fmt(data.totalBudgetXaf)}\nIntegrity Hash: ${data.cryptographicHash}`,
        title: 'MboaTrust OHADA Legal Contract',
      });
    } catch {
      showToast({ title: 'Share error', description: 'Could not export contract certificate.', tone: 'error' });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ width: '100%', maxWidth: 360, maxHeight: '88%', backgroundColor: colors.surface, borderRadius: 24, overflow: 'hidden' }}>
          {/* Top Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.forestDark }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Scale size={18} color="#FFD700" />
              <View>
                <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 14 }}>
                  OHADA Legal Agreement
                </Text>
                <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 9 }}>
                  {data.contractReference}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Language Switch */}
              <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: 2 }}>
                <Pressable
                  onPress={() => setLanguage('fr')}
                  style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: language === 'fr' ? colors.forest : 'transparent' }}
                >
                  <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: '#fff', fontWeight: '700' }}>FR</Text>
                </Pressable>
                <Pressable
                  onPress={() => setLanguage('en')}
                  style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: language === 'en' ? colors.forest : 'transparent' }}
                >
                  <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: '#fff', fontWeight: '700' }}>EN</Text>
                </Pressable>
              </View>

              <Pressable onPress={onClose} hitSlop={8}>
                <X size={18} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Scrollable Document */}
          <ScrollView style={{ padding: 16 }} contentContainerStyle={{ gap: 12 }}>
            {/* Header Republic Banner */}
            <View style={{ padding: 12, backgroundColor: colors.parchment, borderRadius: 14, alignItems: 'center', gap: 4 }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 8, color: colors.forest, textTransform: 'uppercase', letterSpacing: 1 }}>
                RÉPUBLIQUE DU CAMEROUN · OHADA COMPLIANT
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, fontSize: 13, color: colors.ink, textAlign: 'center' }}>
                {language === 'fr' ? 'CONVENTION D’ENTREPRISE BTP & SÉQUESTRE' : 'OHADA CONSTRUCTION CONTRACT & ESCROW'}
              </Text>
            </View>

            {/* Parties */}
            <View style={{ gap: 6, backgroundColor: colors.parchment, padding: 12, borderRadius: 14 }}>
              <View style={{ borderBottomWidth: 1, borderBottomColor: colors.parchmentDark, paddingBottom: 6 }}>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase' }}>
                  {language === 'fr' ? '1. Maître d’Ouvrage' : '1. Principal / Funder'}
                </Text>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 12 }}>{data.funderName}</Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 10 }}>{data.funderCountry}</Text>
              </View>

              <View style={{ paddingTop: 4 }}>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase' }}>
                  {language === 'fr' ? '2. Entrepreneur BTP' : '2. Contractor'}
                </Text>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 12 }}>{data.contractorName}</Text>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkMuted, fontSize: 9 }}>{data.contractorRegistration}</Text>
              </View>
            </View>

            {/* Scope & Amount */}
            <View style={{ padding: 12, backgroundColor: colors.parchment, borderRadius: 14, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>Project</Text>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 11, flex: 1, textAlign: 'right' }}>
                  {data.projectName}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>Location</Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 11 }}>{data.location}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.parchmentDark, paddingTop: 6 }}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 11 }}>Escrow Amount</Text>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 14 }}>{fmt(data.totalBudgetXaf)}</Text>
              </View>
            </View>

            {/* Milestone Breakdown */}
            <View style={{ padding: 12, backgroundColor: colors.parchment, borderRadius: 14, gap: 6 }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase', marginBottom: 2 }}>
                Milestone Tranches ({data.milestones.length})
              </Text>
              {data.milestones.map((m, idx) => (
                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: colors.parchmentDark }}>
                  <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 11, flex: 1 }}>
                    {idx + 1}. {m.title}
                  </Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 11, fontWeight: '700' }}>
                    {fmt(m.amountXaf)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Verification Seal */}
            <View style={{ padding: 10, backgroundColor: '#dcfce7', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={24} color="#15803d" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: '#166534', fontWeight: '700' }}>
                  MboaTrust Cryptographic Seal Verified
                </Text>
                <Text style={{ fontFamily: FONT.mono, fontSize: 8, color: '#15803d' }}>
                  Hash: {data.cryptographicHash.slice(0, 20)}…
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: colors.parchmentDark, gap: 8 }}>
            <PillButton variant="secondary" onPress={handleShare} fullWidth>
              Export & Share Legal Contract
            </PillButton>
            <PillButton variant="ghost" onPress={onClose} fullWidth>
              Close
            </PillButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}
