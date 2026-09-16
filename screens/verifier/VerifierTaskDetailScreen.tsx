import { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ShieldCheck,
  MapPin,
  Compass,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Layers,
  ArrowRight,
  Camera,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useVerificationTasksQuery, useStartVerificationTaskMutation } from '../../api/verifier';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'VerifierTaskDetail'>;

export function VerifierTaskDetailScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { taskId } = route.params;
  const { data: tasks, isLoading } = useVerificationTasksQuery();
  const startMutation = useStartVerificationTaskMutation();

  const task = (tasks || []).find((tk) => tk.id === taskId) || (tasks || [])[0];

  if (isLoading || !task) {
    return (
      <Screen header={<Header title={t('verifierTaskDetail.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync(task.id);
      showToast({
        title: t('verifierTaskDetail.auditInProgress'),
        description: t('verifierTaskDetail.siteInspectionInitiated'),
        tone: 'success',
      });
    } catch (err) {
      showToast({ title: t('verifierTaskDetail.error'), description: apiErrorMessage(err, t('verifierTaskDetail.couldNotStartAudit')), tone: 'error' });
    }
  };

  const checklistItems = [
    { title: t('verifierTaskDetail.checklistItem1Title'), detail: t('verifierTaskDetail.checklistItem1Detail') },
    { title: t('verifierTaskDetail.checklistItem2Title'), detail: t('verifierTaskDetail.checklistItem2Detail') },
    { title: t('verifierTaskDetail.checklistItem3Title'), detail: t('verifierTaskDetail.checklistItem3Detail') },
    { title: t('verifierTaskDetail.checklistItem4Title'), detail: t('verifierTaskDetail.checklistItem4Detail') },
  ];

  return (
    <Screen header={<Header title={t('verifierTaskDetail.inspectionTask')} subtitle={task.projectTitle} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Task Header Card */}
        <Card style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
                {task.targetType === 'land_listing' ? t('verifierTaskDetail.cadastralAudit') : t('verifierTaskDetail.milestoneVerification')}
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18, marginTop: 2 }}>
                {task.projectTitle}
              </Text>
              {task.milestoneTitle ? (
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                  {t('verifierTaskDetail.tranche')} {task.milestoneTitle}
                </Text>
              ) : null}
            </View>
            <StatusBadge status={task.status} />
          </View>

          {/* Location */}
          {task.location ? (
            <View style={{ backgroundColor: colors.parchment, borderRadius: 12, padding: 12, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color={colors.forest} />
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                  {task.location}
                </Text>
              </View>
            </View>
          ) : null}
        </Card>

        {/* Inspection Verification Checklist */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('verifierTaskDetail.expertStandards')}
          </Text>

          <View style={{ gap: 10 }}>
            {checklistItems.map((item, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.forest + '15',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                  }}
                >
                  <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 11, fontWeight: '700' }}>
                    {idx + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11, marginTop: 1 }}>
                    {item.detail}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Submitted Report Review (if completed) */}
        {task.status === 'submitted' && (
          <Card style={{ padding: 16, gap: 10, backgroundColor: colors.forest + '12', borderColor: colors.forest + '30' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color={colors.forest} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 14 }}>
                {t('verifierTaskDetail.reportSubmittedSigned')}
              </Text>
            </View>
            <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 13, lineHeight: 18 }}>
              {task.reportText}
            </Text>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11 }}>
              {t('verifierTaskDetail.verdictLabel')} {task.confirmedMatch ? t('verifierTaskDetail.passedApproved') : t('verifierTaskDetail.flaggedDefect')}
            </Text>
            {task.reportPhotos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {task.reportPhotos.map((uri, idx) => (
                  <Image key={idx} source={{ uri }} style={{ width: 140, height: 100, borderRadius: 10, backgroundColor: colors.parchment }} resizeMode="cover" />
                ))}
              </ScrollView>
            )}
          </Card>
        )}

        {/* Action Decision */}
        <View style={{ gap: 10, marginTop: 4 }}>
          {task.status === 'assigned' && (
            <PillButton
              variant="primary"
              onPress={handleStart}
              loading={startMutation.isPending}
              disabled={startMutation.isPending}
              fullWidth
            >
              {t('verifierTaskDetail.acceptAndBegin')}
            </PillButton>
          )}

          {task.status === 'in_progress' && (
            <PillButton
              variant="primary"
              onPress={() =>
                navigation.navigate('VerifierSubmitReport', {
                  taskId: task.id,
                  projectTitle: task.projectTitle,
                  milestoneTitle: task.milestoneTitle || t('verifierSubmitReport.milestoneVerificationFallback'),
                })
              }
              fullWidth
            >
              {t('verifierTaskDetail.submitReportAndVerdict')}
            </PillButton>
          )}

          {task.status === 'submitted' && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: colors.forest + '20',
                paddingVertical: 12,
                borderRadius: 14,
              }}
            >
              <ShieldCheck size={16} color={colors.forest} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>
                {t('verifierTaskDetail.auditCompleted')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}
