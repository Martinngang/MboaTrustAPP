import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Award,
  Wallet,
  CheckCircle2,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { fmt } from '../components/fmt';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useListBottomPadding } from '../hooks/useListBottomPadding';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useJobsQuery, useBidsQuery } from '../api/tenders';
import { useWithdrawableBalanceQuery, useCertificationsQuery } from '../api/contracts';
import { useApp } from '../context/AppContext';
import type { MainStackParamList } from '../navigation/types';
import { useTranslation } from '../i18n/useTranslation';

export function JobsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [filter, setFilter] = useState<'open' | 'my_bids'>('open');
  const { user } = useApp();
  const pullToRefresh = usePullToRefresh();
  const bottomPadding = useListBottomPadding();

  const { data: jobs, isLoading: isLoadingJobs } = useJobsQuery();
  const { data: myBids, isLoading: isLoadingBids } = useBidsQuery({ contractorId: user?._id });
  const { data: balance } = useWithdrawableBalanceQuery();
  const { data: certs } = useCertificationsQuery();

  const openJobs = (jobs || []).filter((j) => j.status === 'open');
  const appliedJobIds = new Set((myBids || []).map((b) => b.jobId));
  const verifiedCertCount = (certs || []).filter((c) => c.verified).length;

  return (
    <Screen scroll={false} contentContainerStyle={{ paddingBottom: 0 }}>
      <View style={{ flex: 1 }}>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Title Bar with Quick Actions */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20 }}>
              {t('jobs.workspaceTitle')}
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
              {t('jobs.workspaceSubtitle')}
            </Text>
          </View>
        </View>

        {/* Quick Earnings & Certs Shortcut Cards */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={() => navigation.navigate('EarningsWithdraw')}
            style={{
              flex: 1,
              backgroundColor: colors.forest + '15',
              borderWidth: 1,
              borderColor: colors.forest + '35',
              borderRadius: 16,
              padding: 12,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Wallet size={16} color={colors.forest} />
              <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, fontWeight: '700' }}>
                {t('jobs.payouts')}
              </Text>
            </View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16 }}>
              {fmt(balance?.available || 0)}
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 10 }}>
              {t('jobs.availableInEscrow')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('ContractorCerts')}
            style={{
              flex: 1,
              backgroundColor: colors.steel + '15',
              borderWidth: 1,
              borderColor: colors.steel + '35',
              borderRadius: 16,
              padding: 12,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Award size={16} color={colors.steel} />
              <Text style={{ fontFamily: FONT.mono, color: colors.steel, fontSize: 10, fontWeight: '700' }}>
                {t('jobs.certs')}
              </Text>
            </View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.steel, fontSize: 16 }}>
              {verifiedCertCount > 0 ? `${verifiedCertCount} ${t('jobs.verifiedCount')}` : t('jobs.noneYet')}
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 10 }}>
              {t('jobs.licensesAndCerts')}
            </Text>
          </Pressable>
        </View>

        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { id: 'open', label: `${t('jobs.openTenders')} (${openJobs.length})` },
            { id: 'my_bids', label: `${t('jobs.myProposals')} (${myBids?.length || 0})` },
          ].map((tab) => {
            const active = filter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setFilter(tab.id as any)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? colors.steel : colors.parchmentDark,
                  backgroundColor: active ? colors.steel + '18' : colors.surface,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT.sansMedium,
                    fontSize: 12,
                    color: active ? colors.steel : colors.inkMuted,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Open Tenders View */}
      {filter === 'open' ? (
        <FlatList
          data={openJobs}
          keyExtractor={(job) => job.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          refreshing={pullToRefresh.refreshing}
          onRefresh={pullToRefresh.onRefresh}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            isLoadingJobs ? (
              <ActivityIndicator color={colors.steel} style={{ marginTop: 20 }} />
            ) : (
              <EmptyState
                icon={Briefcase}
                title={t('jobs.noTendersAvailable')}
                description={t('jobs.noTendersDesc')}
              />
            )
          }
          renderItem={({ item: job }) => {
            const hasApplied = appliedJobIds.has(job.id);
            return (
              <Pressable
                onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
                accessibilityRole="button"
              >
                <Card style={{ padding: 16, gap: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: colors.steel + '15',
                          marginBottom: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: FONT.mono,
                            color: colors.steel,
                            fontSize: 10,
                            textTransform: 'uppercase',
                          }}
                        >
                          {job.category}
                        </Text>
                      </View>
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                        {job.title}
                      </Text>
                    </View>
                    {hasApplied ? (
                      <View style={{ backgroundColor: colors.forest + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, fontWeight: '700' }}>
                          {t('jobs.applied')}
                        </Text>
                      </View>
                    ) : (
                      <StatusBadge status={job.status} />
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} color={colors.inkSubtle} />
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                      {job.location}
                    </Text>
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
                        {t('jobs.budgetEnvelope')}
                      </Text>
                      <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 15, marginTop: 1 }}>
                        {fmt(job.budget)}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() =>
                        navigation.navigate('SubmitBid', {
                          jobId: job.id,
                          jobTitle: job.title,
                          budget: job.budget,
                        })
                      }
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: colors.steel,
                      }}
                    >
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>
                        {t('jobs.bidNow')}
                      </Text>
                      <ArrowRight size={13} color="#fff" />
                    </Pressable>
                  </View>
                </Card>
              </Pressable>
            );
          }}
        />
      ) : (
        <FlatList
          data={myBids || []}
          keyExtractor={(b) => b.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          refreshing={pullToRefresh.refreshing}
          onRefresh={pullToRefresh.onRefresh}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            isLoadingBids ? (
              <ActivityIndicator color={colors.steel} style={{ marginTop: 20 }} />
            ) : (
              <EmptyState
                icon={Briefcase}
                title={t('jobs.noProposalsSubmitted')}
                description={t('jobs.browseTendersDesc')}
              />
            )
          }
          renderItem={({ item: b }) => (
            <Card style={{ padding: 14, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14, flex: 1 }}>
                  {b.jobTitle || t('jobs.tenderFallback')}
                </Text>
                <StatusBadge status={b.status} />
              </View>

              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                {t('jobs.proposed')} <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest }}>{fmt(b.price)}</Text> · {b.timelineDays} {t('jobs.days')}
              </Text>

              {b.status === 'accepted' && (
                <Pressable
                  onPress={() => navigation.navigate('ContractDetail', { bidId: b.id })}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: colors.forest,
                    paddingVertical: 8,
                    borderRadius: 10,
                    marginTop: 4,
                  }}
                >
                  <CheckCircle2 size={14} color="#fff" />
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>
                    {t('jobs.viewContract')}
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
