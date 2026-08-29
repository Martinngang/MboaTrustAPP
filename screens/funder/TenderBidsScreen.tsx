import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Briefcase,
  Star,
  ShieldCheck,
  Check,
  Clock,
  MessageSquare,
  ArrowRight,
} from 'lucide-react-native';
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
import { useBidsForProjectQuery, useAcceptBidMutation, type ContractorBid } from '../../api/tenders';
import type { MainStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<MainStackParamList, 'TenderBids'>;

const DEMO_BIDS: ContractorBid[] = [
  {
    id: 'bid-1',
    projectId: 'tender-1',
    contractorId: 'c-1',
    contractorName: 'Jean-Paul Kamga (ETS Kamga BTP)',
    proposedAmount: 4200000,
    estimatedDurationDays: 28,
    notes: 'We have a dedicated 8-person masonry crew and concrete mixer on standby in Odza. Full insurance and certified structural engineer oversight.',
    status: 'pending',
    rating: 4.9,
    completedJobs: 14,
    createdAt: '2 hours ago',
  },
  {
    id: 'bid-2',
    projectId: 'tender-1',
    contractorId: 'c-2',
    contractorName: 'Michel Talla (Talla Construction SARL)',
    proposedAmount: 4600000,
    estimatedDurationDays: 25,
    notes: 'Premium high-grade materials with laser-level leveling. Can start immediately upon escrow deposit confirmation.',
    status: 'pending',
    rating: 4.8,
    completedJobs: 9,
    createdAt: 'Yesterday',
  },
];

export function TenderBidsScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const acceptMutation = useAcceptBidMutation();

  const { jobId, jobTitle } = route.params;
  const { data: realBids, isLoading } = useBidsForProjectQuery(jobId);

  const bids = realBids && realBids.length > 0 ? realBids : DEMO_BIDS;

  const handleAcceptBid = (bid: ContractorBid) => {
    Alert.alert(
      'Accept Contractor Bid',
      `Accept bid from ${bid.contractorName} for ${fmt(bid.proposedAmount)}? This will initiate the formal escrow-protected contract.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Create Contract',
          onPress: async () => {
            try {
              await acceptMutation.mutateAsync({
                bidId: bid.id,
                projectId: jobId,
              });
              showToast({
                title: 'Bid Accepted!',
                description: `Contract generated with ${bid.contractorName}.`,
                tone: 'success',
              });
              navigation.goBack();
            } catch (err: any) {
              showToast({
                title: 'Acceptance Error',
                description: err?.message || 'Could not accept bid.',
                tone: 'error',
              });
            }
          },
        },
      ]
    );
  };

  return (
    <Screen header={<Header title="Contractor Proposals" subtitle={jobTitle} back />}>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Info Header */}
        <Card style={{ padding: 14, backgroundColor: colors.steel + '15', borderColor: colors.steel + '35', gap: 4 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.steel, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
            Tender Bids Overview
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
            {jobTitle}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
            {bids.length} verified contractor proposals received
          </Text>
        </Card>

        {/* Proposals List */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : bids.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No proposals yet"
            description="Contractors are reviewing your tender. You will receive a notification when new bids arrive."
          />
        ) : (
          bids.map((bid) => (
            <Card key={bid.id} style={{ padding: 16, gap: 12 }}>
              {/* Contractor Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar name={bid.contractorName} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
                    {bid.contractorName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Star size={12} color={colors.amber} fill={colors.amber} />
                      <Text style={{ fontFamily: FONT.mono, color: colors.ink, fontSize: 11, fontWeight: '700' }}>
                        {bid.rating}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11 }}>
                      · {bid.completedJobs} verified jobs
                    </Text>
                  </View>
                </View>
                <StatusBadge status={bid.status} />
              </View>

              {/* Proposal Notes */}
              <View style={{ backgroundColor: colors.parchment, borderRadius: 12, padding: 12 }}>
                <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 13, lineHeight: 18 }}>
                  "{bid.notes}"
                </Text>
              </View>

              {/* Proposed Metrics (Price & Timeline) */}
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
                    Proposed Price
                  </Text>
                  <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16, marginTop: 1 }}>
                    {fmt(bid.proposedAmount)}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                    Estimated Timeline
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Clock size={13} color={colors.inkSubtle} />
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                      {bid.estimatedDurationDays} Days
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <Pressable
                  onPress={() => handleAcceptBid(bid)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.forest,
                    borderRadius: 12,
                    paddingVertical: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 13 }}>
                    Accept Bid & Contract
                  </Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}
