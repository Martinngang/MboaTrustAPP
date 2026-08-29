import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ShieldCheck,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  FileCheck,
  UserCheck,
  Star,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useMyVerifierProfileQuery, useVerificationTasksQuery, type VerificationTask } from '../../api/verifier';
import type { MainStackParamList } from '../../navigation/types';

const FILTER_TABS = ['All', 'Assigned', 'In Progress', 'Completed'] as const;

export function VerifierDashboardScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const [activeTab, setActiveTab] = useState<(typeof FILTER_TABS)[number]>('All');

  const { data: profile, isLoading: isLoadingProfile } = useMyVerifierProfileQuery();
  const { data: tasks, isLoading: isLoadingTasks } = useVerificationTasksQuery();

  const filteredTasks = (tasks || []).filter((t) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Assigned') return t.status === 'assigned';
    if (activeTab === 'In Progress') return t.status === 'in_progress';
    if (activeTab === 'Completed') return t.status === 'submitted';
    return true;
  });

  return (
    <Screen
      header={
        <Header
          title={profile?.fullName || 'Field Verifier Workspace'}
          subtitle="Sworn Engineering & Cadastral Audits"
          back
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
                Profile
              </Text>
            </Pressable>
          }
        />
      }
    >
      <View style={{ padding: 16, gap: 18 }}>
        {/* Verifier Hero Stats */}
        <Card style={{ padding: 18, backgroundColor: colors.forestDark, gap: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                ONGC Sworn Expert
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 18, marginTop: 2 }}>
                {profile?.fullName || 'Dr. Christian Nguema'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <Star size={13} color="#FFD700" fill="#FFD700" />
              <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 12, fontWeight: '700' }}>
                4.9 ★
              </Text>
            </View>
          </View>

          {/* 3 Metric Tiles */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 }}>
              <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 9, textTransform: 'uppercase' }}>
                Active Audits
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 15, marginTop: 2 }}>
                {tasks?.filter((t) => t.status !== 'submitted').length || 2} Pending
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 }}>
              <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 9, textTransform: 'uppercase' }}>
                Completed
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 15, marginTop: 2 }}>
                {profile?.completedTasksCount || 18} Audits
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 }}>
              <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 9, textTransform: 'uppercase' }}>
                Earned Bounties
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 13, marginTop: 2 }}>
                {fmt(profile?.totalBountiesEarned || 1450000)}
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
                  {tab}
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
            title="No inspection tasks"
            description="Assigned milestone verifications and cadastral boundary audits will appear here."
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
                        {task.targetType === 'land_listing' ? 'Cadastral Land Audit' : 'Milestone Construction Audit'}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
                      {task.projectTitle}
                    </Text>
                    {task.milestoneTitle ? (
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                        Target: {task.milestoneTitle}
                      </Text>
                    ) : null}
                  </View>
                  <StatusBadge status={task.status} />
                </View>

                {/* Location & Due Date */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} color={colors.inkSubtle} />
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                      {task.location}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} color={colors.inkSubtle} />
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                      {task.dueDate}
                    </Text>
                  </View>
                </View>

                {/* Footer */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: colors.parchmentDark,
                  }}
                >
                  <View>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                      Audit Bounty Fee
                    </Text>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 15, marginTop: 1 }}>
                      {fmt(task.bountyFee)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
                      {task.status === 'submitted' ? 'View Report' : 'Perform Audit'}
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
