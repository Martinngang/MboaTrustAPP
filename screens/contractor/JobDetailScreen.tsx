import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
  ArrowRight,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { PillButton } from '../../components/PillButton';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useProjectQuery } from '../../api/projects';
import type { MainStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<MainStackParamList, 'JobDetail'>;

export function JobDetailScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { jobId } = route.params;

  const { data: job, isLoading } = useProjectQuery(jobId);

  if (isLoading) {
    return (
      <Screen header={<Header title="Tender Details" back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.steel} />
        </View>
      </Screen>
    );
  }

  // Fallback demo job if not directly in mock db
  const jobData = job || {
    id: jobId,
    title: 'Residential Villa Structural Masonry & Concrete',
    category: 'Masonry & Concrete',
    location: 'Odza, Yaoundé (Centre)',
    description: 'Looking for a certified contractor to execute foundation slab casting, reinforced masonry columns, and beam elevation according to approved engineering plans.',
    totalAmount: 4500000,
    raised: 4500000,
    released: 0,
    escrowBalance: 4500000,
    status: 'open',
    ownerId: 'funder-1',
    ownerName: 'Marie-Claire N. (Diaspora Funder)',
    milestones: [
      {
        id: 'm-1',
        title: 'Site Preparation & Foundation Slab',
        description: 'Excavation, leveling, and foundation concrete pouring with rebar cage',
        amount: 1800000,
        status: 'pending',
        requiresVideo: true,
        requiresMultiApproval: false,
        evidence: [],
        approvers: [],
      },
      {
        id: 'm-2',
        title: 'Wall Elevation & Lintel Beams',
        description: 'Parpaing bricklaying, reinforced concrete pillars, and beam casting',
        amount: 1700000,
        status: 'pending',
        requiresVideo: true,
        requiresMultiApproval: false,
        evidence: [],
        approvers: [],
      },
      {
        id: 'm-3',
        title: 'Roof Framing & Final Site Inspection',
        description: 'Roof truss installation, sheeting, and final structural signoff',
        amount: 1000000,
        status: 'pending',
        requiresVideo: false,
        requiresMultiApproval: true,
        evidence: [],
        approvers: [],
      },
    ],
  };

  return (
    <Screen header={<Header title="Tender Details" subtitle={jobData.location} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Tender Header Card */}
        <Card style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: colors.steel + '15',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  marginBottom: 6,
                }}
              >
                <Text style={{ fontFamily: FONT.mono, color: colors.steel, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
                  {jobData.category}
                </Text>
              </View>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                {jobData.title}
              </Text>
            </View>
            <StatusBadge status="open" />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPin size={13} color={colors.inkSubtle} />
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
              {jobData.location}
            </Text>
          </View>

          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, lineHeight: 19 }}>
            {jobData.description}
          </Text>
        </Card>

        {/* Budget & Timeline Card */}
        <Card style={{ padding: 16, gap: 14 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Financial & Escrow Terms
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                Client Budget Envelope
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 20, marginTop: 2 }}>
                {fmt(jobData.totalAmount)}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                Payment Protection
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <ShieldCheck size={16} color={colors.forest} />
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>
                  100% Escrowed
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.forest + '12',
              borderWidth: 1,
              borderColor: colors.forest + '30',
            }}
          >
            <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12, lineHeight: 17 }}>
              Milestone payments are locked safely in MboaTrust Escrow prior to project commencement and released directly to your account upon verified completion.
            </Text>
          </View>
        </Card>

        {/* Expected Milestone Tranches */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Required Milestones ({jobData.milestones.length})
          </Text>

          {jobData.milestones.map((m, idx) => (
            <Card key={m.id || idx} style={{ padding: 14, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: FONT.mono, color: colors.steel, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
                  Tranche {idx + 1}
                </Text>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 14 }}>
                  {fmt(m.amount)}
                </Text>
              </View>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                {m.title}
              </Text>
              {m.description ? (
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
                  {m.description}
                </Text>
              ) : null}
            </Card>
          ))}
        </View>

        {/* Submit Bid Action */}
        <PillButton
          variant="primary"
          onPress={() =>
            navigation.navigate('SubmitBid', {
              jobId: jobData.id,
              jobTitle: jobData.title,
              budget: jobData.totalAmount,
            })
          }
          fullWidth
        >
          Submit Proposal & Milestone Bid
        </PillButton>
      </View>
    </Screen>
  );
}
