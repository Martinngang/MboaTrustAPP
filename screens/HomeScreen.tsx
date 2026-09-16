import { useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, Image } from 'react-native';
import {
  FolderKanban,
  Briefcase,
  Store,
  MapPin,
  ShieldCheck,
  Plus,
  ArrowRight,
  TrendingUp,
  FileCheck,
  CreditCard,
  Users,
  Search,
  Sparkles,
  Layers,
  CheckCircle2,
  Hourglass,
  AlertCircle,
  AlertTriangle,
  Handshake,
  Clock,
  ClipboardList,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { SiteWeatherHeader } from '../components/SiteWeatherHeader';
import { OfflineSyncBanner } from '../components/OfflineSyncBanner';
import { useOfflineQueue } from '../context/OfflineQueueContext';
import { OnboardingChecklistWidget } from '../components/OnboardingChecklistWidget';
import { NeedsAttentionWidget, type AttentionItem } from '../components/dashboard/NeedsAttentionWidget';
import { RecentActivityWidget } from '../components/dashboard/RecentActivityWidget';
import { fmt } from '../components/fmt';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import { useMyFundedProjectsQuery } from '../api/projects';
import { useJobsQuery, useBidsQuery } from '../api/tenders';
import { useWithdrawableBalanceQuery } from '../api/contracts';
import { useMaterialOrdersForMySupplierQuery } from '../api/materialOrders';
import { useLandListingsQuery } from '../api/land';
import { useLandOffersQuery } from '../api/landOffers';
import { useVerificationTasksQuery, useMyVerifierProfileQuery } from '../api/verifier';
import { useRatingSummaryQuery } from '../api/ratings';
import { useMySupplierProfileQuery } from '../api/supplierProfiles';
import { ROLE_DEFINITIONS } from '../components/RoleSelectorModal';
import { PillButton } from '../components/PillButton';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translations';

interface QuickActionDef {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

export function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { name, user, activeRole, setRoleSelectorOpen } = useApp();
  const navigation = useNavigation<any>();
  const pullToRefresh = usePullToRefresh();
  const { isOnline, pendingCount, syncNow } = useOfflineQueue();

  const currentRoleMeta = ROLE_DEFINITIONS.find((r) => r.id === activeRole) || ROLE_DEFINITIONS[0];
  const RoleIcon = currentRoleMeta.icon;

  // Quincaillerie/Verifier are trust-elevating, admin-approval-gated
  // identities — a real order/task dashboard full of zeroes would be
  // misleading for an account still under review, so this checks the
  // underlying application status before rendering the normal stats grid
  // below. Ported from web's identical SupplierDashboardScreen/
  // VerifierDashboard "not yet approved" branch (see api/session.ts's
  // AppContext comment for why `activeRole` can be 'quincaillerie'/
  // 'verifier' even before the backend has granted either roleType).
  const { data: mySupplierProfile, isLoading: isLoadingSupplierProfile } = useMySupplierProfileQuery(activeRole === 'quincaillerie');
  const { data: myVerifierProfile, isLoading: isLoadingVerifierProfile } = useMyVerifierProfileQuery(activeRole === 'verifier');

  const isFunder = activeRole === 'funder';
  // A funder never owns the projects they fund — their real relationship is
  // having paid into escrow, resolved server-side by funderId, not ownerId
  // (see api/projects.ts). This used to pass the funder's own id as
  // ownerId, which matches nothing, so this screen always showed the
  // funder's real project count as 0/undefined — masked by hardcoded fake
  // stat tiles below that never reflected it either way.
  const { data: fundedProjects, isLoading } = useMyFundedProjectsQuery(isFunder ? user?._id : undefined);
  const activeFundedCount = (fundedProjects || []).filter((p) => p.status === 'active').length;
  const totalFunded = (fundedProjects || []).reduce((sum, p) => sum + p.raised, 0);
  const pendingReviewCount = (fundedProjects || []).reduce(
    (sum, p) => sum + p.milestones.filter((m) => m.status === 'under_review').length,
    0
  );

  // Real data for the other 4 role dashboards — each hook is self-scoped
  // server-side, so calling them unconditionally (rather than only for the
  // active role) is cheap and matches the pattern above.
  const { data: openJobs } = useJobsQuery();
  const { data: myBids } = useBidsQuery({ contractorId: user?._id });
  const { data: contractorBalance } = useWithdrawableBalanceQuery();
  const openJobCount = (openJobs || []).filter((j) => j.status === 'open').length;
  const pendingBidCount = (myBids || []).filter((b) => b.status === 'pending').length;

  // Unlike its sibling self-scoped queries above (which return an empty list
  // for a user without that role), the backend's /material-orders/for-supplier
  // throws a 400 ("Register as a supplier...") when the caller has no
  // SupplierProfile at all — so, unlike those, this one can't be called
  // unconditionally for every user without a real 400 on every Home-screen
  // load for the vast majority of accounts (anyone who isn't a supplier).
  const hasSupplierRole = (user?.roles || []).some((r) => r.roleType === 'supplier');
  const { data: supplierOrders } = useMaterialOrdersForMySupplierQuery(undefined, hasSupplierRole);
  const pendingOrderCount = (supplierOrders || []).filter((o) => o.status === 'requested').length;
  const dispatchedOrderCount = (supplierOrders || []).filter((o) => o.status === 'out_for_delivery' || o.status === 'delivered').length;
  const deliveredValue = (supplierOrders || []).filter((o) => o.status === 'delivered').reduce((sum, o) => sum + o.totalAmount, 0);

  const { data: myListings } = useLandListingsQuery({ sellerId: user?._id });
  const { data: myLandOffers } = useLandOffersQuery({}, activeRole === 'seller');
  const verifiedListingCount = (myListings || []).filter((l) => l.verificationStatus === 'verified').length;
  const verifiedTitlePct = myListings && myListings.length > 0 ? Math.round((verifiedListingCount / myListings.length) * 100) : 0;

  const { data: verificationTasks } = useVerificationTasksQuery();
  const pendingTaskCount = (verificationTasks || []).filter((t) => t.status === 'assigned' || t.status === 'in_progress').length;
  const completedTaskCount = (verificationTasks || []).filter((t) => t.status === 'submitted').length;
  const { data: verifierRating } = useRatingSummaryQuery(activeRole === 'verifier' ? user?._id : undefined);

  // "Needs your attention" / "Recent activity" — mirrors web Dashboard.tsx's
  // WidgetGrid (funder/contractor/seller) under "Your dashboard". Web has no
  // equivalent widget for Quincaillerie/Verifier (those live on their own
  // separate dashboard routes there), but mobile unifies all 5 dashboards
  // into this one Home screen, so the same real per-role data already
  // fetched above is reused here too — more functionality than web, not less.
  const [funderProjectFilter, setFunderProjectFilter] = useState<'All' | 'Needs my attention'>('All');

  const attentionItems: AttentionItem[] = (() => {
    switch (activeRole) {
      case 'funder':
        return (fundedProjects || []).flatMap((p) =>
          p.milestones
            .filter((m) => m.status === 'under_review')
            .map((m): AttentionItem => ({
              icon: Hourglass,
              label: `${m.title} — ${p.title}`,
              sub: `${fmt(m.amount)} awaiting your review`,
              onPress: () => navigation.navigate('ProjectDetail', { projectId: p.id }),
            }))
        );
      case 'contractor': {
        const pending = (myBids || []).filter((b) => b.status === 'pending');
        if (pending.length > 0) {
          return pending.map((b): AttentionItem => ({
            icon: ClipboardList,
            label: `Bid pending — ${b.jobTitle}`,
            sub: fmt(b.price),
            onPress: () => navigation.navigate('MyBids'),
          }));
        }
        const featured = (openJobs || []).find((j) => j.status === 'open');
        return featured
          ? [{
              icon: Search,
              label: `New tender matching your trade: ${featured.title}`,
              sub: `${fmt(featured.budget)} · ${featured.location}`,
              onPress: () => navigation.navigate('JobDetail', { jobId: featured.id }),
            }]
          : [];
      }
      case 'quincaillerie':
        return (supplierOrders || [])
          .filter((o) => o.status === 'requested')
          .map((o): AttentionItem => ({
            icon: Store,
            label: o.items.map((i) => i.name).join(', ') || 'Material Order',
            sub: `${o.projectTitle} · ${fmt(o.totalAmount)}`,
            onPress: () => navigation.navigate('Materials'),
          }));
      case 'seller': {
        const pendingOffers = (myLandOffers || []).filter(
          (o) => o.status === 'pending' && (myListings || []).some((l) => l.id === o.listingId)
        );
        if (pendingOffers.length > 0) {
          return pendingOffers.map((o): AttentionItem => ({
            icon: Handshake,
            label: `New offer: ${fmt(o.amount)}`,
            sub: o.message || 'Awaiting your response',
            onPress: () => navigation.navigate('LandListingDetail', { listingId: o.listingId }),
          }));
        }
        const unverified = (myListings || []).find((l) => l.verificationStatus !== 'verified');
        return unverified
          ? [{
              icon: Clock,
              label: `Verification pending — ${unverified.title}`,
              sub: unverified.verificationStatus,
              onPress: () => navigation.navigate('LandListingDetail', { listingId: unverified.id }),
            }]
          : [];
      }
      case 'verifier':
        return (verificationTasks || [])
          .filter((t) => t.status === 'assigned' || t.status === 'in_progress')
          .map((t): AttentionItem => ({
            icon: ShieldCheck,
            label: t.milestoneTitle || t.projectTitle,
            sub: t.location,
            onPress: () => navigation.navigate('VerifierTaskDetail', { taskId: t.id }),
          }));
      default:
        return [];
    }
  })();

  // Role-specific stats & quick actions matching web Dashboard.tsx
  const getRoleDashboardData = () => {
    switch (activeRole) {
      case 'funder':
        return {
          eyebrow: t('home.funder.eyebrow'),
          subtitle: t('home.funder.subtitle'),
          stats: [
            { label: t('home.funder.statFunded'), value: fmt(totalFunded) },
            { label: t('home.funder.statActive'), value: String(activeFundedCount) },
            { label: t('home.funder.statPending'), value: `${pendingReviewCount} ${pendingReviewCount === 1 ? t('home.funder.milestone') : t('home.funder.milestones')}` },
          ],
          quickActions: [
            { icon: Plus, label: t('home.funder.qaNewProject'), onPress: () => navigation.navigate('Projects') },
            { icon: Search, label: t('home.funder.qaBrowse'), onPress: () => navigation.navigate('Projects') },
            { icon: FileCheck, label: t('home.funder.qaMilestoneReview'), onPress: () => navigation.navigate('Projects') },
            { icon: CreditCard, label: t('home.funder.qaEscrow'), onPress: () => navigation.navigate('TransactionHistory') },
          ],
        };
      case 'contractor':
        return {
          eyebrow: t('home.contractor.eyebrow'),
          subtitle: t('home.contractor.subtitle'),
          stats: [
            { label: t('home.contractor.statTenders'), value: String(openJobCount) },
            { label: t('home.contractor.statBids'), value: String(pendingBidCount) },
            { label: t('home.contractor.statPayout'), value: fmt(contractorBalance?.available || 0) },
          ],
          quickActions: [
            { icon: Search, label: t('home.contractor.qaBrowseJobs'), onPress: () => navigation.navigate('Jobs') },
            { icon: Plus, label: t('home.contractor.qaSubmitBid'), onPress: () => navigation.navigate('Jobs') },
            { icon: FileCheck, label: t('home.contractor.qaSubmitEvidence'), onPress: () => navigation.navigate('Jobs') },
            { icon: TrendingUp, label: t('home.contractor.qaEarnings'), onPress: () => navigation.navigate('Activity') },
          ],
        };
      case 'quincaillerie':
        return {
          eyebrow: t('home.quincaillerie.eyebrow'),
          subtitle: t('home.quincaillerie.subtitle'),
          stats: [
            { label: t('home.quincaillerie.statPending'), value: String(pendingOrderCount) },
            { label: t('home.quincaillerie.statDispatched'), value: String(dispatchedOrderCount) },
            { label: t('home.quincaillerie.statDelivered'), value: fmt(deliveredValue) },
          ],
          quickActions: [
            { icon: Store, label: t('home.quincaillerie.qaSupplyOrders'), onPress: () => navigation.navigate('Materials') },
            { icon: Plus, label: t('home.quincaillerie.qaAddItem'), onPress: () => navigation.navigate('Materials') },
            { icon: Layers, label: t('home.quincaillerie.qaCatalog'), onPress: () => navigation.navigate('Materials') },
            { icon: CreditCard, label: t('home.quincaillerie.qaPayouts'), onPress: () => navigation.navigate('Activity') },
          ],
        };
      case 'seller':
        return {
          eyebrow: t('home.seller.eyebrow'),
          subtitle: t('home.seller.subtitle'),
          stats: [
            { label: t('home.seller.statListed'), value: String((myListings || []).length) },
            { label: t('home.seller.statVerified'), value: `${verifiedTitlePct}%` },
            { label: t('home.seller.statInquiries'), value: String((myLandOffers || []).length) },
          ],
          quickActions: [
            { icon: Plus, label: t('home.seller.qaNewListing'), onPress: () => navigation.navigate('LandBrowse') },
            { icon: Search, label: t('home.seller.qaMarketplace'), onPress: () => navigation.navigate('LandBrowse') },
            { icon: ShieldCheck, label: t('home.seller.qaTitleDeeds'), onPress: () => navigation.navigate('LandBrowse') },
            { icon: Users, label: t('home.seller.qaBuyerOffers'), onPress: () => navigation.navigate('Messages') },
          ],
        };
      case 'verifier':
        return {
          eyebrow: t('home.verifier.eyebrow'),
          subtitle: t('home.verifier.subtitle'),
          stats: [
            { label: t('home.verifier.statPending'), value: String(pendingTaskCount) },
            { label: t('home.verifier.statDone'), value: String(completedTaskCount) },
            { label: t('home.verifier.statTrust'), value: verifierRating && verifierRating.count > 0 ? `${verifierRating.average?.toFixed(1)} / 5` : t('home.verifier.noRatings') },
          ],
          quickActions: [
            { icon: ShieldCheck, label: t('home.verifier.qaTaskQueue'), onPress: () => navigation.navigate('VerifierTasks') },
            { icon: FileCheck, label: t('home.verifier.qaSubmitReport'), onPress: () => navigation.navigate('VerifierTasks') },
            { icon: CheckCircle2, label: t('home.verifier.qaCompletedAudits'), onPress: () => navigation.navigate('Activity') },
            { icon: MapPin, label: t('home.verifier.qaInspectionMap'), onPress: () => navigation.navigate('VerifierTasks') },
          ],
        };
      default:
        return {
          eyebrow: 'Workspace',
          subtitle: 'Welcome to MboaTrust platform.',
          stats: [],
          quickActions: [],
        };
    }
  };

  if (activeRole === 'quincaillerie' && !isLoadingSupplierProfile && (!mySupplierProfile || mySupplierProfile.verificationStatus !== 'verified')) {
    return (
      <PendingApplicationScreen
        status={mySupplierProfile?.verificationStatus ?? null}
        title={{ none: t('home.pending.registerSupplier'), pending: t('home.pending.applicationReview'), rejected: t('home.pending.registrationRejected') }}
        description={{
          none: t('home.pending.registerSupplierDesc'),
          pending: t('home.pending.supplierReviewDesc'),
          rejected: t('home.pending.supplierRejectedDesc'),
        }}
        ctaLabel={mySupplierProfile?.verificationStatus === 'rejected' ? t('home.pending.resubmit') : t('home.pending.getStarted')}
        onPressCta={() => navigation.navigate('QuincaillerieRegister')}
      />
    );
  }
  if (activeRole === 'verifier' && !isLoadingVerifierProfile && (!myVerifierProfile || myVerifierProfile.applicationStatus !== 'approved')) {
    return (
      <PendingApplicationScreen
        status={myVerifierProfile?.applicationStatus ?? null}
        title={{ none: t('home.pending.registerVerifier'), pending: t('home.pending.applicationReview'), rejected: t('home.pending.applicationRejected') }}
        description={{
          none: t('home.pending.registerVerifierDesc'),
          pending: t('home.pending.verifierReviewDesc'),
          rejected: t('home.pending.verifierRejectedDesc'),
        }}
        ctaLabel={myVerifierProfile?.applicationStatus === 'rejected' ? t('home.pending.resubmitApplication') : t('home.pending.getStarted')}
        onPressCta={() => navigation.navigate('VerifierRegister')}
      />
    );
  }

  const dashboardData = getRoleDashboardData();

  return (
    <Screen {...pullToRefresh}>
      {/* Offline Synchronization Status Banner */}
      <OfflineSyncBanner isOffline={!isOnline} queuedItemsCount={pendingCount} onSyncNow={syncNow} />

      <View style={{ padding: 16, gap: 18 }}>
        {/* Top Cameroon Live Weather & Local Time Bar */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontFamily: FONT.serifBold, fontSize: 16, color: colors.ink }}>
              {t('home.workspace')}
            </Text>
          </View>
          <SiteWeatherHeader />
        </View>

        {/* Dashboard Hero (Mirrors web DashboardHero) */}
        <View
          style={{
            backgroundColor: colors.forestDark,
            borderRadius: 24,
            padding: 20,
            gap: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          {/* Header Row with Role Switcher */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: FONT.mono,
                color: 'rgba(255,255,255,0.7)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
              }}
            >
              {dashboardData.eyebrow}
            </Text>
            <Pressable
              onPress={() => setRoleSelectorOpen(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.18)',
              }}
            >
              <RoleIcon size={12} color="#fff" />
              <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 10, fontWeight: '700' }}>
                {currentRoleMeta.label}
              </Text>
            </Pressable>
          </View>

          {/* User Name & Subtitle */}
          <View>
            <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 22 }}>
              {name || user?.fullName || 'Welcome'}
            </Text>
            <Text
              style={{
                fontFamily: FONT.sans,
                color: 'rgba(255,255,255,0.85)',
                fontSize: 12,
                marginTop: 4,
                lineHeight: 17,
              }}
            >
              {dashboardData.subtitle}
            </Text>
          </View>

          {/* 3 Stat Tiles */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {dashboardData.stats.map((stat, idx) => (
              <View
                key={idx}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 16,
                  paddingVertical: 10,
                  paddingHorizontal: 6,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT.serifBold,
                    color: '#fff',
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                  numberOfLines={1}
                >
                  {stat.value}
                </Text>
                <Text
                  style={{
                    fontFamily: FONT.mono,
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 8,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginTop: 2,
                    textAlign: 'center',
                  }}
                  numberOfLines={1}
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Dismissible first-login checklist — mirrors web's
            OnboardingChecklistWidget, shown for every non-pending role. */}
        <OnboardingChecklistWidget role={activeRole} />

        {/* Quick Actions Grid (Mirrors web QuickActionsGrid) */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontFamily: FONT.mono,
              color: colors.inkSubtle,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
            }}
          >
            {t('home.quickActions')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {dashboardData.quickActions.slice(0, 2).map((qa, i) => {
              const QAIcon = qa.icon;
              return (
                <Pressable
                  key={i}
                  onPress={qa.onPress}
                  accessibilityRole="button"
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.parchmentDark,
                    borderRadius: 16,
                    padding: 14,
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <QAIcon size={20} color={colors.forest} />
                  <Text
                    style={{
                      fontFamily: FONT.mono,
                      color: colors.ink,
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      textAlign: 'center',
                    }}
                    numberOfLines={1}
                  >
                    {qa.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {dashboardData.quickActions.slice(2, 4).map((qa, i) => {
              const QAIcon = qa.icon;
              return (
                <Pressable
                  key={i}
                  onPress={qa.onPress}
                  accessibilityRole="button"
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.parchmentDark,
                    borderRadius: 16,
                    padding: 14,
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <QAIcon size={20} color={colors.forest} />
                  <Text
                    style={{
                      fontFamily: FONT.mono,
                      color: colors.ink,
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      textAlign: 'center',
                    }}
                    numberOfLines={1}
                  >
                    {qa.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Needs Attention / Active Role Content */}
        {activeRole === 'funder' && (
          <View style={{ gap: 12 }}>
            {/* Pending-milestones warning banner — mirrors web Dashboard.tsx's
                FunderHome amber alert button, tapping through to review. */}
            {pendingReviewCount > 0 && (
              <Pressable
                onPress={() => navigation.navigate('Projects')}
                accessibilityRole="button"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderRadius: 20,
                  padding: 14,
                  backgroundColor: colors.amber + '22',
                  borderWidth: 1,
                  borderColor: colors.amber,
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} color={colors.forestDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forestDark, fontSize: 13 }}>
                    {pendingReviewCount} {pendingReviewCount === 1 ? t('home.funder.milestone') : t('home.funder.milestones')} {t('home.funder.pendingBanner')}
                  </Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.forestDark, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
                    {t('home.funder.tapToReview')}
                  </Text>
                </View>
              </Pressable>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {t('home.funder.fundedProjects')}
              </Text>
              <Pressable onPress={() => navigation.navigate('Projects')}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
                  {t('home.seeAll')}
                </Text>
              </Pressable>
            </View>

            {/* Filter chips — mirrors web's ChipGroup(['All', 'Needs my attention']) */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['All', 'Needs my attention'] as const).map((f) => {
                const active = funderProjectFilter === f;
                const labelKey: TranslationKey = f === 'All' ? 'home.funder.all' : 'home.funder.needsAttentionFilter';
                return (
                  <Pressable
                    key={f}
                    onPress={() => setFunderProjectFilter(f)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: active ? colors.forest : colors.parchmentDark,
                      backgroundColor: active ? colors.forest + '14' : colors.surface,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.sansMedium, fontSize: 11, color: active ? colors.forest : colors.inkMuted }}>{t(labelKey)}</Text>
                  </Pressable>
                );
              })}
            </View>

            {isLoading ? (
              <ActivityIndicator color={colors.forest} style={{ marginTop: 20 }} />
            ) : (() => {
              const visible = funderProjectFilter === 'Needs my attention'
                ? (fundedProjects || []).filter((p) => p.milestones.some((m) => m.status === 'under_review'))
                : (fundedProjects || []);
              return visible.length > 0 ? (
                visible.map((p) => (
                  <Card key={p.id} onPress={() => navigation.navigate('ProjectDetail', { projectId: p.id })} style={{ padding: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14, flex: 1 }} numberOfLines={1}>
                        {p.title}
                      </Text>
                      <StatusBadge status={p.status} />
                    </View>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, marginTop: 4 }}>
                      {p.locationName} · {fmt(p.totalAmount)}
                    </Text>
                  </Card>
                ))
              ) : (
                <EmptyState
                  icon={FolderKanban}
                  title={funderProjectFilter === 'Needs my attention' ? t('home.caughtUp') : t('home.funder.noProjects')}
                  description={
                    funderProjectFilter === 'Needs my attention'
                      ? t('home.caughtUpDesc')
                      : t('home.funder.noProjectsDesc')
                  }
                />
              );
            })()}

            {/* Community projects promo banner — mirrors web Dashboard.tsx's
                FunderHome "Browse community projects" image button. */}
            <Pressable
              onPress={() => navigation.navigate('Projects')}
              accessibilityRole="button"
              style={{ height: 140, borderRadius: 24, overflow: 'hidden' }}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=200&fit=crop&auto=format' }}
                style={{ position: 'absolute', width: '100%', height: '100%' }}
                resizeMode="cover"
              />
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,27,20,0.7)' }} />
              <View style={{ padding: 20, justifyContent: 'center', flex: 1 }}>
                <Text style={{ fontFamily: FONT.mono, color: colors.amber, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
                  New
                </Text>
                <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 15 }}>{t('home.funder.browseCommunity')}</Text>
                <Text style={{ fontFamily: FONT.sans, color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 }}>
                  {t('home.funder.newProjectsWeek')}
                </Text>
              </View>
            </Pressable>

            {/* Portfolio Insight — mirrors web Dashboard.tsx's FunderHome glass card */}
            <Card style={{ padding: 18, backgroundColor: colors.surface }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {t('home.funder.insightTitle')}
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16, marginTop: 6 }}>
                {t('home.funder.insightHeadline')}
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, marginTop: 6, lineHeight: 18 }}>
                {t('home.funder.insightBody')}
              </Text>
            </Card>
          </View>
        )}

        {activeRole === 'contractor' && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {t('home.contractor.tendersReady')}
              </Text>
              <Pressable onPress={() => navigation.navigate('Jobs')}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.steel, fontSize: 12 }}>
                  {t('home.browseAll')}
                </Text>
              </Pressable>
            </View>

            {(openJobs || []).filter((j) => j.status === 'open').length > 0 ? (
              <Card style={{ padding: 14, gap: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }} numberOfLines={1}>
                      {(openJobs || []).find((j) => j.status === 'open')?.title}
                    </Text>
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                      {(openJobs || []).find((j) => j.status === 'open')?.location} · Budget:{' '}
                      {fmt((openJobs || []).find((j) => j.status === 'open')?.budget || 0)}
                    </Text>
                  </View>
                  <StatusBadge status="open" />
                </View>
                <Pressable
                  onPress={() => navigation.navigate('Jobs')}
                  style={{
                    alignSelf: 'flex-start',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 10,
                    backgroundColor: colors.steel,
                  }}
                >
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 11 }}>
                    {t('home.contractor.submitMilestoneBid')}
                  </Text>
                </Pressable>
              </Card>
            ) : (
              <EmptyState icon={Briefcase} title={t('home.contractor.noTenders')} description={t('home.contractor.noTendersDesc')} />
            )}
          </View>
        )}

        {activeRole === 'quincaillerie' && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {t('home.quincaillerie.recentOrders')}
              </Text>
              <Pressable onPress={() => navigation.navigate('Materials')}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.amber, fontSize: 12 }}>
                  {t('home.viewOrders')}
                </Text>
              </Pressable>
            </View>

            {(() => {
              const nextOrder = (supplierOrders || []).find((o) => o.status === 'requested');
              return nextOrder ? (
                <Card style={{ padding: 14, gap: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }} numberOfLines={1}>
                        {nextOrder.items.map((i) => i.name).join(', ') || 'Material Order'}
                      </Text>
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                        {nextOrder.projectTitle} · Total: {fmt(nextOrder.totalAmount)}
                      </Text>
                    </View>
                    <StatusBadge status={nextOrder.status} />
                  </View>
                  <Pressable
                    onPress={() => navigation.navigate('Materials')}
                    style={{
                      alignSelf: 'flex-start',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                      backgroundColor: colors.amber,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: '#111', fontSize: 11 }}>
                      {t('home.quincaillerie.confirmDispatch')}
                    </Text>
                  </Pressable>
                </Card>
              ) : (
                <EmptyState icon={Store} title={t('home.quincaillerie.noOrders')} description={t('home.quincaillerie.noOrdersDesc')} />
              );
            })()}
          </View>
        )}

        {activeRole === 'seller' && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {t('home.seller.activeListings')}
              </Text>
              <Pressable onPress={() => navigation.navigate('LandBrowse')}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>
                  {t('home.marketplace')}
                </Text>
              </Pressable>
            </View>

            {(myListings || []).length > 0 ? (
              <Card style={{ padding: 14, gap: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }} numberOfLines={1}>
                      {myListings![0].title}
                    </Text>
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                      {myListings![0].city}, {myListings![0].region} · {fmt(myListings![0].price)}
                    </Text>
                  </View>
                  <StatusBadge status={myListings![0].verificationStatus} />
                </View>
                <Pressable
                  onPress={() => navigation.navigate('LandBrowse')}
                  style={{
                    alignSelf: 'flex-start',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 10,
                    backgroundColor: colors.seal,
                  }}
                >
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 11 }}>
                    {t('home.seller.manageDossier')}
                  </Text>
                </Pressable>
              </Card>
            ) : (
              <EmptyState icon={MapPin} title={t('home.seller.noListings')} description={t('home.seller.noListingsDesc')} />
            )}
          </View>
        )}

        {activeRole === 'verifier' && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {t('home.verifier.assignedInspections')}
              </Text>
              <Pressable onPress={() => navigation.navigate('VerifierTasks')}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.moss, fontSize: 12 }}>
                  {t('home.taskQueue')}
                </Text>
              </Pressable>
            </View>

            {(() => {
              const nextTask = (verificationTasks || []).find((t) => t.status === 'assigned' || t.status === 'in_progress');
              return nextTask ? (
                <Card style={{ padding: 14, gap: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }} numberOfLines={1}>
                        {nextTask.milestoneTitle || nextTask.projectTitle}
                      </Text>
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                        {nextTask.location}
                      </Text>
                    </View>
                    <StatusBadge status={nextTask.status} />
                  </View>
                  <Pressable
                    onPress={() => navigation.navigate('VerifierTasks')}
                    style={{
                      alignSelf: 'flex-start',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                      backgroundColor: colors.moss,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 11 }}>
                      {t('home.verifier.startAudit')}
                    </Text>
                  </Pressable>
                </Card>
              ) : (
                <EmptyState icon={ShieldCheck} title={t('home.verifier.noInspections')} description={t('home.verifier.noInspectionsDesc')} />
              );
            })()}
          </View>
        )}

        {/* Your Dashboard — mirrors web Dashboard.tsx's WidgetGrid
            ("Needs your attention" + "Recent activity"). Web only wires this
            up for funder/contractor/seller; mobile extends the same real
            per-role data to quincaillerie/verifier too since they share this
            one Home screen (see attentionItems above). Drag-to-reorder
            (web's dnd-kit WidgetGrid) has no natural mobile-native
            equivalent without extra native gesture wiring, so this renders
            the two widgets in a fixed order instead — everything else about
            their content and behavior is unchanged. */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('home.yourDashboard')}
          </Text>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <View style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.parchmentDark }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                {t('home.needsAttention')}
              </Text>
            </View>
            <View style={{ padding: 14 }}>
              <NeedsAttentionWidget items={attentionItems} />
            </View>
          </Card>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <View style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.parchmentDark }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                {t('home.recentActivity')}
              </Text>
            </View>
            <View style={{ padding: 14 }}>
              <RecentActivityWidget />
            </View>
          </Card>
        </View>
      </View>
    </Screen>
  );
}

