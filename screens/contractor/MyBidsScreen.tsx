import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Briefcase,
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
import { useBidsQuery, type Bid } from '../../api/tenders';
import { useApp } from '../../context/AppContext';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';
import type { TranslationKey } from '../../i18n/translations';

const FILTER_TABS = ['All', 'Pending', 'Accepted', 'Rejected'] as const;
const FILTER_TAB_KEY: Record<(typeof FILTER_TABS)[number], TranslationKey> = {
  All: 'myBids.tabAll',
  Pending: 'myBids.tabPending',
  Accepted: 'myBids.tabAccepted',
  Rejected: 'myBids.tabRejected',
};

export function MyBidsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [activeTab, setActiveTab] = useState<(typeof FILTER_TABS)[number]>('All');

  const { user } = useApp();
  const { data: bids, isLoading } = useBidsQuery({ contractorId: user?._id });

  const filteredBids = (bids || []).filter((b) => {
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
          title={t('myBids.title')}
          subtitle={`${filteredBids.length} ${t('myBids.tenders')}`}
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
                  {t(FILTER_TAB_KEY[tab])}
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
            title={t('myBids.noProposalsFound')}
            description={t('myBids.noProposalsDesc')}
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
                      {bid.jobTitle || t('myBids.tenderFallback')}
                    </Text>
                  </View>
                  {bid.status === 'pending' ? (
                    <View
                      style={{
                        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                        backgroundColor: bid.lastProposedBy === 'contractor' ? colors.steel + '18' : colors.amber + '20',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONT.mono, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
                          color: bid.lastProposedBy === 'contractor' ? colors.steel : colors.amber,
                        }}
                      >
                        {bid.lastProposedBy === 'contractor' ? t('myBids.awaitingFunder') : t('myBids.yourTurn')}
                      </Text>
                    </View>
                  ) : (
                    <StatusBadge status={bid.status} />
                  )}
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
                      {t('myBids.yourProposedBid')}
                    </Text>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16, marginTop: 1 }}>
                      {fmt(bid.price)}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                      {t('myBids.timeline')}
                    </Text>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13, marginTop: 1 }}>
                      {bid.timelineDays} {t('myBids.days')}
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
                      onPress={() => navigation.navigate('ContractDetail', { bidId: bid.id })}
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
                        {t('myBids.viewContract')}
                      </Text>
                    </Pressable>
                  ) : bid.status === 'pending' ? (
                    <Pressable
                      onPress={() => navigation.navigate('Negotiation', { bidId: bid.id })}
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
                        {t('myBids.viewNegotiation')}
                      </Text>
                      <ArrowRight size={14} color={colors.ink} />
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => navigation.navigate('JobDetail', { jobId: bid.jobId })}
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
                        {t('myBids.viewTenderDetails')}
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
