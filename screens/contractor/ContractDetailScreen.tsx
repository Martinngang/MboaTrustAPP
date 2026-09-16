import { useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FileCheck, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { PillButton } from '../../components/PillButton';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useContractsQuery, useCompleteContractMutation, useTerminateContractMutation } from '../../api/contracts';
import { useProjectQuery } from '../../api/projects';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'ContractDetail'>;

export function ContractDetailScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { bidId } = route.params;
  const { data: contracts, isLoading: contractLoading } = useContractsQuery({ bidId });
  const contract = contracts?.[0];
  const { data: project, isLoading: projectLoading } = useProjectQuery(contract?.projectId);
  const completeContract = useCompleteContractMutation();
  const terminateContract = useTerminateContractMutation();
  const [acting, setActing] = useState<'complete' | 'terminate' | null>(null);

  const act = async (action: 'complete' | 'terminate') => {
    if (!contract) return;
    setActing(action);
    try {
      await (action === 'complete' ? completeContract : terminateContract).mutateAsync(contract.id);
      showToast({
        title: action === 'complete' ? t('contractDetail.contractMarkedCompleted') : t('contractDetail.contractTerminated'),
        tone: action === 'complete' ? 'success' : 'error',
      });
    } catch (err) {
      showToast({ title: action === 'complete' ? t('contractDetail.failedToComplete') : t('contractDetail.failedToTerminate'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    } finally {
      setActing(null);
    }
  };

  if (contractLoading || projectLoading) {
    return (
      <Screen header={<Header title={t('contractDetail.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  if (!contract || !project) {
    return (
      <Screen header={<Header title={t('contractDetail.title')} back />}>
        <View style={{ padding: 16 }}>
          <EmptyState icon={FileCheck} title={t('contractDetail.noContractFound')} description={t('contractDetail.noContractDesc')} />
        </View>
      </Screen>
    );
  }

  const milestones = project.milestones;
  const paid = milestones.filter((m) => m.status === 'released').reduce((s, m) => s + m.amount, 0);
  const underReview = milestones.find((m) => m.status === 'under_review');
  // Same entry point web's ContractDetailScreen offers alongside "Submit
  // Next Milestone Proof" — requesting materials from a verified store
  // instead of (or alongside) submitting photo proof yourself.
  const nextPendingMilestone = milestones.find((m) => m.status === 'pending');

  return (
    <Screen header={<Header title={t('contractDetail.title')} subtitle={project.title} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Value & Progress */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Card style={{ flex: 1, padding: 14, gap: 2 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('contractDetail.contractValue')}
            </Text>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>{fmt(contract.totalAmount)}</Text>
          </Card>
          <Card style={{ flex: 1, padding: 14, gap: 2 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('contractDetail.paidSoFar')}
            </Text>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16 }}>{fmt(paid)}</Text>
          </Card>
        </View>

        {contract.status !== 'active' && (
          <View style={{ alignSelf: 'flex-start' }}>
            <StatusBadge status={contract.status} />
          </View>
        )}

        {/* Milestone Tracker */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('contractDetail.milestones')}
          </Text>
          {milestones.map((m, i) => {
            const latestChange = m.changeRequests[m.changeRequests.length - 1];
            return (
              <Card
                key={m.id}
                style={{
                  padding: 14,
                  gap: 6,
                  borderColor: m.status === 'under_review' ? colors.amber : undefined,
                  borderWidth: m.status === 'under_review' ? 1.5 : undefined,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                      {i + 1}. {m.title}
                    </Text>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkMuted, fontSize: 11, marginTop: 1 }}>
                      {fmt(m.amount)}
                    </Text>
                  </View>
                  <StatusBadge status={m.status} />
                </View>
                {m.description ? (
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>{m.description}</Text>
                ) : null}
                {m.status === 'pending' && latestChange ? (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 2 }}>
                    <AlertTriangle size={13} color={colors.amber} />
                    <Text style={{ fontFamily: FONT.sans, color: colors.amber, fontSize: 12, flex: 1, fontStyle: 'italic' }}>
                      {t('contractDetail.correctionsRequested')} "{latestChange.reason}"
                    </Text>
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>

        {/* Under Review Notice */}
        {underReview && (
          <Card style={{ padding: 14, backgroundColor: colors.amber + '18', borderColor: colors.amber, borderWidth: 1.5, gap: 4 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.amber, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('contractDetail.proofUnderReview')}
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12 }}>
              "{underReview.title}" {t('contractDetail.proofBeingReviewed')}
            </Text>
          </Card>
        )}

        {/* Contract Status Actions */}
        {contract.status === 'active' && (
          <Card style={{ padding: 14, gap: 10 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('contractDetail.contractStatus')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => act('complete')}
                disabled={acting !== null}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: colors.forest,
                  alignItems: 'center',
                  opacity: acting !== null ? 0.5 : 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={14} color="#fff" />
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>
                    {acting === 'complete' ? t('contractDetail.marking') : t('contractDetail.markCompleted')}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => act('terminate')}
                disabled={acting !== null}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.seal,
                  alignItems: 'center',
                  opacity: acting !== null ? 0.5 : 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <XCircle size={14} color={colors.seal} />
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>
                    {acting === 'terminate' ? t('contractDetail.terminating') : t('contractDetail.terminate')}
                  </Text>
                </View>
              </Pressable>
            </View>
          </Card>
        )}

        {nextPendingMilestone && (
          <Pressable
            onPress={() => navigation.navigate('RequestMaterials', { projectId: project.id, milestoneId: nextPendingMilestone.id })}
            accessibilityRole="button"
            style={{
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: colors.forest,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>
              {t('contractDetail.requestMaterials')}
            </Text>
          </Pressable>
        )}

        {contract.status === 'active' && (
          <PillButton variant="primary" onPress={() => navigation.navigate('MilestoneSubmit', { projectId: project.id })} fullWidth>
            {t('contractDetail.submitNextMilestone')}
          </PillButton>
        )}
      </View>
    </Screen>
  );
}
