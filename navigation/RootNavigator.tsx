import { useState } from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { PillButton } from '../components/PillButton';
import { SplashScreen } from '../screens/SplashScreen';
import { LanguageScreen } from '../screens/onboarding/LanguageScreen';
import { SignupScreen } from '../screens/onboarding/SignupScreen';
import { LoginScreen } from '../screens/onboarding/LoginScreen';
import { ForgotPasswordScreen } from '../screens/onboarding/ForgotPasswordScreen';
import { OTPScreen } from '../screens/onboarding/OTPScreen';
import { RoleScreen } from '../screens/onboarding/RoleScreen';
import { ProfileSetupScreen } from '../screens/onboarding/ProfileSetupScreen';
import { QuincaillerieRegisterScreen } from '../screens/onboarding/QuincaillerieRegisterScreen';
import { MainTabs } from './MainTabs';
import { ContractorOnboardingScreen } from '../screens/ContractorOnboardingScreen';
import { VerifierRegisterScreen } from '../screens/VerifierRegisterScreen';
import type { AuthStackParamList, OnboardingStackParamList, MainStackParamList } from './types';

import { SettingsScreen } from '../screens/SettingsScreen';
import { DeleteAccountScreen } from '../screens/DeleteAccountScreen';
import { BrowseProjectsScreen } from '../screens/funder/BrowseProjectsScreen';
import { ProjectDetailScreen } from '../screens/funder/ProjectDetailScreen';
import { FundProjectScreen } from '../screens/funder/FundProjectScreen';
import { MilestoneReviewScreen } from '../screens/funder/MilestoneReviewScreen';
import { DisputeScreen } from '../screens/funder/DisputeScreen';
import { VideoVerificationScheduleScreen } from '../screens/funder/VideoVerificationScheduleScreen';
import { PostJobScreen } from '../screens/funder/PostJobScreen';
import { TenderBidsScreen } from '../screens/funder/TenderBidsScreen';
import { TransactionHistoryScreen } from '../screens/funder/TransactionHistoryScreen';
import { TemplatesScreen } from '../screens/funder/TemplatesScreen';
import { TeamManagementScreen } from '../screens/funder/TeamManagementScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { HelpCenterScreen } from '../screens/HelpCenterScreen';
import { MySupportRequestsScreen } from '../screens/MySupportRequestsScreen';
import { SupportRequestDetailScreen } from '../screens/SupportRequestDetailScreen';
import { LandBrowseScreen } from '../screens/LandBrowseScreen';
import { PublicShowcaseScreen } from '../screens/PublicShowcaseScreen';
import { RateContractorScreen } from '../screens/funder/RateContractorScreen';
import { NegotiationScreen } from '../screens/NegotiationScreen';
import { BrowseJobsScreen } from '../screens/contractor/BrowseJobsScreen';
import { JobDetailScreen } from '../screens/contractor/JobDetailScreen';
import { SubmitBidScreen } from '../screens/contractor/SubmitBidScreen';
import { MyBidsScreen } from '../screens/contractor/MyBidsScreen';
import { MilestoneSubmitScreen } from '../screens/contractor/MilestoneSubmitScreen';
import { ContractDetailScreen } from '../screens/contractor/ContractDetailScreen';
import { EarningsWithdrawScreen } from '../screens/contractor/EarningsWithdrawScreen';
import { ContractorProfileCertsScreen } from '../screens/contractor/ContractorProfileCertsScreen';
import { ContractorPortfolioScreen } from '../screens/contractor/ContractorPortfolioScreen';
import { EditContractorPortfolioScreen } from '../screens/contractor/EditContractorPortfolioScreen';
import { ContractorLeaderboardScreen } from '../screens/contractor/ContractorLeaderboardScreen';
import { BrowseContractorsScreen } from '../screens/funder/BrowseContractorsScreen';
import { AvailabilityCalendarScreen } from '../screens/contractor/AvailabilityCalendarScreen';
import { MaterialOrdersScreen } from '../screens/quincaillerie/MaterialOrdersScreen';
import { MaterialOrderDetailScreen } from '../screens/quincaillerie/MaterialOrderDetailScreen';
import { InventoryCatalogScreen } from '../screens/quincaillerie/InventoryCatalogScreen';
import { InventoryItemFormScreen } from '../screens/quincaillerie/InventoryItemFormScreen';
import { QuincailleriePayoutsScreen } from '../screens/quincaillerie/QuincailleriePayoutsScreen';
import { RequestMaterialsScreen } from '../screens/RequestMaterialsScreen';
import { SupplierProfileScreen } from '../screens/quincaillerie/SupplierProfileScreen';
import { LandListingDetailScreen } from '../screens/land/LandListingDetailScreen';
import { ContactSellerScreen } from '../screens/land/ContactSellerScreen';
import { CreateListingScreen } from '../screens/land/CreateListingScreen';
import { PurchaseOfferScreen } from '../screens/land/PurchaseOfferScreen';
import { MyLandListingsScreen } from '../screens/land/MyLandListingsScreen';
import { ScheduleVisitScreen } from '../screens/land/ScheduleVisitScreen';
import { VerifierDashboardScreen } from '../screens/verifier/VerifierDashboardScreen';
import { VerifierTaskDetailScreen } from '../screens/verifier/VerifierTaskDetailScreen';
import { VerifierSubmitReportScreen } from '../screens/verifier/VerifierSubmitReportScreen';
import { VerifierProfileScreen } from '../screens/verifier/VerifierProfileScreen';
import { ChatThreadScreen } from '../screens/ChatThreadScreen';
import { KycScreen } from '../screens/KycScreen';
import { PayoutMethodsScreen } from '../screens/PayoutMethodsScreen';
import { NotificationPreferencesScreen } from '../screens/NotificationPreferencesScreen';
import { MaterialCostEstimatorScreen } from '../screens/MaterialCostEstimatorScreen';
import { CurrencyConverterScreen } from '../screens/CurrencyConverterScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { ReferralScreen } from '../screens/ReferralScreen';
import { GroupSetupScreen } from '../screens/groups/GroupSetupScreen';
import { JoinGroupScreen } from '../screens/groups/JoinGroupScreen';
import { GroupMembersScreen } from '../screens/groups/GroupMembersScreen';
import { GroupDashboardScreen } from '../screens/groups/GroupDashboardScreen';
import { ContractSummaryScreen } from '../screens/funder/ContractSummaryScreen';
import { PooledFundingScreen } from '../screens/funder/PooledFundingScreen';
import { InviteCoFunderScreen } from '../screens/funder/InviteCoFunderScreen';
import { RecurringContributionSetupScreen } from '../screens/funder/RecurringContributionSetupScreen';
import { ManageRecurringScreen } from '../screens/funder/ManageRecurringScreen';
import { CoSignerManagementScreen } from '../screens/funder/CoSignerManagementScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

