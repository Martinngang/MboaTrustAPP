import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
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
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useJobsQuery, useMyBidsQuery, useWithdrawableBalanceQuery } from '../api/contracts';
import type { MainStackParamList } from '../navigation/types';

export function JobsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [filter, setFilter] = useState<'open' | 'my_bids'>('open');

  const { data: jobs, isLoading: isLoadingJobs } = useJobsQuery();
  const { data: myBids, isLoading: isLoadingBids } = useMyBidsQuery();
  const { data: balance } = useWithdrawableBalanceQuery();

  const appliedJobIds = new Set((myBids || []).map((b) => b.projectId));

  return (
    <Screen>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Title Bar with Quick Actions */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20 }}>
              Contractor Workspace
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
              Bid on tenders & track verified escrow releases
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
                PAYOUTS →
              </Text>
            </View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16 }}>
              {fmt(balance?.withdrawableAmount || 4300000)}
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 10 }}>
              Available in Escrow
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
                CERTS →
              </Text>
            </View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.steel, fontSize: 16 }}>
              Verified (ONGC)
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 10 }}>
              Master Builder Profile
            </Text>
          </Pressable>
        </View>

        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { id: 'open', label: `Open Tenders (${jobs?.length || 3})` },
            { id: 'my_bids', label: `My Proposals (${myBids?.length || 2})` },
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

        {/* Open Tenders View */}
        {filter === 'open' && (
          <View style={{ gap: 12 }}>
            {isLoadingJobs ? (
              <ActivityIndicator color={colors.steel} style={{ marginTop: 20 }} />
            ) : (jobs || []).length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No tenders available"
                description="New client construction tenders will appear here."
              />
            ) : (
              (jobs || []).map((job) => {
                const hasApplied = appliedJobIds.has(job.id);
                return (
                  <Pressable
                    key={job.id}
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
                              Applied
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
                            Budget Envelope
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
                            Bid Now
                          </Text>
                          <ArrowRight size={13} color="#fff" />
                        </Pressable>
                      </View>
                    </Card>
                  </Pressable>
                );
              })
            )}
          </View>
        )}

        {/* My Proposals View */}
        {filter === 'my_bids' && (
          <View style={{ gap: 12 }}>
            {isLoadingBids ? (
              <ActivityIndicator color={colors.steel} style={{ marginTop: 20 }} />
            ) : (myBids || []).length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No proposals submitted"
                description="Browse open tenders above to submit your quotations."
              />
            ) : (
              (myBids || []).map((b) => (
                <Card key={b.id} style={{ padding: 14, gap: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14, flex: 1 }}>
                      {b.projectTitle}
                    </Text>
                    <StatusBadge status={b.status} />
                  </View>

                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                    Proposed: <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest }}>{fmt(b.proposedAmount)}</Text> · {b.estimatedDurationDays} Days
                  </Text>

                  {b.status === 'accepted' && (
                    <Pressable
                      onPress={() =>
                        navigation.navigate('MilestoneSubmit', {
                          projectId: b.projectId,
                          milestoneTitle: 'Foundation & Concrete Elevation',
                        })
                      }
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
                        Submit Milestone Proof
                      </Text>
                    </Pressable>
                  )}
                </Card>
              ))
            )}
          </View>
        )}
      </View>
    </Screen>
  );
}
