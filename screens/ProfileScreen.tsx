import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Sun,
  Moon,
  Smartphone,
  ShieldCheck,
  Store,
  Camera,
  Coins,
  MessageSquare,
  Gift,
  ArrowLeftRight,
  ClipboardList,
  Star,
  Calendar,
  Sparkles,
  Headset,
  Bell,
  ScrollText,
  Globe,
  Wallet,
  FileText,
  Users2,
  LifeBuoy,
  SlidersHorizontal,
  BadgeCheck,
  Monitor,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { GroupedLinks } from '../components/GroupedLinks';
import { ProgressRing } from '../components/ProgressRing';
import { PillButton } from '../components/PillButton';
import { useTheme, type ThemePreference } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { useMyKycStatusQuery, type KycStatus } from '../api/kyc';
import { useUploadAvatarMutation } from '../api/session';
import { useNotificationsQuery } from '../api/notifications';
import { useMyFundedProjectsQuery } from '../api/projects';
import { useJobsQuery, useBidsQuery } from '../api/tenders';
import { useContractorPortfolioQuery } from '../api/contractors';
import { useLandListingsQuery } from '../api/land';
import { useMySupplierProfileQuery } from '../api/supplierProfiles';
import { useVerificationTasksQuery } from '../api/verifier';
import { useRatingSummaryQuery } from '../api/ratings';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { ROLE_DEFINITIONS } from '../components/RoleSelectorModal';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translations';

const ROLE_LABEL_KEY: Record<string, TranslationKey> = {
  funder: 'role.funder.title',
  contractor: 'role.contractor.title',
  seller: 'role.seller.title',
  quincaillerie: 'menu.roleQuincaillerie',
  verifier: 'menu.roleVerifier',
};

const KYC_LABEL_KEY: Record<KycStatus, TranslationKey> = {
  unverified: 'settings.kycUnverified',
  pending: 'settings.kycPending',
  verified: 'settings.kycVerified',
  rejected: 'settings.kycRejected',
};

// Ported from MboaTrustFrontend/src/screens/SharedScreens.tsx's trust-score
// rollup — same deterministic figure (not a vanity metric): what KYC status
// alone implies about how much the platform currently vouches for this
// account, plus the same 3-tier membership ladder.
function trustScoreFor(kycStatus: KycStatus): number {
  return kycStatus === 'verified' ? 92 : kycStatus === 'pending' ? 68 : 40;
}

const TIERS: { nameKey: TranslationKey; min: number; perkKey: TranslationKey }[] = [
  { nameKey: 'menu.tierMember', min: 0, perkKey: 'menu.tierMemberPerk' },
  { nameKey: 'menu.tierTrusted', min: 50, perkKey: 'menu.tierTrustedPerk' },
  { nameKey: 'menu.tierFounding', min: 85, perkKey: 'menu.tierFoundingPerk' },
];

const THEME_OPTIONS: { value: ThemePreference; labelKey: 'settings.light' | 'settings.dark' | 'settings.system'; icon: typeof Sun }[] = [
  { value: 'light', labelKey: 'settings.light', icon: Sun },
  { value: 'dark', labelKey: 'settings.dark', icon: Moon },
  { value: 'system', labelKey: 'settings.system', icon: Smartphone },
];

interface QuickAction {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
}

