// Split per-navigator so each screen file only imports the param list it's
// actually part of — mirrors how web's routes are grouped by area in App.tsx.
// Language is the real first screen — mirrors web's onboarding entry point
// exactly (MboaTrustFrontend/src/screens/Onboarding.tsx's LanguageScreen is
// step 1 of the wizard, not a separate marketing/landing screen). There is
// no standalone "Welcome" screen: that was an invented mobile-only step
// that doesn't exist on web and duplicated the Splash experience.
export type AuthStackParamList = {
  Language: undefined;
  Signup: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  OTP: undefined;
};

// Shown whenever AppContext.destination is 'role' or 'profile' — a real
// Firebase account exists but onboarding isn't finished. `wantsQuincaillerie`
// and `wantsVerifier` travel as nav params from Role → Profile →
// QuincaillerieRegister/VerifierRegister, the RN equivalent of web's
// `nav('/profile', { state: { wantsSupplier, wantsVerifier } })`. Both
// registration screens are reachable here (not just from MainStack's
// self-service upgrade path) so a brand-new account can register directly
// as a standalone Quincaillerie/Verifier without ever passing through a
// funder identity first.
export type OnboardingStackParamList = {
  Role: undefined;
  Profile: { wantsQuincaillerie: boolean; wantsVerifier: boolean };
  QuincaillerieRegister: { wantsVerifier?: boolean } | undefined;
  VerifierRegister: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Projects: undefined;
  Jobs: undefined;
  Materials: undefined;
  LandBrowse: undefined;
  VerifierTasks: undefined;
  Activity: undefined;
  Messages: undefined;
  Profile: undefined;
};

// Wraps MainTabs so Funder and Contractor detail flows, self-service upgrades,
// settings, and modal screens can push on top of the tab bar.
export type MainStackParamList = {
  MainTabs: undefined;
  Settings: undefined;
  DeleteAccount: undefined;
  // Funder Stack
  BrowseProjects: undefined;
  ProjectDetail: { projectId: string };
  FundProject: { projectId: string; title: string; remainingAmount: number };
  MilestoneReview: { projectId: string; milestoneId?: string };
  Dispute: { projectId: string; milestoneId: string; milestoneTitle: string };
  VideoVerification: { projectId: string; milestoneId: string; milestoneTitle: string };
  PostJob: undefined;
  TenderBids: { jobId: string; jobTitle: string };
  TransactionHistory: undefined;
  Templates: undefined;
  TeamManagement: undefined;
  Help: undefined;
  HelpCenter: undefined;
  MySupportRequests: undefined;
  SupportRequestDetail: { ticketId: string };
  // Contractor Stack
  BrowseJobs: undefined;
  JobDetail: { jobId: string };
  SubmitBid: { jobId: string; jobTitle: string; budget: number };
  MyBids: undefined;
  MilestoneSubmit: { projectId: string; milestoneId?: string; milestoneTitle?: string };
  ContractDetail: { bidId: string };
  RateContractor: { jobId: string };
  Negotiation: { bidId: string };
  EarningsWithdraw: undefined;
  ContractorCerts: undefined;
  ContractorPortfolio: { userId: string };
  EditContractorPortfolio: undefined;
  ContractorLeaderboard: undefined;
  BrowseContractors: undefined;
  AvailabilityCalendar: { userId?: string } | undefined;
  // Quincaillerie Stack
  MaterialOrders: undefined;
  MaterialOrderDetail: { orderId: string };
  InventoryCatalog: undefined;
  InventoryItemForm: { itemId?: string } | undefined;
  QuincailleriePayouts: undefined;
  RequestMaterials: { projectId: string; milestoneId: string };
  SupplierProfile: { supplierId: string };
  // Land Marketplace Stack
  // Deliberately a different route name than the tab-only 'LandBrowse' (seller's
  // own MainTabs tab) even though both render LandBrowseScreen — App.tsx's own
  // comment documents that two stacks sharing one route name causes
  // NavigationContainer's leftover nav-state to rehydrate onto the wrong
  // screen, so the Menu's "Browse land for sale" (reachable from every role,
  // not just sellers) gets its own name instead of colliding with the tab's.
  LandMarketplace: { fromMenu?: boolean } | undefined;
  PublicShowcase: undefined;
  LandListingDetail: { listingId: string };
  ContactSeller: { listingId: string };
  CreateListing: undefined;
  PurchaseOffer: { listingId: string; title: string; askingPrice: number };
  MyLandListings: undefined;
  ScheduleVisit: { listingId: string; title: string };
  // Field Verifier Stack
  VerifierDashboard: undefined;
  VerifierTaskDetail: { taskId: string };
  VerifierSubmitReport: { taskId: string; projectTitle: string; milestoneTitle: string };
  VerifierProfile: undefined;
  // Messaging, KYC & Platform Settings
  // draftUserId/draftContextType/draftContextId mirror web's `new_<userId>`
  // draft-chat convention (MessagingScreens.tsx's ChatPane): opened before
  // any message has been sent, so there's no real conversationId yet. Either
  // conversationId or draftUserId must be provided.
  ChatThread: {
    conversationId?: string;
    draftUserId?: string;
    draftContextType?: string;
    draftContextId?: string;
    title: string;
    subtitle?: string;
  };
  Kyc: undefined;
  PayoutMethods: undefined;
  NotificationPreferences: undefined;
  MaterialCostEstimator: undefined;
  CurrencyConverter: undefined;
  Subscription: undefined;
  Referral: undefined;
  GroupSetup: undefined;
  JoinGroup: { groupId?: string } | undefined;
  GroupMembers: { groupId?: string } | undefined;
  GroupDashboard: { groupId?: string } | undefined;
  ContractSummary: { bidId: string };
  PooledFunding: { projectId: string };
  InviteCoFunder: { projectId: string };
  RecurringContributionSetup: { projectId: string };
  ManageRecurring: undefined;
  CoSignerManagement: { projectId?: string } | undefined;
  // Self-Service Onboardings
  ContractorOnboarding: undefined;
  VerifierRegister: undefined;
  QuincaillerieRegister: undefined;
};
