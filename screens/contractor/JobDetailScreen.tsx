import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
  ArrowRight,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { PillButton } from '../../components/PillButton';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useProjectQuery } from '../../api/projects';
import { useBidsQuery } from '../../api/tenders';
import { useApp } from '../../context/AppContext';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';
import type { StatusTone } from '../../theme/tokens';
import type { TranslationKey } from '../../i18n/translations';

type RouteProps = RouteProp<MainStackParamList, 'JobDetail'>;

// Bid.js enforces one bid per contractor per project with a unique index —
// there's no "try again" state to design for once a bid exists, just "here's
// what happened to the one you sent" (mirrors
// MboaTrustFrontend/src/screens/ContractorScreens.tsx's APPLIED_STATUS_COPY).
const APPLIED_STATUS: Record<string, { tone: StatusTone; labelKey: TranslationKey }> = {
  pending: { tone: 'warning', labelKey: 'jobDetail.bidStatusPending' },
  accepted: { tone: 'success', labelKey: 'jobDetail.bidStatusAccepted' },
  rejected: { tone: 'error', labelKey: 'jobDetail.bidStatusRejected' },
  withdrawn: { tone: 'neutral', labelKey: 'jobDetail.bidStatusWithdrawn' },
};

export function JobDetailScreen() {
  const { colors, statusTones } = useTheme();
  const { t } = useTranslation();
  const { user } = useApp();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { jobId } = route.params;

  const { data: job, isLoading } = useProjectQuery(jobId);
  const { data: myBids } = useBidsQuery({ contractorId: user?._id });

  if (isLoading) {
    return (
      <Screen header={<Header title={t('jobDetail.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.steel} />
        </View>
      </Screen>
    );
  }

  if (!job) {
    return (
      <Screen header={<Header title={t('jobDetail.title')} back />}>
        <View style={{ padding: 24, alignItems: 'center', gap: 12 }}>
          <AlertCircle size={40} color={colors.seal} />
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
            {t('jobDetail.notFoundTitle')}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13, textAlign: 'center' }}>
            {t('jobDetail.notFoundDesc')}
          </Text>
          <PillButton onPress={() => navigation.goBack()} variant="secondary">
            {t('jobDetail.goBack')}
          </PillButton>
        </View>
      </Screen>
    );
  }

  const jobData = job;
  // A funder can also hold a contractor role (multi-role accounts are
  // supported platform-wide) — the restriction is specifically "never bid
  // on your own tender," not "funders can never see the bid UI at all".
  const isOwnTender = Boolean(user?._id) && jobData.ownerId === user?._id;
  const myBid = (myBids || []).find((b) => b.jobId === jobData.id);

  return (
    <Screen header={<Header title={t('jobDetail.title')} subtitle={jobData.location} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Tender Header Card */}
        <Card style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: colors.steel + '15',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  marginBottom: 6,
                }}
              >
                <Text style={{ fontFamily: FONT.mono, color: colors.steel, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
                  {jobData.category}
                </Text>
              </View>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                {jobData.title}
              </Text>
            </View>
            <StatusBadge status={jobData.status} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPin size={13} color={colors.inkSubtle} />
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
              {jobData.location}
            </Text>
          </View>

          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, lineHeight: 19 }}>
            {jobData.description}
          </Text>
        </Card>

        {/* Budget & Timeline Card */}
        <Card style={{ padding: 16, gap: 14 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('jobDetail.financialTerms')}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                {t('jobDetail.clientBudget')}
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 20, marginTop: 2 }}>
                {fmt(jobData.totalAmount)}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                {t('jobDetail.paymentProtection')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <ShieldCheck size={16} color={colors.forest} />
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>
                  {t('jobDetail.escrowed100')}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.forest + '12',
              borderWidth: 1,
              borderColor: colors.forest + '30',
            }}
          >
            <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12, lineHeight: 17 }}>
              {t('jobDetail.escrowExplainer')}
            </Text>
          </View>
        </Card>

        {/* Expected Milestone Tranches */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('jobDetail.requiredMilestones')} ({jobData.milestones.length})
          </Text>

          {jobData.milestones.map((m, idx) => (
            <Card key={m.id || idx} style={{ padding: 14, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: FONT.mono, color: colors.steel, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
                  {t('jobDetail.tranche')} {idx + 1}
                </Text>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 14 }}>
                  {fmt(m.amount)}
                </Text>
              </View>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                {m.title}
              </Text>
              {m.description ? (
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
                  {m.description}
                </Text>
              ) : null}
            </Card>
          ))}
        </View>

        {/* Bid Action Area */}
        {isOwnTender ? (
          <View style={{ gap: 10 }}>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, textAlign: 'center' }}>
              {t('jobDetail.ownTenderNotice')}
            </Text>
            <PillButton
              variant="primary"
              onPress={() => navigation.navigate('TenderBids', { jobId: jobData.id, jobTitle: jobData.title })}
              fullWidth
            >
              {t('jobDetail.viewBids')}
            </PillButton>
          </View>
        ) : myBid ? (
          <View style={{ gap: 10 }}>
            <View
              style={{
                padding: 14,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: statusTones[APPLIED_STATUS[myBid.status]?.tone ?? 'neutral'].bg,
              }}
            >
              <Text style={{ fontFamily: FONT.sansSemiBold, color: statusTones[APPLIED_STATUS[myBid.status]?.tone ?? 'neutral'].text, fontSize: 13 }}>
                {t(APPLIED_STATUS[myBid.status]?.labelKey ?? 'jobDetail.alreadyApplied')}
              </Text>
            </View>
            <PillButton
              variant="secondary"
              onPress={() => (myBid.status === 'pending' ? navigation.navigate('Negotiation', { bidId: myBid.id }) : navigation.navigate('MyBids', undefined))}
              fullWidth
            >
              {myBid.status === 'pending' ? t('jobDetail.viewYourBid') : t('jobDetail.viewInMyBids')}
            </PillButton>
          </View>
        ) : jobData.status === 'open' ? (
          <View style={{ gap: 10 }}>
            <PillButton
              variant="primary"
              onPress={() =>
                navigation.navigate('SubmitBid', {
                  jobId: jobData.id,
                  jobTitle: jobData.title,
                  budget: jobData.totalAmount,
                })
              }
              fullWidth
            >
              {t('jobDetail.submitProposal')}
            </PillButton>
            <PillButton
              variant="secondary"
              onPress={() => navigation.navigate('BrowseContractors', undefined)}
              fullWidth
            >
              {t('jobDetail.compareContractors')}
            </PillButton>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
