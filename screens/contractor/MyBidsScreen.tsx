import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Briefcase,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useMyBidsQuery, type MyBidItem } from '../../api/contracts';
import type { MainStackParamList } from '../../navigation/types';

const FILTER_TABS = ['All', 'Pending', 'Accepted', 'Rejected'] as const;

export function MyBidsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [activeTab, setActiveTab] = useState<(typeof FILTER_TABS)[number]>('All');

  const { data: realBids, isLoading } = useMyBidsQuery();

  // Sample bids if not yet populated from backend
  const bids: MyBidItem[] =
    realBids && realBids.length > 0
      ? realBids
      : [
          {
            id: 'bid-101',
            projectId: 'proj-demo-1',
            projectTitle: 'Residential Foundation & Reinforced Masonry',
            category: 'Masonry & Concrete',
            location: 'Odza, Yaoundé (Centre)',
            proposedAmount: 4200000,
            targetBudget: 4500000,
            estimatedDurationDays: 28,
            notes: 'Masonry crew with laser-level surveyor ready for deployment.',
            status: 'accepted',
            createdAt: '2 days ago',
          },
          {
            id: 'bid-102',
            projectId: 'proj-demo-2',
            projectTitle: 'Borehole Drilling & Solar Pump System',
            category: 'Water & Sanitation',
            location: 'Mbalmayo (Centre)',
            proposedAmount: 3800000,
            targetBudget: 4000000,
            estimatedDurationDays: 14,
            notes: 'Geophysical deep borehole rig and 5000L tower installation.',
            status: 'pending',
            createdAt: 'Yesterday',
          },
        ];

  const filteredBids = bids.filter((b) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return b.status === 'pending' || b.status === 'countered';
    if (activeTab === 'Accepted') return b.status === 'accepted';
    if (activeTab === 'Rejected') return b.status === 'rejected';
    return true;
  });

  return (
    <Screen
      header={
        <Header
          title="My Proposals & Bids"
          subtitle={`${filteredBids.length} tenders`}
          back
        />
      }
    >
      <View style={{ padding: 16, gap: 16 }}>
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
                  borderColor: active ? colors.steel : colors.parchmentDark,
                  backgroundColor: active ? colors.steel + '15' : colors.surface,
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
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Proposals List */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.steel} />
          </View>
        ) : filteredBids.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No proposals found"
            description="You haven't submitted any bids in this category yet."
          />
        ) : (
          filteredBids.map((bid) => {
            const isAccepted = bid.status === 'accepted';
            return (
              <Card key={bid.id} style={{ padding: 16, gap: 12 }}>
                {/* Header Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
                      {bid.projectTitle}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <MapPin size={12} color={colors.inkSubtle} />
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                        {bid.location} · {bid.category}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={bid.status} />
                </View>

                {/* Proposed Metrics */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: colors.parchment,
                    padding: 12,
                    borderRadius: 12,
                  }}
                >
                  <View>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                      Your Proposed Bid
                    </Text>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16, marginTop: 1 }}>
                      {fmt(bid.proposedAmount)}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                      Timeline
                    </Text>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13, marginTop: 1 }}>
                      {bid.estimatedDurationDays} Days
                    </Text>
                  </View>
                </View>

                {/* Action Row */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: colors.parchmentDark,
                  }}
                >
                  {isAccepted ? (
                    <Pressable
                      onPress={() =>
                        navigation.navigate('MilestoneSubmit', {
                          projectId: bid.projectId,
                          milestoneTitle: 'Foundation & Earthworks',
                        })
                      }
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        backgroundColor: colors.forest,
                        paddingVertical: 10,
                        borderRadius: 12,
                      }}
                    >
                      <CheckCircle2 size={15} color="#fff" />
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 13 }}>
                        Submit Milestone Proof
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => navigation.navigate('JobDetail', { jobId: bid.projectId })}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        backgroundColor: colors.parchment,
                        paddingVertical: 10,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                        View Tender Details
                      </Text>
                      <ArrowRight size={14} color={colors.ink} />
                    </Pressable>
                  )}
                </View>
              </Card>
            );
          })
        )}
      </View>
    </Screen>
  );
}