/** Shown when Firebase says we're signed in but our own backend couldn't be
 * reached to resolve the session. The alternative — which is what happened
 * before — was silently routing an onboarded user back into role selection,
 * because a failed /users/me was indistinguishable from "no account yet". */
function ConnectionErrorScreen() {
  const { colors } = useTheme();
  const { refresh, logout } = useApp();
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    try {
      await refresh();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14, backgroundColor: colors.cream }}>
      <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20, textAlign: 'center' }}>Can't reach Mboa Trust</Text>
      <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
        You're still signed in — we just couldn't load your account. Check your connection and try again.
      </Text>
      <PillButton onPress={retry} disabled={retrying} loading={retrying}>Try again</PillButton>
      <Text
        onPress={logout}
        accessibilityRole="button"
        style={{ fontFamily: FONT.sansSemiBold, color: colors.inkMuted, fontSize: 12, marginTop: 4 }}
      >
        Log out
      </Text>
    </View>
  );
}

/** No admin mobile build (staff use the web console) — a real admin account
 * signing in here just gets an honest message instead of either a broken
 * dashboard or being silently misrouted into the consumer app. */
function AdminGateScreen() {
  const { colors } = useTheme();
  const { logout } = useApp();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, backgroundColor: colors.cream }}>
      <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20, textAlign: 'center' }}>Admin console is web-only</Text>
      <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center' }}>
        Sign in from the Mboa Trust web app to manage the platform.
      </Text>
      <PillButton onPress={logout}>Log out</PillButton>
    </View>
  );
}

