import { useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { PillButton } from '../components/PillButton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { fmt } from '../components/fmt';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useBidQuery, useCounterBidMutation, useUpdateBidStatusMutation, type NegotiationRound } from '../api/tenders';
import { useProjectQuery } from '../api/projects';
import { useApp } from '../context/AppContext';
import { apiErrorMessage } from '../api/client';
import {
  MilestoneScheduleEditor,
  makeDefaultSchedule,
  scheduleTotal,
  scheduleRowsValid,
  type DraftScheduleMilestone,
} from '../components/MilestoneScheduleEditor';
import type { MainStackParamList } from '../navigation/types';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translations';

type RouteProps = RouteProp<MainStackParamList, 'Negotiation'>;

function RoundCard({ round, isLatest, colors, t }: { round: NegotiationRound; isLatest: boolean; colors: any; t: (k: TranslationKey) => string }) {
  return (
    <Card
      style={{
        padding: 14,
        gap: 6,
        borderColor: isLatest ? colors.forest : colors.parchmentDark,
        borderWidth: isLatest ? 1.5 : 1,
        backgroundColor: isLatest ? colors.forest + '10' : colors.surface,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 8,
            backgroundColor: round.proposedBy === 'funder' ? colors.steel + '18' : colors.amber + '25',
          }}
        >
          <Text
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              fontWeight: '700',
              textTransform: 'uppercase',
              color: round.proposedBy === 'funder' ? colors.steel : colors.forestDark,
            }}
          >
            {round.proposedBy === 'funder' ? t('negotiation.funderProposed') : t('negotiation.contractorProposed')}
          </Text>
        </View>
        <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>
          {round.createdAt ? new Date(round.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : t('common.now')}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 17 }}>{fmt(round.price)}</Text>
        <Text style={{ fontFamily: FONT.mono, color: colors.inkMuted, fontSize: 12 }}>{round.timelineDays} {t('negotiation.days')}</Text>
      </View>
      {round.message ? (
        <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, fontStyle: 'italic' }}>"{round.message}"</Text>
      ) : null}
      {round.milestones && round.milestones.length > 0 ? (
        <View style={{ gap: 4, marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.parchmentDark }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('negotiation.proposedSchedule')}
          </Text>
          {round.milestones.map((m, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12, flex: 1 }} numberOfLines={1}>{m.title}</Text>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11 }}>{fmt(m.amount)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

export function NegotiationScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const { user } = useApp();

  const { bidId } = route.params;
  const { data: bid, isLoading } = useBidQuery(bidId);
  const { data: job } = useProjectQuery(bid?.jobId);
  const updateStatus = useUpdateBidStatusMutation();
  const counterBid = useCounterBidMutation();

  const [mode, setMode] = useState<'view' | 'counter' | 'reject'>('view');
  const [priceStr, setPriceStr] = useState('');
  const [timelineStr, setTimelineStr] = useState('');
  const [message, setMessage] = useState('');
  const [acting, setActing] = useState(false);
  const [useSchedule, setUseSchedule] = useState(false);
  const [weekly, setWeekly] = useState(false);
  const [milestones, setMilestones] = useState<DraftScheduleMilestone[]>(makeDefaultSchedule(3));
  const timelineRef = useRef<TextInput>(null);
  const messageRef = useRef<TextInput>(null);

  if (isLoading) {
    return (
      <Screen header={<Header title={t('negotiation.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  if (!bid) {
    return (
      <Screen header={<Header title={t('negotiation.title')} back />}>
        <View style={{ padding: 16 }}>
          <EmptyState icon={ArrowLeft} title={t('negotiation.notFound')} description={t('negotiation.notFoundDesc')} />
        </View>
      </Screen>
    );
  }

  const myParty: 'funder' | 'contractor' | null =
    !user ? null : job?.ownerId === user._id ? 'funder' : bid.contractorId === user._id ? 'contractor' : null;
  const myTurn = myParty !== null && bid.status === 'pending' && bid.lastProposedBy !== myParty;
  const currentRound = bid.rounds[bid.rounds.length - 1];
  const priceTarget = Number(priceStr) || 0;
  const scheduleOk = !useSchedule || (scheduleRowsValid(milestones) && scheduleTotal(milestones) === priceTarget);
  const counterOk = priceTarget > 0 && Number(timelineStr) > 0 && scheduleOk;

  const openCounterForm = () => {
    setPriceStr(String(currentRound?.price ?? bid.price));
    setTimelineStr(String(currentRound?.timelineDays ?? bid.timelineDays));
    setMessage('');
    setUseSchedule(false);
    setMilestones(makeDefaultSchedule(3));
    setMode('counter');
  };

  const submitCounter = async () => {
    setActing(true);
    try {
      await counterBid.mutateAsync({
        bidId: bid.id,
        price: priceTarget,
        timelineDays: Number(timelineStr),
        message,
        milestones: useSchedule ? milestones.map((m) => ({ title: m.title, description: m.description, amount: Number(m.amount) || 0 })) : undefined,
      });
      showToast({ title: t('negotiation.counterOfferSent'), tone: 'success' });
      setMode('view');
    } catch (err) {
      showToast({ title: t('negotiation.failedToSendCounter'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    } finally {
      setActing(false);
    }
  };

  const accept = async () => {
    setActing(true);
    try {
      const result = await updateStatus.mutateAsync({ bidId: bid.id, status: 'accepted' });
      showToast({
        title: t('negotiation.contractAwarded'),
        description: result.contract ? t('negotiation.termsLocked') : undefined,
        tone: 'success',
      });
      navigation.goBack();
    } catch (err) {
      showToast({ title: t('negotiation.failedToAccept'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    } finally {
      setActing(false);
    }
  };

  const reject = async () => {
    setActing(true);
    try {
      await updateStatus.mutateAsync({ bidId: bid.id, status: myParty === 'contractor' ? 'withdrawn' : 'rejected' });
      showToast({ title: myParty === 'contractor' ? t('negotiation.bidWithdrawn') : t('negotiation.bidRejected'), tone: 'neutral' });
      navigation.goBack();
    } catch (err) {
      showToast({ title: t('negotiation.failedToReject'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    } finally {
      setActing(false);
    }
  };

  if (mode === 'counter') {
    return (
      <Screen header={<Header title={t('negotiation.sendCounterOffer')} subtitle={job?.title} back onBack={() => setMode('view')} />}>
        <View style={{ padding: 16, gap: 16 }}>
          <Card style={{ padding: 16, gap: 14 }}>
            <View>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>
                {t('negotiation.priceXaf')}
              </Text>
              <TextInput
                value={priceStr}
                onChangeText={(v) => setPriceStr(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => timelineRef.current?.focus()}
                style={{
                  backgroundColor: colors.parchment,
                  borderRadius: 12,
                  padding: 12,
                  fontFamily: FONT.sans,
                  color: colors.ink,
                  fontSize: 14,
                }}
              />
            </View>
            <View>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>
                {t('negotiation.timelineDays')}
              </Text>
              <TextInput
                ref={timelineRef}
                value={timelineStr}
                onChangeText={(v) => setTimelineStr(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => messageRef.current?.focus()}
                style={{
                  backgroundColor: colors.parchment,
                  borderRadius: 12,
                  padding: 12,
                  fontFamily: FONT.sans,
                  color: colors.ink,
                  fontSize: 14,
                }}
              />
            </View>
            <View>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>
                {t('negotiation.messageOptional')}
              </Text>
              <TextInput
                ref={messageRef}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
                placeholder={t('negotiation.explainCounterOffer')}
                placeholderTextColor={colors.inkSubtle}
                style={{
                  backgroundColor: colors.parchment,
                  borderRadius: 12,
                  padding: 12,
                  fontFamily: FONT.sans,
                  color: colors.ink,
                  fontSize: 13,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
              />
            </View>
          </Card>

          <Pressable
            onPress={() => setUseSchedule((v) => !v)}
            accessibilityRole="button"
            style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.forest, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>
              {useSchedule ? t('negotiation.removeSchedule') : t('negotiation.proposeSchedule')}
            </Text>
          </Pressable>

          {useSchedule && (
            <Card style={{ padding: 16 }}>
              <MilestoneScheduleEditor
                milestones={milestones}
                onChange={setMilestones}
                budget={priceTarget}
                weekly={weekly}
                onWeeklyChange={setWeekly}
              />
            </Card>
          )}

          <PillButton variant="primary" onPress={submitCounter} loading={acting} disabled={!counterOk || acting} fullWidth>
            {t('negotiation.sendCounterOfferButton')}
          </PillButton>
        </View>
      </Screen>
    );
  }

  if (mode === 'reject') {
    return (
      <Screen header={<Header title={myParty === 'contractor' ? t('negotiation.withdrawBid') : t('negotiation.rejectBid')} back onBack={() => setMode('view')} />}>
        <View style={{ padding: 16, gap: 18 }}>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, lineHeight: 19 }}>
            {myParty === 'contractor'
              ? t('negotiation.withdrawDesc')
              : t('negotiation.rejectDesc')}
          </Text>
          <PillButton variant="danger" onPress={reject} loading={acting} disabled={acting} fullWidth>
            {myParty === 'contractor' ? t('negotiation.withdrawBid') : t('negotiation.rejectBid')}
          </PillButton>
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title={t('negotiation.title')} subtitle={job?.title} back />}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {bid.status !== 'pending' ? (
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <StatusBadge status={bid.status} />
          </View>
        ) : (
          <View
            style={{
              padding: 12,
              borderRadius: 14,
              alignItems: 'center',
              backgroundColor: myTurn ? colors.forest + '15' : colors.parchment,
              borderWidth: 1,
              borderColor: myTurn ? colors.forest : colors.parchmentDark,
            }}
          >
            <Text style={{ fontFamily: FONT.sansSemiBold, color: myTurn ? colors.forest : colors.inkMuted, fontSize: 13 }}>
              {myTurn ? t('negotiation.yourTurn') : (bid.lastProposedBy === 'funder' ? t('negotiation.waitingOnContractor') : t('negotiation.waitingOnFunder'))}
            </Text>
          </View>
        )}

        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('negotiation.history')}
          </Text>
          {bid.rounds.map((r, i) => (
            <RoundCard key={i} round={r} isLatest={i === bid.rounds.length - 1} colors={colors} t={t} />
          ))}
        </View>

        {myTurn && (
          <View style={{ gap: 10, marginTop: 4 }}>
            <PillButton variant="primary" onPress={accept} loading={acting} disabled={acting} fullWidth>
              {`${t('negotiation.acceptPrefix')} ${fmt(currentRound?.price ?? bid.price)}`}
            </PillButton>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={openCounterForm}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: colors.forest,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>{t('negotiation.counter')}</Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('reject')}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: colors.seal + '15',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 13 }}>
                  {myParty === 'contractor' ? t('negotiation.withdraw') : t('negotiation.reject')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