// Ported from MboaTrustFrontend/src/screens/SharedScreens.tsx's ProfileScreen
// — web's bottom-nav labels this tab "Menu" (not "Profile"; see
// MobileLayout.tsx's BottomNav comment: "Menu is the hub for everything
// else"), and its content is this whole account/settings/verification/
// financial-tools hub, not a slim personal-info card. The previous mobile
// ProfileScreen was that slimmer card; this replaces it with the real Menu,
// mirroring every section, link, icon and navigation target web's version
// has, adapted to RN screens/tab-jumps in place of web's router paths.
export function ProfileScreen() {
  const { colors, preference, setPreference } = useTheme();
  const { name, avatarUrl, user, roles, activeRole, setRoleSelectorOpen, setNotificationsOpen, isAdmin, logout, refresh } = useApp();
  const navigation = useNavigation<any>();
  const { show: showToast } = useToast();
  const { t } = useTranslation();

  const { data: kycStatus = 'unverified' } = useMyKycStatusQuery();
  const { data: notifData } = useNotificationsQuery();
  const uploadAvatar = useUploadAvatarMutation();

  const isContractor = roles.includes('contractor');
  const isVerifierRole = roles.includes('verifier');
  const isQuincaillerie = roles.includes('quincaillerie');

  // Role-scoped data for the 3 stat tiles — only the active role's own query
  // actually resolves to real numbers; the rest stay cheap/unused, matching
  // HomeScreen's identical "each hook is self-scoped server-side" pattern.
  const { data: fundedProjects } = useMyFundedProjectsQuery(activeRole === 'funder' ? user?._id : undefined);
  const { data: openJobs } = useJobsQuery();
  const { data: myBids } = useBidsQuery({ contractorId: user?._id });
  const { data: contractorPortfolio } = useContractorPortfolioQuery(activeRole === 'contractor' ? user?._id : undefined);
  const { data: myListings } = useLandListingsQuery({ sellerId: user?._id });
  const { data: mySupplierProfile } = useMySupplierProfileQuery(activeRole === 'quincaillerie');
  const { data: verificationTasks } = useVerificationTasksQuery();
  const { data: verifierRating } = useRatingSummaryQuery(activeRole === 'verifier' ? user?._id : undefined);
  const pullToRefresh = usePullToRefresh();

  const currentRoleMeta = ROLE_DEFINITIONS.find((r) => r.id === activeRole) || ROLE_DEFINITIONS[0];

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast({ title: t('menu.permissionRequired'), description: t('menu.photoLibraryAccess'), tone: 'error' });
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (picked.canceled || !picked.assets?.length) return;
    const asset = picked.assets[0];
    try {
      await uploadAvatar.mutateAsync({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType });
      await refresh();
      showToast({ title: t('menu.profilePhotoUpdated'), tone: 'success' });
    } catch {
      showToast({ title: t('menu.uploadFailed'), description: t('menu.pleaseTryAgain'), tone: 'error' });
    }
  };

  const roleStats: Record<string, { label: string; value: string; icon: LucideIcon }[]> = {
    funder: [
      { label: t('menu.statProjectsFunded'), value: String((fundedProjects || []).length), icon: Coins },
      { label: t('menu.statActive'), value: String((fundedProjects || []).filter((p) => p.status === 'active').length), icon: Sparkles },
      { label: t('menu.statSince'), value: '2024', icon: Calendar },
    ],
    contractor: [
      { label: t('menu.statJobsDone'), value: String(contractorPortfolio?.stats.completedProjects ?? 0), icon: Coins },
      { label: t('menu.statRating'), value: contractorPortfolio && contractorPortfolio.stats.avgRating ? contractorPortfolio.stats.avgRating.toFixed(1) : '—', icon: Star },
      { label: t('menu.statOpenJobs'), value: String((openJobs || []).length), icon: Sparkles },
    ],
    seller: [
      { label: t('menu.statListings'), value: String((myListings || []).length), icon: Coins },
      { label: t('menu.statVerified'), value: String((myListings || []).filter((l) => l.verificationStatus === 'verified').length), icon: ShieldCheck },
      { label: t('menu.statSince'), value: '2024', icon: Calendar },
    ],
    quincaillerie: [
      { label: t('menu.statCompleted'), value: String(mySupplierProfile?.completedOrderCount ?? 0), icon: Coins },
      { label: t('menu.statRating'), value: mySupplierProfile && mySupplierProfile.averageRating > 0 ? mySupplierProfile.averageRating.toFixed(1) : '—', icon: Star },
      { label: t('menu.statSince'), value: '2024', icon: Calendar },
    ],
    verifier: [
      { label: t('menu.statInspections'), value: String((verificationTasks || []).filter((task) => task.status === 'submitted').length), icon: Coins },
      { label: t('menu.statRating'), value: verifierRating && verifierRating.count > 0 && verifierRating.average ? verifierRating.average.toFixed(1) : '—', icon: Star },
      { label: t('menu.statSince'), value: '2024', icon: Calendar },
    ],
  };

  const roleProfileLink: Record<string, { label: string; sub: string; onPress: () => void }> = {
    funder: { label: t('menu.transactionHistory'), sub: t('menu.transactionHistorySub'), onPress: () => navigation.navigate('TransactionHistory') },
    contractor: { label: t('menu.contractorProfile'), sub: t('menu.contractorProfileSub'), onPress: () => navigation.navigate('ContractorCerts') },
    seller: { label: t('menu.qaMyListings'), sub: t('menu.myListingsSub'), onPress: () => navigation.navigate('MyLandListings') },
    quincaillerie: { label: t('menu.supplierDashboard'), sub: t('menu.supplierDashboardSub'), onPress: () => navigation.navigate('Materials') },
    verifier: { label: t('menu.verifierProfile'), sub: t('menu.verifierProfileSub'), onPress: () => navigation.navigate('VerifierProfile') },
  };

  const roleQuickActions: Record<string, QuickAction[]> = {
    funder: [
      { label: t('menu.qaFundProject'), icon: Coins, onPress: () => navigation.navigate('Projects') },
      { label: t('menu.messages'), icon: MessageSquare, onPress: () => navigation.navigate('Messages') },
      { label: t('menu.qaRefer'), icon: Gift, onPress: () => navigation.navigate('Referral') },
      { label: t('menu.qaCurrencyTool'), icon: ArrowLeftRight, onPress: () => navigation.navigate('CurrencyConverter') },
    ],
    contractor: [
      { label: t('menu.qaBrowseJobs'), icon: Coins, onPress: () => navigation.navigate('Jobs') },
      { label: t('menu.messages'), icon: MessageSquare, onPress: () => navigation.navigate('Messages') },
      { label: t('menu.qaMyBids'), icon: ClipboardList, onPress: () => navigation.navigate('MyBids') },
      { label: t('menu.qaRefer'), icon: Gift, onPress: () => navigation.navigate('Referral') },
    ],
    seller: [
      { label: t('menu.qaNewListing'), icon: Coins, onPress: () => navigation.navigate('CreateListing') },
      { label: t('menu.messages'), icon: MessageSquare, onPress: () => navigation.navigate('Messages') },
      { label: t('menu.qaMyListings'), icon: ShieldCheck, onPress: () => navigation.navigate('MyLandListings') },
      { label: t('menu.qaRefer'), icon: Gift, onPress: () => navigation.navigate('Referral') },
    ],
    quincaillerie: [
      { label: t('menu.qaDashboard'), icon: Store, onPress: () => navigation.navigate('Materials') },
      { label: t('menu.messages'), icon: MessageSquare, onPress: () => navigation.navigate('Messages') },
      {
        label: t('menu.qaPublicProfile'),
        icon: ShieldCheck,
        onPress: () => (mySupplierProfile ? navigation.navigate('SupplierProfile', { supplierId: mySupplierProfile.id }) : navigation.navigate('Materials')),
      },
      { label: t('menu.qaRefer'), icon: Gift, onPress: () => navigation.navigate('Referral') },
    ],
    verifier: [
      { label: t('menu.qaTaskQueue'), icon: ShieldCheck, onPress: () => navigation.navigate('VerifierTasks') },
      { label: t('menu.messages'), icon: MessageSquare, onPress: () => navigation.navigate('Messages') },
      { label: t('menu.qaMyAudits'), icon: ClipboardList, onPress: () => navigation.navigate('Activity') },
      { label: t('menu.qaRefer'), icon: Gift, onPress: () => navigation.navigate('Referral') },
    ],
  };

  const key = activeRole;
  const unreadCount = notifData?.unreadCount ?? 0;

  const trustScore = trustScoreFor(kycStatus);
  const tierIndex = TIERS.reduce((acc, tier, i) => (trustScore >= tier.min ? i : acc), 0);
  const currentTier = TIERS[tierIndex];
  const nextTier = TIERS[tierIndex + 1];
  const progressToNext = nextTier ? Math.round(((trustScore - currentTier.min) / (nextTier.min - currentTier.min)) * 100) : 100;

  return (
    <Screen
      {...pullToRefresh}
      header={
        <View style={{ backgroundColor: colors.forestDark, paddingTop: 18, paddingBottom: 22, paddingHorizontal: 20, alignItems: 'center' }}>
          <View style={{ position: 'relative', marginBottom: 10 }}>
            <ProgressRing value={trustScore} size={92} stroke={3} color={colors.amber} track="rgba(255,255,255,0.2)">
              <Pressable
                onPress={pickAvatar}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: 39,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: 78, height: 78 }} resizeMode="cover" />
                ) : (
                  <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 30 }}>{name ? name[0] : 'M'}</Text>
                )}
                {uploadAvatar.isPending && (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color="#fff" size="small" />
                  </View>
                )}
              </Pressable>
            </ProgressRing>
            <Pressable
              onPress={pickAvatar}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              style={{
                position: 'absolute',
                bottom: -2,
                left: -2,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colors.amber,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: colors.forestDark,
              }}
            >
              <Camera size={13} color={colors.forestDark} />
            </Pressable>
            <View style={{ position: 'absolute', bottom: -2, right: -2 }}>
              <BadgeCheck size={22} color={colors.seal} fill={colors.seal} />
            </View>
          </View>

          <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 19 }}>{name || 'Mboa Trust User'}</Text>
          <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 3 }}>
            {ROLE_LABEL_KEY[key] ? t(ROLE_LABEL_KEY[key]) : currentRoleMeta.title}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.amber, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' }}>
                {t(currentTier.nameKey)}
              </Text>
            </View>
            <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{t('menu.trustScore')} {trustScore}</Text>
          </View>
        </View>
      }
    >
      <View style={{ padding: 16, gap: 20 }}>
        {/* Quick actions — role-appropriate one-tap shortcuts */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('menu.quickActions')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {(roleQuickActions[key] || roleQuickActions.funder).map((qa) => {
              const Icon = qa.icon;
              return (
                <Pressable
                  key={qa.label}
                  onPress={qa.onPress}
                  accessibilityRole="button"
                  style={{
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.parchmentDark,
                    backgroundColor: colors.surface,
                    minWidth: 78,
                  }}
                >
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={colors.forest} />
                  </View>
                  <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 11 }} numberOfLines={1}>
                    {qa.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 3 stat tiles */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(roleStats[key] || roleStats.funder).map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} style={{ flex: 1, padding: 12, alignItems: 'center' }}>
                <Icon size={14} color={colors.forest} style={{ opacity: 0.7, marginBottom: 4 }} />
                <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>{s.value}</Text>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2, textAlign: 'center' }}>
                  {s.label}
                </Text>
              </Card>
            );
          })}
        </View>

        {/* Membership tier progress */}
        <Card style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 14 }}>{t(currentTier.nameKey)}</Text>
            {nextTier && (
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>
                {trustScore} / {nextTier.min} {t('menu.toNextTier')} {t(nextTier.nameKey)}
              </Text>
            )}
          </View>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginBottom: 10 }}>{t(currentTier.perkKey)}</Text>
          {nextTier ? (
            <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.parchmentDark, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${progressToNext}%`, backgroundColor: colors.amber, borderRadius: 3 }} />
            </View>
          ) : (
            <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('menu.highestTier')}
            </Text>
          )}
        </Card>

        {/* Dedicated advisor */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 16, backgroundColor: colors.forest }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Headset size={19} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 13 }}>{t('menu.advisor')}</Text>
            <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 }}>{t('menu.advisorSub')}</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Messages')}
            accessibilityRole="button"
            style={{ backgroundColor: colors.amber, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forestDark, fontSize: 12 }}>{t('menu.message')}</Text>
          </Pressable>
        </View>

        <GroupedLinks
          title={t('menu.yourAccount')}
          items={[
            { label: (roleProfileLink[key] || roleProfileLink.funder).label, sub: (roleProfileLink[key] || roleProfileLink.funder).sub, onPress: (roleProfileLink[key] || roleProfileLink.funder).onPress, icon: Coins },
            { label: t('menu.idVerification'), sub: t(KYC_LABEL_KEY[kycStatus]), onPress: () => navigation.navigate('Kyc'), icon: ShieldCheck },
            { label: t('menu.switchRole'), sub: t('menu.switchRoleSub'), onPress: () => setRoleSelectorOpen(true), icon: ArrowLeftRight },
          ]}
        />

        <GroupedLinks
          title={t('menu.communication')}
          items={[
            { label: t('menu.messages'), sub: t('menu.messagesSub'), onPress: () => navigation.navigate('Messages'), icon: MessageSquare },
            {
              label: t('menu.notifications'),
              sub: unreadCount > 0 ? `${unreadCount} ${t('menu.unread')}` : t('menu.allCaughtUp'),
              onPress: () => setNotificationsOpen(true),
              icon: Bell,
              right:
                unreadCount > 0 ? (
                  <View style={{ backgroundColor: colors.seal, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}>
                    <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 10, fontWeight: '700' }}>{unreadCount}</Text>
                  </View>
                ) : undefined,
            },
            { label: t('menu.activityLog'), sub: t('menu.activityLogSub'), onPress: () => navigation.navigate('Activity'), icon: ScrollText },
          ]}
        />

        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('menu.community')}
          </Text>
          <Pressable
            onPress={() => navigation.navigate('Referral')}
            accessibilityRole="button"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.parchmentDark,
              backgroundColor: colors.surface,
              marginBottom: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center' }}>
                <Gift size={16} color={colors.forest} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>{t('menu.referFriend')}</Text>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 2 }}>{t('menu.referFriendSub')}</Text>
              </View>
            </View>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>{t('menu.view')}</Text>
          </Pressable>
          <GroupedLinks
            items={[
              { label: t('menu.diasporaGroup'), sub: t('menu.diasporaGroupSub'), onPress: () => navigation.navigate('GroupDashboard'), icon: Wallet },
              { label: t('menu.groupMembers'), sub: t('menu.groupMembersSub'), onPress: () => navigation.navigate('GroupMembers'), icon: Globe },
              { label: t('menu.publicShowcase'), sub: t('menu.publicShowcaseSub'), onPress: () => navigation.navigate('PublicShowcase'), icon: Sparkles },
            ]}
          />
        </View>

        {key !== 'seller' && (
          <GroupedLinks
            title={t('menu.land')}
            items={[
              { label: t('menu.browseLand'), sub: t('menu.browseLandSub'), onPress: () => navigation.navigate('LandMarketplace', { fromMenu: true }), icon: Globe },
            ]}
          />
        )}

        <GroupedLinks
          title={t('menu.financialTools')}
          items={[
            ...(key === 'funder'
              ? [
                  { label: t('menu.recurringContributions'), sub: t('menu.recurringContributionsSub'), onPress: () => navigation.navigate('ManageRecurring'), icon: Wallet },
                  { label: t('menu.projectTemplates'), sub: t('menu.projectTemplatesSub'), onPress: () => navigation.navigate('Templates'), icon: FileText },
                  { label: t('menu.teamPermissions'), sub: t('menu.teamPermissionsSub'), onPress: () => navigation.navigate('TeamManagement'), icon: Users2 },
                ]
              : []),
            ...(key === 'contractor'
              ? [
                  { label: t('menu.teamPermissions'), sub: t('menu.teamPermissionsSubContractor'), onPress: () => navigation.navigate('TeamManagement'), icon: Users2 },
                ]
              : []),
            ...(key === 'contractor' || key === 'funder'
              ? [
                  {
                    label: t('menu.manageSubscription'),
                    sub: key === 'contractor' ? t('menu.proContractorPlan') : t('menu.powerFunderPlan'),
                    onPress: () => navigation.navigate('Subscription'),
                    icon: Sparkles,
                  },
                ]
              : []),
            { label: t('menu.currencyConverter'), sub: t('menu.currencyConverterSub'), onPress: () => navigation.navigate('CurrencyConverter'), icon: ArrowLeftRight },
          ]}
        />

        <GroupedLinks
          title={t('menu.verification')}
          items={[
            {
              label: isVerifierRole ? t('menu.verifierProfile') : t('menu.registerVerifier'),
              sub: isVerifierRole ? t('menu.verifierProfileSub') : t('menu.registerVerifierSub'),
              onPress: () => navigation.navigate(isVerifierRole ? 'VerifierProfile' : 'VerifierRegister'),
              icon: ShieldCheck,
            },
            {
              label: isQuincaillerie ? t('menu.supplierDashboard') : t('menu.registerSupplier'),
              sub: isQuincaillerie ? t('menu.supplierDashboardSub') : t('menu.registerSupplierSub'),
              onPress: () => navigation.navigate(isQuincaillerie ? 'Materials' : 'QuincaillerieRegister'),
              icon: Store,
            },
          ]}
        />

        {/* Admin panel is deliberately web-only (see RootNavigator.tsx's
            AdminGateScreen) — staff use the web console, so unlike web's
            Menu, this doesn't surface admin-only links even when isAdmin. */}

        <GroupedLinks
          title={t('menu.preferencesSupport')}
          items={[
            { label: t('menu.settings'), sub: t('menu.settingsSub'), onPress: () => navigation.navigate('Settings'), icon: SlidersHorizontal },
            { label: t('support.helpCenter'), sub: t('support.helpCenterSub'), onPress: () => navigation.navigate('HelpCenter'), icon: LifeBuoy },
            { label: t('support.myRequests'), sub: t('support.myRequestsSub'), onPress: () => navigation.navigate('MySupportRequests'), icon: ClipboardList },
            { label: t('menu.howItWorks'), sub: t('menu.howItWorksSub'), onPress: () => navigation.navigate('Help'), icon: Monitor },
          ]}
        />

        {/* Appearance quick toggle — mobile-only bonus (web keeps this in
            Settings only); kept here since it's real, tested functionality
            already wired up, not a web-parity requirement. */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('menu.appearance')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = preference === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setPreference(opt.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 12,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: active ? colors.forest : colors.parchmentDark,
                    backgroundColor: active ? colors.forest + '14' : colors.surface,
                  }}
                >
                  <Icon size={18} color={active ? colors.forest : colors.inkSubtle} />
                  <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? colors.forest : colors.inkSubtle }}>{t(opt.labelKey)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <PillButton variant="secondary" onPress={logout} fullWidth>
          {t('menu.logOut')}
        </PillButton>
      </View>
    </Screen>
  );
}
