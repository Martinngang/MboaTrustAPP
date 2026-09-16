import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Briefcase,
  ShieldCheck,
  Check,
  Clock,
  Search,
  Store,
  Users,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { StatusBadge } from '../../components/StatusBadge';
import { Avatar } from '../../components/Avatar';
import { PillButton } from '../../components/PillButton';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useUpdateBidStatusMutation } from '../../api/tenders';
import { useBidsWithScoresQuery, useRecommendedContractorsQuery, type BidWithScore } from '../../api/matching';
import { useProjectQuery, useAssignSupplierMutation } from '../../api/projects';
import { useSupplierDirectoryQuery } from '../../api/supplierProfiles';
import { useContractorLeaderboardQuery, type LeaderboardRow } from '../../api/contractors';
import { useStartConversationMutation } from '../../api/messaging';
import { useApp } from '../../context/AppContext';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'TenderBids'>;
type Nav = NativeStackNavigationProp<MainStackParamList>;

/** Small color-coded "63/100" match pill — mirrors web's MatchScoreBadge. */
function MatchScoreBadge({ score, colors, matchLabel }: { score: BidWithScore['score']; colors: any; matchLabel: string }) {
  const tone = score.total >= 70 ? colors.forest : score.total >= 40 ? colors.amber : colors.inkSubtle;
  return (
    <View style={{ backgroundColor: tone + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
      <Text style={{ fontFamily: FONT.mono, color: tone, fontSize: 10, fontWeight: '700' }}>{score.total}/100 {matchLabel}</Text>
    </View>
  );
}

/** Lets the funder browse real, verified supplier profiles and assign one as
 * this tender's preferred materials supplier — or unassign it — any time
 * after the tender is posted. Ported from TenderBidsScreen.tsx (web)'s
 * SupplierAssignPanel; same backend endpoint (projectController.assignSupplier). */
function SupplierAssignPanel({ jobId, materialsManagedBy, preferredSupplierId }: {
  jobId: string | undefined;
  materialsManagedBy?: 'contractor' | 'supplier';
  preferredSupplierId?: string | null;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { show: showToast } = useToast();
  const { data: suppliers } = useSupplierDirectoryQuery();
  const assignMutation = useAssignSupplierMutation();
  const [browsing, setBrowsing] = useState(false);

  const verified = (suppliers ?? []).filter((s) => s.verificationStatus === 'verified');
  const assigned = materialsManagedBy === 'supplier' && preferredSupplierId
    ? (suppliers ?? []).find((s) => s.id === preferredSupplierId)
    : null;

  const assign = async (supplierId: string | null) => {
    if (!jobId) return;
    try {
      await assignMutation.mutateAsync({ projectId: jobId, supplierId });
      showToast({ title: supplierId ? t('tenderBids.supplierAssigned') : t('tenderBids.supplierUnassigned'), tone: 'success' });
      setBrowsing(false);
    } catch (err) {
      showToast({ title: t('tenderBids.supplierUpdateFailed'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  return (
    <View>
      <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        {t('tenderBids.materialsSupplier')}
      </Text>
      {assigned ? (
        <Card style={{ padding: 14, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }} numberOfLines={1}>{assigned.businessName}</Text>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>{assigned.address}, {assigned.region}</Text>
            </View>
            <Pressable onPress={() => navigation.navigate('SupplierProfile', { supplierId: assigned.id })}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>{t('tenderBids.viewProfile')}</Text>
            </Pressable>
          </View>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
            {t('tenderBids.awardedContractorNote')}
          </Text>
          <Pressable disabled={assignMutation.isPending} onPress={() => assign(null)}>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>
              {assignMutation.isPending ? '…' : t('tenderBids.unassignSupplier')}
            </Text>
          </Pressable>
        </Card>
      ) : !browsing ? (
        <Pressable
          onPress={() => setBrowsing(true)}
          style={{ paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.forest, alignItems: 'center' }}
        >
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>{t('tenderBids.findAssignSupplier')}</Text>
        </Pressable>
      ) : verified.length === 0 ? (
        <EmptyState icon={Store} title={t('tenderBids.noVerifiedSuppliers')} description={t('tenderBids.noVerifiedSuppliersDesc')} />
      ) : (
        <View style={{ gap: 10 }}>
          {verified.map((s) => (
            <Card key={s.id} style={{ padding: 14, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }} numberOfLines={1}>{s.businessName}</Text>
                <ShieldCheck size={13} color={colors.forest} />
              </View>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>{s.address}, {s.region}</Text>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>
                {s.registeredCategories.slice(0, 3).join(', ') || t('tenderBids.noCategoriesListed')}
                {s.averageRating > 0 ? ` · ${s.averageRating.toFixed(1)}★` : ''}
              </Text>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 2 }}>
                <Pressable onPress={() => navigation.navigate('SupplierProfile', { supplierId: s.id })}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>{t('tenderBids.viewProfileInventory')}</Text>
                </Pressable>
                <Pressable disabled={assignMutation.isPending} onPress={() => assign(s.id)}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
                    {assignMutation.isPending ? '…' : t('tenderBids.assign')}
                  </Text>
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

/** Direct-hire search — lets a funder find a specific contractor by name,
 * skill/category, or region instead of relying only on the algorithmic
 * Recommended list. Ported from TenderBidsScreen.tsx (web)'s
 * ContractorSearchPanel; same public leaderboard endpoint. */
function ContractorSearchPanel({ actingOn, onView, onMessage }: {
  actingOn: string | null;
  onView: (userId: string) => void;
  onMessage: (contractorId: string) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const searchActive = debouncedQuery.length >= 2;
  const { data, isLoading, isFetching } = useContractorLeaderboardQuery({
    search: debouncedQuery || undefined, limit: 8, enabled: searchActive,
  });
  const results: LeaderboardRow[] = data?.rows ?? [];

  return (
    <View>
      <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        {t('tenderBids.searchContractors')}
      </Text>
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder={t('tenderBids.searchPlaceholder')}
        containerStyle={{ marginBottom: 10 }}
      />
      {!searchActive ? (
        <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>{t('tenderBids.searchHint')}</Text>
      ) : isLoading || isFetching ? (
        <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>{t('tenderBids.searching')}</Text>
      ) : results.length === 0 ? (
        <EmptyState icon={Search} title={t('tenderBids.noMatchingContractors')} description={t('tenderBids.noMatchingContractorsDesc')} />
      ) : (
        <View style={{ gap: 10 }}>
          {results.map((r) => (
            <Card key={r.userId} style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <Avatar name={r.fullName} avatarUrl={r.avatarUrl} size={40} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }} numberOfLines={1}>{r.fullName}</Text>
                    {r.kycStatus === 'verified' && <ShieldCheck size={13} color={colors.forest} />}
                  </View>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 2 }} numberOfLines={1}>
                    {[r.categories.slice(0, 2).join(', '), r.regions[0]].filter(Boolean).join(' · ') || t('tenderBids.noTradeRegion')}
                  </Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 2 }}>
                    {r.yearsExperience > 0 ? `${r.yearsExperience} ${t('tenderBids.yrsExperience')} · ` : ''}
                    {r.stats.completedProjects} {t('tenderBids.completed')} · {r.stats.ratingCount > 0 ? `${r.stats.avgRating?.toFixed(1)}★ (${r.stats.ratingCount})` : t('tenderBids.noRatingsYet')}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                    <Pressable onPress={() => onView(r.userId)}>
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>{t('tenderBids.viewPortfolio')}</Text>
                    </Pressable>
                    <Pressable disabled={actingOn === r.userId} onPress={() => onMessage(r.userId)}>
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
                        {actingOn === r.userId ? '…' : t('tenderBids.message')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

export function TenderBidsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { show: showToast } = useToast();
  const { user } = useApp();
  const statusMutation = useUpdateBidStatusMutation();
  const startConversation = useStartConversationMutation(user?._id ?? null);

  const { jobId, jobTitle } = route.params;
  const { data: bids, isLoading } = useBidsWithScoresQuery(jobId);
  const { data: recommended, isLoading: recommendedLoading } = useRecommendedContractorsQuery(jobId, 5);
  const { data: tender } = useProjectQuery(jobId);
  const isCompleted = tender?.status === 'completed';
  const [actingOn, setActingOn] = useState<string | null>(null);

  const messageContact = async (contextType: 'bid' | 'project', contextId: string, contractorId: string | undefined, key: string, contractorName?: string) => {
    if (!contractorId) return;
    setActingOn(key);
    try {
      const conversation = await startConversation.mutateAsync({ contextType, contextId, otherUserId: contractorId });
      if (conversation.draft) {
        navigation.navigate('ChatThread', { draftUserId: contractorId, draftContextType: contextType, draftContextId: contextId, title: contractorName ?? conversation.withName });
      } else {
        navigation.navigate('ChatThread', { conversationId: conversation.id, title: conversation.withName, subtitle: conversation.context });
      }
    } catch (err) {
      showToast({ title: t('tenderBids.messageFailed'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    } finally {
      setActingOn(null);
    }
  };

  const handleRejectBid = (bid: BidWithScore) => {
    Alert.alert(t('tenderBids.rejectBidTitle'), `${t('tenderBids.rejectBidDescPrefix')} ${bid.contractorName}?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('tenderBids.reject'),
        style: 'destructive',
        onPress: async () => {
          try {
            await statusMutation.mutateAsync({ bidId: bid.id, status: 'rejected' });
            showToast({ title: t('tenderBids.bidRejected'), description: `${bid.contractorName}${t('tenderBids.proposalDeclined')}`, tone: 'neutral' });
          } catch (err) {
            showToast({ title: t('tenderBids.rejectionError'), description: apiErrorMessage(err, t('tenderBids.couldNotReject')), tone: 'error' });
          }
        },
      },
    ]);
  };

  const handleAcceptBid = (bid: BidWithScore) => {
    Alert.alert(
      t('tenderBids.acceptBidTitle'),
      `${t('tenderBids.acceptBidDescPrefix')} ${bid.contractorName} ${t('tenderBids.acceptBidDescSuffix')} ${fmt(bid.price)}? ${t('tenderBids.willInitiateContract')}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('tenderBids.acceptAndCreateContract'),
          onPress: async () => {
            try {
              await statusMutation.mutateAsync({ bidId: bid.id, status: 'accepted' });
              showToast({
                title: t('tenderBids.bidAccepted'),
                description: `${t('tenderBids.contractGeneratedWith')} ${bid.contractorName}.`,
                tone: 'success',
              });
              navigation.goBack();
            } catch (err) {
              showToast({
                title: t('tenderBids.acceptanceError'),
                description: apiErrorMessage(err, t('tenderBids.couldNotAccept')),
                tone: 'error',
              });
            }
          },
        },
      ]
    );
  };

  return (
    <Screen header={<Header title={t('tenderBids.title')} subtitle={jobTitle} back />}>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Info Header */}
        <Card style={{ padding: 14, backgroundColor: colors.steel + '15', borderColor: colors.steel + '35', gap: 4 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.steel, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
            {t('tenderBids.overviewTitle')}
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
            {jobTitle}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
            {(bids || []).length} {(bids || []).length === 1 ? t('tenderBids.proposalReceived') : t('tenderBids.proposalsReceived')}
          </Text>
        </Card>

        <Pressable
          onPress={() => navigation.navigate('BrowseContractors')}
          accessibilityRole="button"
          style={{ alignSelf: 'flex-start' }}
        >
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
            {t('tenderBids.compareWithOthers')}
          </Text>
        </Pressable>

        {/* Proposals List */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : !bids || bids.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={t('tenderBids.noProposalsYet')}
            description={t('tenderBids.noProposalsDesc')}
          />
        ) : (
          bids.map((bid) => (
            <Card key={bid.id} style={{ padding: 16, gap: 12 }}>
              {/* Contractor Header */}
              <Pressable
                onPress={() => navigation.navigate('ContractorPortfolio', { userId: bid.contractorId })}
                accessibilityRole="button"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <Avatar name={bid.contractorName} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
                    {bid.contractorName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <MatchScoreBadge score={bid.score} colors={colors} matchLabel={t('tenderBids.matchLabel')} />
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11 }}>
                      {bid.stats.completedProjects} {t('tenderBids.completed')}
                      {bid.stats.ratingCount > 0 ? ` · ${bid.stats.avgRating?.toFixed(1)}★ (${bid.stats.ratingCount})` : ` · ${t('tenderBids.noRatingsYet')}`}
                    </Text>
                  </View>
                </View>
                <StatusBadge status={bid.status} />
              </Pressable>

              {/* Proposal Notes */}
              {bid.notes ? (
                <View style={{ backgroundColor: colors.parchment, borderRadius: 12, padding: 12 }}>
                  <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 13, lineHeight: 18 }}>
                    "{bid.notes}"
                  </Text>
                </View>
              ) : null}

              {/* Materials Plan */}
              {bid.materials ? (
                <View>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                    {t('tenderBids.materialsPlan')}
                  </Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                    {bid.materials}
                  </Text>
                </View>
              ) : null}

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
                    {t('tenderBids.proposedPrice')}
                  </Text>
                  <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16, marginTop: 1 }}>
                    {fmt(bid.price)}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                    {t('tenderBids.estimatedTimeline')}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Clock size={13} color={colors.inkSubtle} />
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                      {bid.timelineDays} {t('tenderBids.days')}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              {bid.status === 'pending' && (
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
                      {t('tenderBids.acceptBidAndContract')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => navigation.navigate('Negotiation', { bidId: bid.id })}
                    style={{
                      paddingHorizontal: 14,
                      borderRadius: 12,
                      paddingVertical: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: colors.forest,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>
                      {t('tenderBids.negotiate')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRejectBid(bid)}
                    style={{
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      paddingVertical: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: colors.parchmentDark,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.inkMuted, fontSize: 13 }}>
                      {t('tenderBids.reject')}
                    </Text>
                  </Pressable>
                </View>
              )}

              {bid.status === 'accepted' && (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <Pressable
                    disabled={actingOn === bid.id}
                    onPress={() => messageContact('bid', bid.id, bid.contractorId, bid.id, bid.contractorName)}
                    style={{
                      flex: 1,
                      backgroundColor: colors.parchment,
                      borderRadius: 12,
                      paddingVertical: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>
                      {actingOn === bid.id ? '…' : t('tenderBids.message')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => navigation.navigate('ContractSummary', { bidId: bid.id })}
                    style={{
                      flex: 1,
                      backgroundColor: colors.parchment,
                      borderRadius: 12,
                      paddingVertical: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>{t('tenderBids.contract')}</Text>
                  </Pressable>
                  {isCompleted && (
                    <Pressable
                      onPress={() => navigation.navigate('RateContractor', { jobId })}
                      style={{
                        flex: 1,
                        backgroundColor: colors.amber,
                        borderRadius: 12,
                        paddingVertical: 10,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forestDark, fontSize: 13 }}>
                        {t('tenderBids.rateThisContractor')}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </Card>
          ))
        )}

        {/* Materials Supplier Assignment */}
        <SupplierAssignPanel
          jobId={jobId}
          materialsManagedBy={tender?.materialsManagedBy}
          preferredSupplierId={tender?.preferredSupplierId}
        />

        {/* Recommended Contractors */}
        <View>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            {t('tenderBids.recommendedContractors')}
          </Text>
          {recommendedLoading ? null : (recommended?.length ?? 0) === 0 ? (
            <EmptyState icon={Users} title={t('tenderBids.noContractorsMatch')} description={t('tenderBids.noContractorsMatchDesc')} />
          ) : (
            <View style={{ gap: 10 }}>
              {recommended!.map((r) => (
                <Card key={r.contractorId} style={{ padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <Avatar name={r.fullName} avatarUrl={r.avatarUrl} size={40} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14, flex: 1 }} numberOfLines={1}>{r.fullName}</Text>
                        <MatchScoreBadge score={r.score} colors={colors} matchLabel={t('tenderBids.matchLabel')} />
                      </View>
                      <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 2 }}>
                        {r.stats.completedProjects} {t('tenderBids.completed')} · {r.stats.ratingCount > 0 ? `${r.stats.avgRating?.toFixed(1)}★ (${r.stats.ratingCount})` : t('tenderBids.noRatingsYet')}
                      </Text>
                      {r.aiRationale && (
                        <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, fontStyle: 'italic', marginTop: 6, lineHeight: 17 }}>
                          "{r.aiRationale}"
                        </Text>
                      )}
                      <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                        <Pressable onPress={() => navigation.navigate('ContractorPortfolio', { userId: r.contractorId })}>
                          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>{t('tenderBids.viewPortfolio')}</Text>
                        </Pressable>
                        <Pressable
                          disabled={actingOn === r.contractorId}
                          onPress={() => jobId && messageContact('project', jobId, r.contractorId, r.contractorId, r.fullName)}
                        >
                          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
                            {actingOn === r.contractorId ? '…' : t('tenderBids.message')}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* Direct-hire Contractor Search */}
        <ContractorSearchPanel
          actingOn={actingOn}
          onView={(userId) => navigation.navigate('ContractorPortfolio', { userId })}
          onMessage={(contractorId) => jobId && messageContact('project', jobId, contractorId, contractorId)}
        />

        <PillButton variant="secondary" onPress={() => navigation.navigate('PostJob')} fullWidth>
          {t('tenderBids.postAnotherTender')}
        </PillButton>
      </View>
    </Screen>
  );
}
