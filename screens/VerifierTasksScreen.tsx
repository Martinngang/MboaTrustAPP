import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShieldCheck, MapPin, ArrowRight, UserCheck } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useMyVerifierProfileQuery, useVerificationTasksQuery } from '../api/verifier';
import { useApp } from '../context/AppContext';
import type { MainStackParamList } from '../navigation/types';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translations';

// The single, canonical "browse my verification tasks" implementation —
// reused under two names/entry points (this bottom-tab screen, and
// screens/verifier/VerifierDashboardScreen.tsx's quick-action shortcut,
// which just re-exports this component). These used to be two independently
// maintained copies that had already drifted apart (different filter sets,
// one missing hero stats/profile link, the other missing pull-to-refresh) —
// now there's one implementation to keep correct.
const FILTER_TABS = ['All', 'Assigned', 'In Progress', 'Completed'] as const;
const FILTER_TAB_KEY: Record<(typeof FILTER_TABS)[number], TranslationKey> = {
  All: 'verifierDash.tabAll',
  Assigned: 'verifierDash.tabAssigned',
  'In Progress': 'verifierDash.tabInProgress',
  Completed: 'verifierDash.tabCompleted',
};

export function VerifierTasksScreen() {
  return <VerifierTaskListContent showBack={false} />;
}

/** Exported so screens/verifier/VerifierDashboardScreen.tsx (the same task
 * list, reached via the global quick-action shortcut instead of the bottom
 * tab) can render it with a back button instead of duplicating the screen. */
export function VerifierTaskListContent({ showBack }: { showBack: boolean }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user } = useApp();
  const pullToRefresh = usePullToRefresh();

  const [activeTab, setActiveTab] = useState<(typeof FILTER_TABS)[number]>('All');

  const { data: profile } = useMyVerifierProfileQuery();
  const { data: tasks, isLoading: isLoadingTasks } = useVerificationTasksQuery();

  const filteredTasks = (tasks || []).filter((task) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Assigned') return task.status === 'assigned';
    if (activeTab === 'In Progress') return task.status === 'in_progress';
    if (activeTab === 'Completed') return task.status === 'submitted';
    return true;
  });
  const completedCount = (tasks || []).filter((task) => task.status === 'submitted').length;

  return (
    <Screen
      {...pullToRefresh}
      header={
        <Header
          title={profile?.fullName || user?.fullName || t('verifierDash.workspaceFallback')}
          subtitle={t('verifierDash.subtitle')}
          back={showBack}
          action={
            <Pressable
              onPress={() => navigation.navigate('VerifierProfile')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 14,
                backgroundColor: colors.forest + '20',
              }}
            >
              <UserCheck size={14} color={colors.forest} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
                {t('verifierDash.profile')}
              </Text>
            </Pressable>
          }
        />
      }
    >
      <View style={{ padding: 16, gap: 18 }}>
        {/* Verifier Hero Stats */}
        <Card style={{ padding: 18, backgroundColor: colors.forestDark, gap: 14 }}>
          <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('verifierDash.fieldVerifier')}
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 18, marginTop: -8 }}>
            {profile?.fullName || user?.fullName || t('verifierDash.verifierFallback')}
          </Text>

          {/* 2 real metric tiles — no rating/bounty fields exist on the
              backend, so only what's genuinely derivable from real tasks
              is shown here. */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 }}>
              <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 9, textTransform: 'uppercase' }}>
                {t('verifierDash.activeAudits')}
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 15, marginTop: 2 }}>
                {(tasks || []).filter((task) => task.status !== 'submitted').length} {t('verifierDash.pending')}
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 }}>
              <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 9, textTransform: 'uppercase' }}>
                {t('verifierDash.completed')}
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 15, marginTop: 2 }}>
                {completedCount} {t('verifierDash.audits')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {FILTER_TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? colors.forest : colors.parchmentDark,
                  backgroundColor: active ? colors.forest + '18' : colors.surface,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT.sansMedium,
                    fontSize: 12,
                    color: active ? colors.forest : colors.inkMuted,
                  }}
                >
                  {t(FILTER_TAB_KEY[tab])}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tasks List */}
        {isLoadingTasks ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title={t('verifierDash.noInspectionTasks')}
            description={t('verifierDash.noTasksDesc')}
          />
        ) : (
          filteredTasks.map((task) => (
            <Pressable
              key={task.id}
              onPress={() => navigation.navigate('VerifierTaskDetail', { taskId: task.id })}
              accessibilityRole="button"
            >
              <Card style={{ padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                        backgroundColor: task.targetType === 'land_listing' ? colors.seal + '18' : colors.forest + '18',
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONT.mono,
                          color: task.targetType === 'land_listing' ? colors.seal : colors.forest,
                          fontSize: 10,
                          fontWeight: '700',
                          textTransform: 'uppercase',
                        }}
                      >
                        {task.targetType === 'land_listing' ? t('verifierDash.cadastralLandAudit') : t('verifierDash.milestoneConstructionAudit')}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
                      {task.projectTitle}
                    </Text>
                    {task.milestoneTitle ? (
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                        {t('verifierDash.target')} {task.milestoneTitle}
                      </Text>
                    ) : null}
                  </View>
                  <StatusBadge status={task.status} />
                </View>

                {/* Location */}
                {task.location ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} color={colors.inkSubtle} />
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                      {task.location}
                    </Text>
                  </View>
                ) : null}

                {/* Footer */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: colors.parchmentDark,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
                      {task.status === 'submitted' ? t('verifierDash.viewReport') : t('verifierDash.performAudit')}
                    </Text>
                    <ArrowRight size={13} color={colors.forest} />
                  </View>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}