type PendingStatus = 'pending' | 'rejected' | 'approved' | 'verified' | null | undefined;

// Shared "own dashboard, own pending state" screen for Quincaillerie/Verifier
// applicants — mirrors MaterialsScreen's/VerifierDashboard's identical
// no-application/pending/rejected pattern, kept as its own small component
// here since HomeScreen renders all 5 role dashboards from one switch
// rather than separate per-role routes the way web does.
function PendingApplicationScreen({
  status,
  title,
  description,
  ctaLabel,
  onPressCta,
}: {
  status: PendingStatus;
  title: { none: string; pending: string; rejected: string };
  description: { none: string; pending: string; rejected: string };
  ctaLabel: string;
  onPressCta: () => void;
}) {
  const { colors } = useTheme();
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';
  const key: 'none' | 'pending' | 'rejected' = isPending ? 'pending' : isRejected ? 'rejected' : 'none';
  const Icon = isPending ? Hourglass : isRejected ? AlertCircle : Store;

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
        <View
          style={{
            width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
            backgroundColor: isRejected ? colors.seal + '20' : colors.steel + '20',
          }}
        >
          <Icon size={28} color={isRejected ? colors.seal : colors.steel} />
        </View>
        <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 17, textAlign: 'center' }}>{title[key]}</Text>
        <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center', maxWidth: 320 }}>
          {description[key]}
        </Text>
        {!isPending && <PillButton onPress={onPressCta}>{ctaLabel}</PillButton>}
      </View>
    </Screen>
  );
}