// destination is the single source of truth for which stack mounts — the RN
// equivalent of web's RequireAuth/RequireRole route guards, driven by the
// same resolveAuthDestination logic (see api/session.ts). `key={destination}`
// on the onboarding stack forces a clean remount with the right
// initialRouteName whenever destination flips between 'role' and 'profile'
// (e.g. a returning user who picked a role but never finished profile setup
// resumes exactly at Profile, never re-picks a role — same as web).
export function RootNavigator() {
  const { destination, authChecked, resolvingPendingRole, sessionUnavailable } = useApp();

  if (!authChecked) return <SplashScreen />;
  // Signed in, but we couldn't reach our own backend to find out who this
  // account is. Without this the app fell through to the onboarding stack
  // and asked an already-onboarded user to pick their roles again.
  if (sessionUnavailable) return <ConnectionErrorScreen />;
  // Holds Home behind the splash screen for the brief window right after
  // login/refresh where a roles.length===0 account's pending Supplier/
  // Verifier status is still being fetched — see AppContext's
  // resolvingPendingRole comment for why rendering Home mid-resolution
  // would flash a real (if momentary) Funder dashboard.
  if (destination === 'home' && resolvingPendingRole) return <SplashScreen />;

  if (destination === 'unauthenticated') {
    return (
      <AuthStack.Navigator
        screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 220 }}
        initialRouteName="Language"
      >
        <AuthStack.Screen name="Language" component={LanguageScreen} />
        <AuthStack.Screen name="Signup" component={SignupScreen} />
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <AuthStack.Screen name="OTP" component={OTPScreen} />
      </AuthStack.Navigator>
    );
  }

  if (destination === 'role' || destination === 'profile') {
    return (
      <OnboardingStack.Navigator
        key={destination}
        screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 220 }}
        initialRouteName={destination === 'role' ? 'Role' : 'Profile'}
      >
        <OnboardingStack.Screen name="Role" component={RoleScreen} />
        <OnboardingStack.Screen name="Profile" component={ProfileSetupScreen} initialParams={{ wantsQuincaillerie: false, wantsVerifier: false }} />
        <OnboardingStack.Screen name="QuincaillerieRegister" component={QuincaillerieRegisterScreen} />
        <OnboardingStack.Screen name="VerifierRegister" component={VerifierRegisterScreen} />
      </OnboardingStack.Navigator>
    );
  }

  if (destination === 'admin') return <AdminGateScreen />;

  return (
    <MainStack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 220,
      }}
    >
      <MainStack.Screen name="MainTabs" component={MainTabs} />
      <MainStack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'card' }} />
      <MainStack.Screen name="DeleteAccount" component={DeleteAccountScreen} options={{ presentation: 'card' }} />
      <MainStack.Screen name="BrowseProjects" component={BrowseProjectsScreen} />
      <MainStack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
      <MainStack.Screen name="FundProject" component={FundProjectScreen} />
      <MainStack.Screen name="MilestoneReview" component={MilestoneReviewScreen} />
      <MainStack.Screen name="Dispute" component={DisputeScreen} />
      <MainStack.Screen name="VideoVerification" component={VideoVerificationScheduleScreen} />
      <MainStack.Screen name="PostJob" component={PostJobScreen} />
      <MainStack.Screen name="TenderBids" component={TenderBidsScreen} />
      <MainStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      <MainStack.Screen name="Templates" component={TemplatesScreen} />
      <MainStack.Screen name="TeamManagement" component={TeamManagementScreen} />
      <MainStack.Screen name="Help" component={HelpScreen} />
      <MainStack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <MainStack.Screen name="MySupportRequests" component={MySupportRequestsScreen} />
      <MainStack.Screen name="SupportRequestDetail" component={SupportRequestDetailScreen} />
      <MainStack.Screen name="LandMarketplace" component={LandBrowseScreen} />
      <MainStack.Screen name="PublicShowcase" component={PublicShowcaseScreen} />
      <MainStack.Screen name="RateContractor" component={RateContractorScreen} />
      <MainStack.Screen name="Negotiation" component={NegotiationScreen} />
      <MainStack.Screen name="BrowseJobs" component={BrowseJobsScreen} />
      <MainStack.Screen name="JobDetail" component={JobDetailScreen} />
      <MainStack.Screen name="SubmitBid" component={SubmitBidScreen} />
      <MainStack.Screen name="MyBids" component={MyBidsScreen} />
      <MainStack.Screen name="MilestoneSubmit" component={MilestoneSubmitScreen} />
      <MainStack.Screen name="ContractDetail" component={ContractDetailScreen} />
      <MainStack.Screen name="EarningsWithdraw" component={EarningsWithdrawScreen} />
      <MainStack.Screen name="ContractorCerts" component={ContractorProfileCertsScreen} />
      <MainStack.Screen name="ContractorPortfolio" component={ContractorPortfolioScreen} />
      <MainStack.Screen name="EditContractorPortfolio" component={EditContractorPortfolioScreen} />
      <MainStack.Screen name="ContractorLeaderboard" component={ContractorLeaderboardScreen} />
      <MainStack.Screen name="BrowseContractors" component={BrowseContractorsScreen} />
      <MainStack.Screen name="AvailabilityCalendar" component={AvailabilityCalendarScreen} />
      <MainStack.Screen name="MaterialOrders" component={MaterialOrdersScreen} />
      <MainStack.Screen name="MaterialOrderDetail" component={MaterialOrderDetailScreen} />
      <MainStack.Screen name="InventoryCatalog" component={InventoryCatalogScreen} />
      <MainStack.Screen name="InventoryItemForm" component={InventoryItemFormScreen} />
      <MainStack.Screen name="QuincailleriePayouts" component={QuincailleriePayoutsScreen} />
      <MainStack.Screen name="RequestMaterials" component={RequestMaterialsScreen} />
      <MainStack.Screen name="SupplierProfile" component={SupplierProfileScreen} />
      <MainStack.Screen name="LandListingDetail" component={LandListingDetailScreen} />
      <MainStack.Screen name="ContactSeller" component={ContactSellerScreen} />
      <MainStack.Screen name="CreateListing" component={CreateListingScreen} />
      <MainStack.Screen name="PurchaseOffer" component={PurchaseOfferScreen} />
      <MainStack.Screen name="MyLandListings" component={MyLandListingsScreen} />
      <MainStack.Screen name="ScheduleVisit" component={ScheduleVisitScreen} />
      <MainStack.Screen name="VerifierDashboard" component={VerifierDashboardScreen} />
      <MainStack.Screen name="VerifierTaskDetail" component={VerifierTaskDetailScreen} />
      <MainStack.Screen name="VerifierSubmitReport" component={VerifierSubmitReportScreen} />
      <MainStack.Screen name="VerifierProfile" component={VerifierProfileScreen} />
      <MainStack.Screen name="ChatThread" component={ChatThreadScreen} />
      <MainStack.Screen name="Kyc" component={KycScreen} />
      <MainStack.Screen name="PayoutMethods" component={PayoutMethodsScreen} />
      <MainStack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
      <MainStack.Screen name="MaterialCostEstimator" component={MaterialCostEstimatorScreen} />
      <MainStack.Screen name="CurrencyConverter" component={CurrencyConverterScreen} />
      <MainStack.Screen name="Subscription" component={SubscriptionScreen} />
      <MainStack.Screen name="Referral" component={ReferralScreen} />
      <MainStack.Screen name="GroupSetup" component={GroupSetupScreen} />
      <MainStack.Screen name="JoinGroup" component={JoinGroupScreen} />
      <MainStack.Screen name="GroupMembers" component={GroupMembersScreen} />
      <MainStack.Screen name="GroupDashboard" component={GroupDashboardScreen} />
      <MainStack.Screen name="ContractSummary" component={ContractSummaryScreen} />
      <MainStack.Screen name="PooledFunding" component={PooledFundingScreen} />
      <MainStack.Screen name="InviteCoFunder" component={InviteCoFunderScreen} />
      <MainStack.Screen name="RecurringContributionSetup" component={RecurringContributionSetupScreen} />
      <MainStack.Screen name="ManageRecurring" component={ManageRecurringScreen} />
      <MainStack.Screen name="CoSignerManagement" component={CoSignerManagementScreen} />
      <MainStack.Screen name="ContractorOnboarding" component={ContractorOnboardingScreen} options={{ presentation: 'card' }} />
      <MainStack.Screen name="VerifierRegister" component={VerifierRegisterScreen} options={{ presentation: 'card' }} />
      <MainStack.Screen name="QuincaillerieRegister" component={QuincaillerieRegisterScreen} options={{ presentation: 'card' }} />
    </MainStack.Navigator>
  );
}
