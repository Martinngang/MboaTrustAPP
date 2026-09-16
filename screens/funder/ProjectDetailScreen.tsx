import { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  MapPin,
  ShieldCheck,
  Calendar,
  Lock,
  CheckCircle2,
  Video,
  Users,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { PillButton } from '../../components/PillButton';
import { AIConstructionDelayCard } from '../../components/AIConstructionDelayCard';
import { ContractPDFViewerModal } from '../../components/ContractPDFViewerModal';
import { WhatsAppShareCard } from '../../components/WhatsAppShareCard';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useProjectQuery } from '../../api/projects';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'ProjectDetail'>;

const CAMEROON_REGIONS = ['Adamaoua', 'Centre', 'Est', 'Extrême-Nord', 'Littoral', 'Nord-Ouest', 'Nord', 'Ouest', 'Sud-Ouest', 'Sud'];

/** Real region derivation from the project's own location string — never a
 * guessed default. `locationName` commonly already includes the region
 * (e.g. "Douala, Littoral"), matching how PostJobScreen constructs it. */
function deriveRegion(locationName: string): string | null {
  return CAMEROON_REGIONS.find((r) => locationName.includes(r)) || null;
}

export function ProjectDetailScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { projectId } = route.params;
  const [contractModalOpen, setContractModalOpen] = useState(false);

  const { data: project, isLoading } = useProjectQuery(projectId);

  if (isLoading) {
    return (
      <Screen header={<Header title={t('projectDetail.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator size="large" color={colors.forest} />
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, marginTop: 12, fontSize: 13 }}>
            {t('projectDetail.loadingData')}
          </Text>
        </View>
      </Screen>
    );
  }

  if (!project) {
    return (
      <Screen header={<Header title={t('projectDetail.title')} back />}>
        <View style={{ padding: 24, alignItems: 'center', gap: 12 }}>
          <AlertCircle size={40} color={colors.seal} />
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
            {t('projectDetail.notFoundTitle')}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13, textAlign: 'center' }}>
            {t('projectDetail.notFoundDesc')}
          </Text>
          <PillButton onPress={() => navigation.goBack()} variant="secondary">
            {t('projectDetail.goBack')}
          </PillButton>
        </View>
      </Screen>
    );
  }

  const progress = project.totalAmount > 0 ? Math.min(100, Math.round((project.raised / project.totalAmount) * 100)) : 0;
  const remainingToFund = Math.max(0, project.totalAmount - project.raised);
  const region = deriveRegion(project.locationName || '');

  return (
    <Screen header={<Header title={project.title} subtitle={project.location} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Project Hero Banner */}
        <Card style={{ overflow: 'hidden' }}>
          <View style={{ height: 190, backgroundColor: colors.parchment, position: 'relative' }}>
            <Image
              source={{ uri: project.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            <View
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                backgroundColor: 'rgba(0,0,0,0.7)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 10,
              }}
            >
              <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 11, textTransform: 'uppercase' }}>
                {project.category}
              </Text>
            </View>
            <View style={{ position: 'absolute', top: 12, right: 12 }}>
              <StatusBadge status={project.status} />
            </View>
          </View>

          {/* Details Body */}
          <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 19 }}>
              {project.title}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} color={colors.inkSubtle} />
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>
                  {project.location}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={14} color={colors.forest} />
                <Text style={{ fontFamily: FONT.sansMedium, color: colors.forest, fontSize: 13 }}>
                  {t('projectDetail.escrowVerified')}
                </Text>
              </View>
            </View>

            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, lineHeight: 19 }}>
              {project.description}
            </Text>

            {/* Legal OHADA Agreement Button */}
            <Pressable
              onPress={() => setContractModalOpen(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.parchment,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.parchmentDark,
                marginTop: 6,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>⚖️</Text>
                <View>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 12 }}>
                    {t('projectDetail.ohadaContractTitle')}
                  </Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10 }}>
                    {t('projectDetail.ohadaContractSub')}
                  </Text>
                </View>
              </View>
              <ArrowRight size={14} color={colors.forest} />
            </Pressable>
          </View>
        </Card>

        {/* AI Rainy Season & Meteorological Delay Forecast — only shown when a
            real region can be derived from the project's own location; a
            hardcoded regional default would misrepresent every project as
            being in the same place. */}
        {region ? <AIConstructionDelayCard regionName={region} milestoneType="foundation" /> : null}

        {/* 1-Tap WhatsApp Family Status Card */}
        <WhatsAppShareCard
          projectName={project.title}
          locationName={project.locationName || t('projectDetail.cameroonFallback')}
          currentMilestone={project.milestones?.[0]?.title || t('projectDetail.foundationPour')}
          milestoneIndex={1}
          totalMilestones={project.milestones?.length || 4}
          completionPercent={progress}
          totalBudgetXaf={project.totalAmount}
          contractorName={t('projectDetail.assignedContractor')}
        />

        {/* Financial Escrow Progress Card */}
        <Card style={{ padding: 16, gap: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              {t('projectDetail.escrowFundingProgress')}
            </Text>
            <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 13, fontWeight: '700' }}>
              {progress}%
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={{ height: 8, backgroundColor: colors.parchmentDark, borderRadius: 4, overflow: 'hidden' }}>
            <View
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: colors.forest,
                borderRadius: 4,
              }}
            />
          </View>

          {/* 3 Metric Columns */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6 }}>
            <View>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                {t('projectDetail.raised')}
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 15, marginTop: 2 }}>
                {fmt(project.raised)}
              </Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                {t('projectDetail.targetBudget')}
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15, marginTop: 2 }}>
                {fmt(project.totalAmount)}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                {t('projectDetail.escrowBalance')}
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.steel, fontSize: 15, marginTop: 2 }}>
                {fmt(project.escrowBalance)}
              </Text>
            </View>
          </View>

          {/* Fund Action Button */}
          {remainingToFund > 0 && (
            <PillButton
              variant="primary"
              onPress={() =>
                navigation.navigate('FundProject', {
                  projectId: project.id,
                  title: project.title,
                  remainingAmount: remainingToFund,
                })
              }
              fullWidth
            >
              {`${t('projectDetail.fundThisProjectPrefix')}${fmt(remainingToFund)} ${t('projectDetail.remainingSuffix')}`}
            </PillButton>
          )}
        </Card>

        <PillButton variant="secondary" onPress={() => navigation.navigate('CoSignerManagement', { projectId: project.id })} fullWidth>
          {t('projectDetail.addCommunityCoSigner')}
        </PillButton>

        <PillButton variant="secondary" onPress={() => navigation.navigate('PooledFunding', { projectId: project.id })} fullWidth>
          {t('projectDetail.viewGroupFunding')}
        </PillButton>

        {/* Milestones Breakdown Timeline */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              {t('projectDetail.milestonesAndReleases')} ({project.milestones.length})
            </Text>
          </View>

          {project.milestones.map((m, index) => {
            const isReviewable = m.status === 'under_review';
            const isDisputed = m.status === 'disputed';
            const isReleased = m.status === 'released';

            return (
              <Card key={m.id || index} style={{ padding: 16, gap: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
                      {t('projectDetail.milestoneLabel')} {index + 1}
                    </Text>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15, marginTop: 2 }}>
                      {m.title}
                    </Text>
                  </View>
                  <StatusBadge status={m.status} />
                </View>

                {m.description ? (
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
                    {m.description}
                  </Text>
                ) : null}

                {/* Badges: Video verification, multi-approval */}
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {m.requiresVideo && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        backgroundColor: colors.parchment,
                      }}
                    >
                      <Video size={12} color={colors.inkSubtle} />
                      <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>
                        {t('projectDetail.videoInspection')}
                      </Text>
                    </View>
                  )}
                  {m.requiresMultiApproval && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        backgroundColor: colors.parchment,
                      }}
                    >
                      <Users size={12} color={colors.inkSubtle} />
                      <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>
                        {t('projectDetail.coSignerApproval')}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Milestone Footer with Price & Actions */}
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
                      {t('projectDetail.milestoneAmount')}
                    </Text>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15, marginTop: 1 }}>
                      {fmt(m.amount)}
                    </Text>
                  </View>

                  {isReviewable ? (
                    <Pressable
                      onPress={() =>
                        navigation.navigate('MilestoneReview', {
                          projectId: project.id,
                          milestoneId: m.id,
                        })
                      }
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: colors.amber,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: '#111', fontSize: 12 }}>
                        {t('projectDetail.reviewProof')}
                      </Text>
                      <ArrowRight size={13} color="#111" />
                    </Pressable>
                  ) : isDisputed ? (
                    <Pressable
                      onPress={() =>
                        navigation.navigate('Dispute', {
                          projectId: project.id,
                          milestoneId: m.id,
                          milestoneTitle: m.title,
                        })
                      }
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: colors.seal + '20',
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 11 }}>
                        {t('projectDetail.disputed')}
                      </Text>
                    </Pressable>
                  ) : isReleased ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={15} color={colors.forest} />
                      <Text style={{ fontFamily: FONT.sansMedium, color: colors.forest, fontSize: 12 }}>
                        {t('projectDetail.fundsReleased')}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Lock size={13} color={colors.inkSubtle} />
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                        {t('projectDetail.escrowLocked')}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            );
          })}
        </View>
      </View>

      {/* OHADA Legal Contract PDF Modal */}
      <ContractPDFViewerModal
        visible={contractModalOpen}
        contractParams={{
          funderName: project.ownerName,
          contractorName: t('projectDetail.assignedContractor'),
          projectName: project.title,
          location: project.locationName || 'Cameroon',
          totalBudgetXaf: project.totalAmount,
          milestones: (project.milestones || []).map((m) => ({
            title: m.title,
            amountXaf: m.amount,
            durationDays: 30,
          })),
        }}
        onClose={() => setContractModalOpen(false)}
      />
    </Screen>
  );
}
