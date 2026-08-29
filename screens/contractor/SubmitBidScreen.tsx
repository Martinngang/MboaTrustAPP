import { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ShieldCheck,
  Clock,
  Check,
  Plus,
  Trash2,
  Briefcase,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useSubmitBidMutation } from '../../api/contracts';
import type { MainStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<MainStackParamList, 'SubmitBid'>;

export function SubmitBidScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const bidMutation = useSubmitBidMutation();

  const { jobId, jobTitle, budget } = route.params;

  const [proposedAmount, setProposedAmount] = useState(String(budget || 4500000));
  const [durationDays, setDurationDays] = useState('28');
  const [notes, setNotes] = useState(
    'We provide a fully equipped masonry crew, concrete mixer, and high-grade compaction tools. Works supervised daily by a certified civil engineer.'
  );

  const numAmount = Number(proposedAmount) || 0;
  const numDays = Number(durationDays) || 30;

  const handleSubmit = async () => {
    if (numAmount <= 0) {
      showToast({ title: 'Invalid Bid Price', description: 'Please enter a valid proposed price in XAF.', tone: 'error' });
      return;
    }
    if (!notes.trim()) {
      showToast({ title: 'Proposal Notes Required', description: 'Please describe your methodology and team credentials.', tone: 'error' });
      return;
    }

    try {
      await bidMutation.mutateAsync({
        projectId: jobId,
        amount: numAmount,
        estimatedDurationDays: numDays,
        notes: notes.trim(),
      });

      showToast({
        title: 'Proposal Submitted!',
        description: 'The project funder will review your bid.',
        tone: 'success',
      });
      navigation.replace('MyBids');
    } catch (err: any) {
      showToast({
        title: 'Submission Error',
        description: err?.message || 'Could not submit proposal. Please try again.',
        tone: 'error',
      });
    }
  };

  return (
    <Screen header={<Header title="Submit Tender Proposal" subtitle={jobTitle} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Job Header */}
        <Card style={{ padding: 14, backgroundColor: colors.steel + '15', borderColor: colors.steel + '35', gap: 4 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.steel, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
            Target Tender
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
            {jobTitle}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
            Client Budget: <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest }}>{fmt(budget)}</Text>
          </Text>
        </Card>

        {/* Price & Timeline Proposal */}
        <Card style={{ padding: 16, gap: 14 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
            Your Quotation & Timeline
          </Text>

          <TextField
            label="Proposed Total Price (XAF)"
            placeholder="e.g. 4200000"
            value={proposedAmount}
            onChangeText={(v) => setProposedAmount(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />

          <TextField
            label="Estimated Completion Timeline (Days)"
            placeholder="e.g. 28"
            value={durationDays}
            onChangeText={(v) => setDurationDays(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />
        </Card>

        {/* Proposal Methodology & Team */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
            Methodology, Crew & Guarantee
          </Text>

          <TextInput
            placeholder="Detail your technical approach, crew size, equipment on site, and quality guarantees..."
            placeholderTextColor={colors.inkSubtle}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={5}
            style={{
              backgroundColor: colors.parchment,
              borderRadius: 14,
              padding: 14,
              fontFamily: FONT.sans,
              color: colors.ink,
              fontSize: 13,
              minHeight: 120,
              textAlignVertical: 'top',
            }}
          />
        </Card>

        {/* Escrow Payout Protection */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
          <ShieldCheck size={20} color={colors.forest} />
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, flex: 1, lineHeight: 17 }}>
            Upon bid acceptance, 100% of your proposed fee is locked in MboaTrust Escrow and released in tranches as you submit verified site proof.
          </Text>
        </View>

        {/* Submit Bid Button */}
        <PillButton
          variant="primary"
          onPress={handleSubmit}
          loading={bidMutation.isPending}
          disabled={bidMutation.isPending}
          fullWidth
        >
          {`Submit Proposal (${fmt(numAmount)})`}
        </PillButton>
      </View>
    </Screen>
  );
}
