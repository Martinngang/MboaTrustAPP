import { useRef, useState } from 'react';
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
  Calculator,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { EmptyState } from '../../components/EmptyState';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useCreateBidMutation, useBidsQuery } from '../../api/tenders';
import { useProjectQuery } from '../../api/projects';
import { apiErrorMessage } from '../../api/client';
import { useApp } from '../../context/AppContext';
import {
  MilestoneScheduleEditor,
  makeDefaultSchedule,
  scheduleTotal,
  scheduleRowsValid,
  type DraftScheduleMilestone,
} from '../../components/MilestoneScheduleEditor';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'SubmitBid'>;

export function SubmitBidScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useApp();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const bidMutation = useCreateBidMutation();

  const { jobId, jobTitle, budget } = route.params;
  const { data: job } = useProjectQuery(jobId);
  const { data: myBids } = useBidsQuery({ contractorId: user?._id });

  const [proposedAmount, setProposedAmount] = useState(budget ? String(budget) : '');
  const [durationDays, setDurationDays] = useState('');
  const [materials, setMaterials] = useState('');
  const [notes, setNotes] = useState('');
  const [useSchedule, setUseSchedule] = useState(false);
  const [weekly, setWeekly] = useState(false);
  const [milestones, setMilestones] = useState<DraftScheduleMilestone[]>(makeDefaultSchedule(3));
  const durationRef = useRef<TextInput>(null);
  const materialsRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const numAmount = Number(proposedAmount) || 0;
  const numDays = Number(durationDays) || 30;
  const scheduleOk = !useSchedule || (scheduleRowsValid(milestones) && scheduleTotal(milestones) === numAmount);

  // Same guards as MboaTrustFrontend/src/screens/ContractorScreens.tsx's
  // SubmitBidScreen — JobDetailScreen already routes away from this screen
  // once a bid exists or on your own tender, but this screen is directly
  // navigable, so the guard has to live here too. The backend rejects both
  // cases regardless (Bid.js's unique index; bidController.create), this
  // just avoids showing a live form for a submission that can't succeed.
  const existingBid = (myBids || []).find((b) => b.jobId === jobId);
  if (existingBid) {
    return (
      <Screen header={<Header title={t('submitBid.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <EmptyState
            icon={Briefcase}
            title={t('submitBid.alreadyAppliedTitle')}
            description={t('submitBid.alreadyAppliedDesc')}
            action={<PillButton onPress={() => navigation.replace('MyBids')}>{t('submitBid.goToMyBids')}</PillButton>}
          />
        </View>
      </Screen>
    );
  }
  if (job && Boolean(user?._id) && job.ownerId === user?._id) {
    return (
      <Screen header={<Header title={t('submitBid.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center' }}>
            {t('submitBid.cannotBidOwnTender')}
          </Text>
          <PillButton onPress={() => navigation.replace('TenderBids', { jobId, jobTitle })}>
            {t('submitBid.viewBidsInstead')}
          </PillButton>
        </View>
      </Screen>
    );
  }

  const handleSubmit = async () => {
    if (numAmount <= 0) {
      showToast({ title: t('submitBid.invalidBidPrice'), description: t('submitBid.invalidBidPriceDesc'), tone: 'error' });
      return;
    }
    if (!notes.trim()) {
      showToast({ title: t('submitBid.proposalNotesRequired'), description: t('submitBid.proposalNotesDesc'), tone: 'error' });
      return;
    }
    if (!scheduleOk) {
      showToast({ title: t('submitBid.scheduleInvalid'), description: t('submitBid.scheduleInvalidDesc'), tone: 'error' });
      return;
    }

    try {
      await bidMutation.mutateAsync({
        jobId,
        price: numAmount,
        timelineDays: numDays,
        materials: materials.trim(),
        notes: notes.trim(),
        milestones: useSchedule ? milestones.map((m) => ({ title: m.title, description: m.description, amount: Number(m.amount) || 0 })) : undefined,
      });

      showToast({
        title: t('submitBid.proposalSubmitted'),
        description: t('submitBid.funderWillReview'),
        tone: 'success',
      });
      navigation.replace('MyBids');
    } catch (err) {
      showToast({
        title: t('submitBid.submissionError'),
        description: apiErrorMessage(err, t('submitBid.couldNotSubmit')),
        tone: 'error',
      });
    }
  };

  return (
    <Screen header={<Header title={t('submitBid.title')} subtitle={jobTitle} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Job Header */}
        <Card style={{ padding: 14, backgroundColor: colors.steel + '15', borderColor: colors.steel + '35', gap: 4 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.steel, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
            {t('submitBid.targetTender')}
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
            {jobTitle}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
            {t('submitBid.clientBudget')} <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest }}>{fmt(budget)}</Text>
          </Text>
        </Card>

        {/* Price & Timeline Proposal */}
        <Card style={{ padding: 16, gap: 14 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
            {t('submitBid.quotationTimeline')}
          </Text>

          <TextField
            label={t('submitBid.proposedPriceLabel')}
            placeholder="e.g. 4200000"
            value={proposedAmount}
            onChangeText={(v) => setProposedAmount(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => durationRef.current?.focus()}
          />

          <TextField
            ref={durationRef}
            label={t('submitBid.timelineLabel')}
            placeholder="e.g. 28"
            value={durationDays}
            onChangeText={(v) => setDurationDays(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => materialsRef.current?.focus()}
          />

          <TextField
            ref={materialsRef}
            label={t('submitBid.materialsPlanLabel')}
            placeholder={t('submitBid.materialsPlanPlaceholder')}
            value={materials}
            onChangeText={setMaterials}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => notesRef.current?.focus()}
          />
        </Card>

        <Pressable
          onPress={() => navigation.navigate('MaterialCostEstimator')}
          accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}
        >
          <Calculator size={14} color={colors.forest} />
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
            {t('submitBid.materialCostEstimatorLink')}
          </Text>
        </Pressable>

        {/* Proposal Methodology & Team */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
            {t('submitBid.methodologyTitle')}
          </Text>

          <TextInput
            ref={notesRef}
            placeholder={t('submitBid.methodologyPlaceholder')}
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

        {/* Detailed Payment Schedule (optional) */}
        <Pressable
          onPress={() => setUseSchedule((v) => !v)}
          accessibilityRole="button"
          style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.forest, alignItems: 'center' }}
        >
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>
            {useSchedule ? t('submitBid.removeSchedule') : t('submitBid.proposeSchedule')}
          </Text>
        </Pressable>

        {useSchedule && (
          <Card style={{ padding: 16 }}>
            <MilestoneScheduleEditor
              milestones={milestones}
              onChange={setMilestones}
              budget={numAmount}
              weekly={weekly}
              onWeeklyChange={setWeekly}
            />
          </Card>
        )}

        {/* Escrow Payout Protection */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
          <ShieldCheck size={20} color={colors.forest} />
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, flex: 1, lineHeight: 17 }}>
            {t('submitBid.escrowInfo')}
          </Text>
        </View>

        {/* Submit Bid Button */}
        <PillButton
          variant="primary"
          onPress={handleSubmit}
          loading={bidMutation.isPending}
          disabled={bidMutation.isPending || !scheduleOk}
          fullWidth
        >
          {`${t('submitBid.submitProposal')} (${fmt(numAmount)})`}
        </PillButton>
      </View>
    </Screen>
  );
}
