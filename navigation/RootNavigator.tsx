import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { PillButton } from '../components/PillButton';
import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { LanguageScreen } from '../screens/onboarding/LanguageScreen';
import { SignupScreen } from '../screens/onboarding/SignupScreen';
import { LoginScreen } from '../screens/onboarding/LoginScreen';
import { ForgotPasswordScreen } from '../screens/onboarding/ForgotPasswordScreen';
import { RoleScreen } from '../screens/onboarding/RoleScreen';
import { ProfileSetupScreen } from '../screens/onboarding/ProfileSetupScreen';
import { QuincaillerieRegisterScreen } from '../screens/onboarding/QuincaillerieRegisterScreen';
import { MainTabs } from './MainTabs';
import { ContractorOnboardingScreen } from '../screens/ContractorOnboardingScreen';
import { VerifierRegisterScreen } from '../screens/VerifierRegisterScreen';
import type { AuthStackParamList, OnboardingStackParamList, MainStackParamList } from './types';

import { SettingsScreen } from '../screens/SettingsScreen';
import { BrowseProjectsScreen } from '../screens/funder/BrowseProjectsScreen';
import { ProjectDetailScreen } from '../screens/funder/ProjectDetailScreen';
import { CreateProjectScreen } from '../screens/funder/CreateProjectScreen';
import { FundProjectScreen } from '../screens/funder/FundProjectScreen';
import { MilestoneReviewScreen } from '../screens/funder/MilestoneReviewScreen';
import { DisputeScreen } from '../screens/funder/DisputeScreen';
import { PostJobScreen } from '../screens/funder/PostJobScreen';
import { TenderBidsScreen } from '../screens/funder/TenderBidsScreen';
import { BrowseJobsScreen } from '../screens/contractor/BrowseJobsScreen';
import { JobDetailScreen } from '../screens/contractor/JobDetailScreen';
import { SubmitBidScreen } from '../screens/contractor/SubmitBidScreen';
import { MyBidsScreen } from '../screens/contractor/MyBidsScreen';
import { MilestoneSubmitScreen } from '../screens/contractor/MilestoneSubmitScreen';
import { EarningsWithdrawScreen } from '../screens/contractor/EarningsWithdrawScreen';
import { ContractorProfileCertsScreen } from '../screens/contractor/ContractorProfileCertsScreen';
import { QuincaillerieDashboardScreen } from '../screens/quincaillerie/QuincaillerieDashboardScreen';
import { MaterialOrdersScreen } from '../screens/quincaillerie/MaterialOrdersScreen';
import { MaterialOrderDetailScreen } from '../screens/quincaillerie/MaterialOrderDetailScreen';
import { InventoryCatalogScreen } from '../screens/quincaillerie/InventoryCatalogScreen';
import { QuincailleriePayoutsScreen } from '../screens/quincaillerie/QuincailleriePayoutsScreen';
import { BrowseLandScreen } from '../screens/land/BrowseLandScreen';
import { LandListingDetailScreen } from '../screens/land/LandListingDetailScreen';
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

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

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
  const { destination, authChecked } = useApp();

  if (!authChecked) return <SplashScreen />;

  if (destination === 'unauthenticated') {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
        <AuthStack.Screen name="Language" component={LanguageScreen} />
        <AuthStack.Screen name="Signup" component={SignupScreen} />
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      </AuthStack.Navigator>
    );
  }

  if (destination === 'role' || destination === 'profile') {
    return (
      <OnboardingStack.Navigator key={destination} screenOptions={{ headerShown: false }} initialRouteName={destination === 'role' ? 'Role' : 'Profile'}>
        <OnboardingStack.Screen name="Role" component={RoleScreen} />
        <OnboardingStack.Screen name="Profile" component={ProfileSetupScreen} initialParams={{ wantsQuincaillerie: false }} />
        <OnboardingStack.Screen name="QuincaillerieRegister" component={QuincaillerieRegisterScreen} />
      </OnboardingStack.Navigator>
    );
  }

  if (destination === 'admin') return <AdminGateScreen />;

  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 220,
      }}
    >
      <MainStack.Screen name="MainTabs" component={MainTabs} />
      <MainStack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'card' }} />
      <MainStack.Screen name="BrowseProjects" component={BrowseProjectsScreen} />
      <MainStack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
      <MainStack.Screen name="CreateProject" component={CreateProjectScreen} />
      <MainStack.Screen name="FundProject" component={FundProjectScreen} />
      <MainStack.Screen name="MilestoneReview" component={MilestoneReviewScreen} />
      <MainStack.Screen name="Dispute" component={DisputeScreen} />
      <MainStack.Screen name="PostJob" component={PostJobScreen} />
      <MainStack.Screen name="TenderBids" component={TenderBidsScreen} />
      <MainStack.Screen name="BrowseJobs" component={BrowseJobsScreen} />
      <MainStack.Screen name="JobDetail" component={JobDetailScreen} />
      <MainStack.Screen name="SubmitBid" component={SubmitBidScreen} />
      <MainStack.Screen name="MyBids" component={MyBidsScreen} />
      <MainStack.Screen name="MilestoneSubmit" component={MilestoneSubmitScreen} />
      <MainStack.Screen name="EarningsWithdraw" component={EarningsWithdrawScreen} />
      <MainStack.Screen name="ContractorCerts" component={ContractorProfileCertsScreen} />
      <MainStack.Screen name="MaterialOrders" component={MaterialOrdersScreen} />
      <MainStack.Screen name="MaterialOrderDetail" component={MaterialOrderDetailScreen} />
      <MainStack.Screen name="InventoryCatalog" component={InventoryCatalogScreen} />
      <MainStack.Screen name="QuincailleriePayouts" component={QuincailleriePayoutsScreen} />
      <MainStack.Screen name="BrowseLand" component={BrowseLandScreen} />
      <MainStack.Screen name="LandListingDetail" component={LandListingDetailScreen} />
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
      <MainStack.Screen name="ContractorOnboarding" component={ContractorOnboardingScreen} options={{ presentation: 'card' }} />
      <MainStack.Screen name="VerifierRegister" component={VerifierRegisterScreen} options={{ presentation: 'card' }} />
      <MainStack.Screen name="QuincaillerieRegister" component={QuincaillerieRegisterScreen} options={{ presentation: 'card' }} />
    </MainStack.Navigator>
  );
}
