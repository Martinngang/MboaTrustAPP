import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FolderKanban, Briefcase, Plus, MapPin, ShieldCheck, ArrowUpRight, XCircle } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { fmt } from '../components/fmt';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useListBottomPadding } from '../hooks/useListBottomPadding';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import { useMyFundedProjectsQuery } from '../api/projects';
import { useMyTendersQuery, useCancelJobMutation } from '../api/tenders';
import { useToast } from '../components/Toast';
import { apiErrorMessage } from '../api/client';
import type { MainStackParamList } from '../navigation/types';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translations';

const FILTER_TABS = ['All', 'Active', 'Under Review', 'Completed'] as const;
const FILTER_TAB_KEY: Record<(typeof FILTER_TABS)[number], TranslationKey> = {
  All: 'projects.filterAll',
  Active: 'projects.filterActive',
  'Under Review': 'projects.filterUnderReview',
  Completed: 'projects.filterCompleted',
};
// Posted tenders are a separate Project pillar (projectType: 'tender',
// funder-owned) from the funding-type projects above — kept as its own tab
// rather than merged into one list, matching web's WorkspaceProjectsScreen.
// This is the direct fix for "I posted a tender and can't find it anywhere":
// mobile previously had no screen at all showing a funder's own tenders.
const SECTIONS = ['Funded Projects', 'Posted Tenders'] as const;
const SECTION_KEY: Record<(typeof SECTIONS)[number], TranslationKey> = {
  'Funded Projects': 'projects.sectionFunded',
  'Posted Tenders': 'projects.sectionPosted',
};

export function ProjectsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [section, setSection] = useState<(typeof SECTIONS)[number]>('Funded Projects');
  const [activeFilter, setActiveFilter] = useState<(typeof FILTER_TABS)[number]>('All');
  const { show: showToast } = useToast();
  const pullToRefresh = usePullToRefresh();
  const bottomPadding = useListBottomPadding();

  const { data: projects, isLoading } = useMyFundedProjectsQuery(user?._id);
  const { data: tenders, isLoading: tendersLoading } = useMyTendersQuery(user?._id);
  const cancelJob = useCancelJobMutation();

  const filtered = (projects || []).filter((p) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Active') return p.status === 'active' || p.status === 'in_progress';
    if (activeFilter === 'Under Review') return p.status === 'under_review' || p.status === 'pending';
    if (activeFilter === 'Completed') return p.status === 'completed' || p.status === 'released';
    return true;
  });

  const handleCloseTender = async (jobId: string) => {
    try {
      await cancelJob.mutateAsync(jobId);
      showToast({ title: t('projects.tenderClosed'), tone: 'success' });
    } catch (err) {
      showToast({ title: t('projects.closeFailed'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  return (
    <Screen scroll={false} contentContainerStyle={{ paddingBottom: 0 }}>
      <View style={{ flex: 1 }}>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Title Bar with Quick Action */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20 }}>
              {t('projects.title')}
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
              {t('projects.subtitle')}
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('PostJob')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 14,
              backgroundColor: colors.forest,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Plus size={14} color="#fff" strokeWidth={3} />
            <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>
              {t('projects.newProject')}
            </Text>
          </Pressable>
        </View>

        {/* Section Switcher — Funded Projects vs Posted Tenders */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {SECTIONS.map((s) => {
            const active = section === s;
            return (
              <Pressable
                key={s}
                onPress={() => setSection(s)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: active ? colors.forest : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.forest : colors.parchmentDark,
                }}
              >
                <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 12, color: active ? '#fff' : colors.inkMuted }}>
                  {t(SECTION_KEY[s])}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Filter Chips */}
        {section === 'Funded Projects' && (
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {FILTER_TABS.map((tab) => {
            const active = activeFilter === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveFilter(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? colors.forest : colors.parchmentDark,
                  backgroundColor: active ? colors.forest + '15' : colors.surface,
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
        )}
      </View>

      {/* Projects / Tenders List */}
      {section === 'Funded Projects' ? (
        <FlatList
          data={filtered}
          keyExtractor={(project) => project.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          refreshing={pullToRefresh.refreshing}
          onRefresh={pullToRefresh.onRefresh}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          ListEmptyComponent={
            isLoading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator color={colors.forest} />
              </View>
            ) : (
              <EmptyState
                icon={FolderKanban}
                title={t('projects.noProjectsFound')}
                description={
                  projects && projects.length > 0
                    ? t('projects.noMatchFilter')
                    : t('projects.trackedHere')
                }
              />
            )
          }
          renderItem={({ item: project }) => (
            <Pressable
              onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
              accessibilityRole="button"
            >
              <Card style={{ padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
                      {project.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <MapPin size={12} color={colors.inkSubtle} />
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                        {project.locationName || t('projects.cameroon')}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={project.status} />
                </View>

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
                      {t('projects.totalBudget')}
                    </Text>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 15, marginTop: 2 }}>
                      {fmt(project.totalAmount || 0)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={14} color={colors.forest} />
                    <Text style={{ fontFamily: FONT.sansMedium, color: colors.forest, fontSize: 12 }}>
                      {t('projects.escrowLocked')}
                    </Text>
                    <ArrowUpRight size={14} color={colors.forest} />
                  </View>
                </View>
              </Card>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={tenders || []}
          keyExtractor={(job) => job.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          refreshing={pullToRefresh.refreshing}
          onRefresh={pullToRefresh.onRefresh}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          ListEmptyComponent={
            tendersLoading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator color={colors.forest} />
              </View>
            ) : (
              <EmptyState
                icon={Briefcase}
                title={t('projects.noTendersPostedYet')}
                description={t('projects.postJobToReceiveBids')}
              />
            )
          }
          renderItem={({ item: job }) => (
            <Card style={{ padding: 16, gap: 12 }}>
              <Pressable
                onPress={() => navigation.navigate('TenderBids', { jobId: job.id, jobTitle: job.title })}
                accessibilityRole="button"
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
                      {job.title}
                    </Text>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', marginTop: 4 }}>
                      {job.category} · {job.location || t('projects.cameroon')} · {fmt(job.budget)}
                    </Text>
                  </View>
                  <StatusBadge status={job.status} />
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 10,
                    marginTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: colors.parchmentDark,
                  }}
                >
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                    {job.bids} {job.bids === 1 ? t('projects.bidReceived') : t('projects.bidsReceived')}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontFamily: FONT.sansMedium, color: colors.forest, fontSize: 12 }}>
                      {t('projects.viewBids')}
                    </Text>
                    <ArrowUpRight size={14} color={colors.forest} />
                  </View>
                </View>
              </Pressable>

              {/* Only an open tender with no accepted bid can be closed —
                  the backend rejects the request otherwise (see
                  projectController.cancel), so this only needs to gate on
                  the one client-visible signal that matters here. */}
              {job.status === 'open' && (
                <Pressable
                  onPress={() => handleCloseTender(job.id)}
                  accessibilityRole="button"
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
                >
                  <XCircle size={13} color={colors.seal} />
                  <Text style={{ fontFamily: FONT.sansMedium, color: colors.seal, fontSize: 12 }}>
                    {t('projects.closeTender')}
                  </Text>
                </Pressable>
              )}
            </Card>
          )}
        />
      )}
      </View>
    </Screen>
  );
}
