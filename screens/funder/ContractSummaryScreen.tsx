import { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FileCheck, CheckCircle2, XCircle, ExternalLink } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { Avatar } from '../../components/Avatar';
import { PillButton } from '../../components/PillButton';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useContractsQuery, useCompleteContractMutation, useTerminateContractMutation } from '../../api/contracts';
import { useProjectQuery } from '../../api/projects';
import { useBidsQuery } from '../../api/tenders';
import { useEscrowQuery, useRefreshEscrowStatusMutation } from '../../api/escrow';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'ContractSummary'>;

export function ContractSummaryScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { bidId } = route.params;
  const { data: contracts, isLoading: contractLoading } = useContractsQuery({ bidId });
  const contract = contracts?.[0];
  const { data: project, isLoading: projectLoading } = useProjectQuery(contract?.projectId);
  const { data: bids } = useBidsQuery({ projectId: contract?.projectId });
  const bid = bids?.find((b) => b.id === bidId);

  const remainingToFund = project ? Math.max(0, project.totalAmount - project.raised) : 0;

  // A provider whose webhook can't reach this backend leaves its escrow at
  // status='pending' until something explicitly reconciles it — without
  // checking for that, "Fund escrow" stayed visible even for a payment
  // that had already gone through, risking a genuine second real charge.
  const { data: pendingEscrows } = useEscrowQuery({ projectId: contract?.projectId, type: 'fund', status: 'pending' });
  const hasPendingPayment = (pendingEscrows?.entries.length ?? 0) > 0;
  const refreshEscrowStatus = useRefreshEscrowStatusMutation();
  const [checkingStatus, setCheckingStatus] = useState(false);

  const checkPendingPayment = async () => {
    if (!pendingEscrows?.entries.length) return;
    setCheckingStatus(true);
    try {
      for (const e of pendingEscrows.entries) {
        await refreshEscrowStatus.mutateAsync(e.id);
      }
    } catch (err) {
      showToast({ title: t('contractSummary.couldNotCheckStatus'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    } finally {
      setCheckingStatus(false);
    }
  };

  const completeContract = useCompleteContractMutation();
  const terminateContract = useTerminateContractMutation();
  const [acting, setActing] = useState<'complete' | 'terminate' | null>(null);

  const act = async (action: 'complete' | 'terminate') => {
    if (!contract) return;
    setActing(action);
    try {
      await (action === 'complete' ? completeContract : terminateContract).mutateAsync(contract.id);
      showToast({ title: action === 'complete' ? t('contractSummary.contractMarkedCompleted') : t('contractSummary.contractTerminated'), tone: action === 'complete' ? 'success' : 'error' });
    } catch (err) {
      showToast({ title: action === 'complete' ? t('contractSummary.failedToComplete') : t('contractSummary.failedToTerminate'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    } finally {
      setActing(null);
    }
  };

  if (contractLoading || projectLoading) {
    return (
      <Screen header={<Header title={t('contractSummary.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  if (!contract || !project) {
    return (
      <Screen header={<Header title={t('contractSummary.title')} back />}>
        <View style={{ padding: 16 }}>
          <EmptyState icon={FileCheck} title={t('contractSummary.noContractFound')} description={t('contractSummary.noContractDesc')} />
        </View>
      </Screen>
    );
  }

  const fundingColor = hasPendingPayment ? colors.steel : remainingToFund > 0 ? colors.amber : colors.forest;

  return (
    <Screen header={<Header title={t('contractSummary.title')} back />}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 18 }}>
        <View style={{ alignItems: 'center', gap: 6, paddingVertical: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>
            {t('contractSummary.digitalContract')}
          </Text>
          <Text style={{ fontFamily: FONT.mono, color: colors.ink, fontSize: 13, fontWeight: '600' }}>
            {contract.id.slice(-8).toUpperCase()}
          </Text>
          <StatusBadge status={contract.status} />
        </View>

        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('contractSummary.parties')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={project.ownerName || t('contractSummary.funderFallback')} size={40} />
            <View>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{project.ownerName || t('contractSummary.funderFallback')}</Text>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>{t('contractSummary.projectOwnerFunder')}</Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: colors.parchmentDark }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={bid?.contractorName || t('contractSummary.contractorFallback')} size={40} />
            <View>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{bid?.contractorName || t('contractSummary.contractorFallback')}</Text>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>{t('contractSummary.contractorLabel')}</Text>
            </View>
          </View>
        </Card>

        <Card style={{ padding: 16, gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('contractSummary.scopeOfWork')}
          </Text>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{project.title}</Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>{project.description}</Text>
        </Card>

        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('contractSummary.paymentSchedule')}
          </Text>
          {project.milestones.map((m, i) => (
            <View key={m.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 10, backgroundColor: colors.parchment }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 9, fontWeight: '700' }}>{i + 1}</Text>
                </View>
                <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12, flex: 1 }} numberOfLines={1}>{m.title}</Text>
                <StatusBadge status={m.status} />
              </View>
              <Text style={{ fontFamily: FONT.mono, color: colors.ink, fontSize: 12, fontWeight: '700' }}>{fmt(m.amount)}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.parchmentDark }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, textTransform: 'uppercase' }}>{t('contractSummary.totalContractValue')}</Text>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16 }}>{fmt(contract.totalAmount)}</Text>
          </View>
        </Card>

        {project.milestones.some((m) => m.status === 'under_review') && (
          <Pressable
            onPress={() => navigation.navigate('MilestoneReview', { projectId: project.id })}
            style={{ backgroundColor: colors.amber, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forestDark, fontSize: 13 }}>
              {t('contractSummary.reviewPendingProof')}
            </Text>
          </Pressable>
        )}

        {/* Awarding a bid only locks in the terms — it never moves money on
            its own, so a fully-awarded contract needs an explicit funding
            nudge or it sits forever with zero funded. */}
        <Card style={{ padding: 16, gap: 4, borderColor: fundingColor, borderWidth: 1.5, backgroundColor: fundingColor + '12' }}>
          <Text style={{ fontFamily: FONT.mono, color: fundingColor, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('contractSummary.escrowFunding')}
          </Text>
          {hasPendingPayment ? (
            <>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>{t('contractSummary.paymentProcessing')}</Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
                {t('contractSummary.paymentProcessingDesc')}
              </Text>
            </>
          ) : remainingToFund > 0 ? (
            <>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                {`${fmt(project.raised)} ${t('contractSummary.fundedOf')} ${fmt(contract.totalAmount)} ${t('contractSummary.funded')}`}
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
                {`${t('contractSummary.workCannotStart')} ${fmt(remainingToFund)} ${t('contractSummary.toReleaseContractor')}`}
              </Text>
            </>
          ) : (
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
              {`${t('contractSummary.fullyFunded')} ${fmt(contract.totalAmount)} ${t('contractSummary.heldInEscrow')}`}
            </Text>
          )}
        </Card>

        <Card style={{ padding: 16, gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('contractSummary.generatedContractText')}
          </Text>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkMuted, fontSize: 11, lineHeight: 16 }}>
            {contract.generatedDocumentText}
          </Text>
        </Card>

        <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', textAlign: 'center' }}>
          {`${t('contractSummary.generatedOnAcceptance')} ${new Date(contract.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        </Text>

        <View style={{ gap: 10 }}>
          {hasPendingPayment ? (
            <PillButton variant="primary" onPress={checkPendingPayment} loading={checkingStatus} disabled={checkingStatus} fullWidth>
              {t('contractSummary.checkPaymentStatus')}
            </PillButton>
          ) : remainingToFund > 0 ? (
            <PillButton
              variant="primary"
              onPress={() => navigation.navigate('FundProject', { projectId: project.id, title: project.title, remainingAmount: remainingToFund })}
              fullWidth
            >
              {`${t('contractSummary.fundEscrowPrefix')} ${fmt(remainingToFund)}`}
            </PillButton>
          ) : null}

          {contract.status === 'active' && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => act('complete')}
                disabled={acting !== null}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.forest, alignItems: 'center', opacity: acting !== null ? 0.5 : 1 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={14} color="#fff" />
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 13 }}>
                    {acting === 'complete' ? t('contractSummary.marking') : t('contractSummary.markCompleted')}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => act('terminate')}
                disabled={acting !== null}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.seal, alignItems: 'center', opacity: acting !== null ? 0.5 : 1 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <XCircle size={14} color={colors.seal} />
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 13 }}>
                    {acting === 'terminate' ? t('contractSummary.terminating') : t('contractSummary.terminate')}
                  </Text>
                </View>
              </Pressable>
            </View>
          )}

          {contract.generatedDocumentUrl && (
            <Pressable onPress={() => Linking.openURL(contract.generatedDocumentUrl)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>{t('contractSummary.downloadContract')}</Text>
              <ExternalLink size={13} color={colors.forest} />
            </Pressable>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
