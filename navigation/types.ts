// Split per-navigator so each screen file only imports the param list it's
// actually part of — mirrors how web's routes are grouped by area in App.tsx.
export type AuthStackParamList = {
  Welcome: undefined;
  Language: undefined;
  Signup: undefined;
  Login: undefined;
  ForgotPassword: undefined;
};

// Shown whenever AppContext.destination is 'role' or 'profile' — a real
// Firebase account exists but onboarding isn't finished. `wantsQuincaillerie`
// travels as a nav param from Role → Profile → QuincaillerieRegister, the RN
// equivalent of web's `nav('/profile', { state: { wantsQuincaillerie } })`.
export type OnboardingStackParamList = {
  Role: undefined;
  Profile: { wantsQuincaillerie: boolean };
  QuincaillerieRegister: undefined;
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
  // Funder Stack
  BrowseProjects: undefined;
  ProjectDetail: { projectId: string };
  CreateProject: undefined;
  FundProject: { projectId: string; title: string; remainingAmount: number };
  MilestoneReview: { projectId: string; milestoneId?: string };
  Dispute: { projectId: string; milestoneId: string; milestoneTitle: string };
  PostJob: undefined;
  TenderBids: { jobId: string; jobTitle: string };
  // Contractor Stack
  BrowseJobs: undefined;
  JobDetail: { jobId: string };
  SubmitBid: { jobId: string; jobTitle: string; budget: number };
  MyBids: undefined;
  MilestoneSubmit: { projectId: string; milestoneId?: string; milestoneTitle?: string };
  EarningsWithdraw: undefined;
  ContractorCerts: undefined;
  // Quincaillerie Stack
  MaterialOrders: undefined;
  MaterialOrderDetail: { orderId: string };
  InventoryCatalog: undefined;
  QuincailleriePayouts: undefined;
  // Land Marketplace Stack
  BrowseLand: undefined;
  LandListingDetail: { listingId: string };
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
  ChatThread: { conversationId: string; title: string; subtitle?: string };
  Kyc: undefined;
  PayoutMethods: undefined;
  NotificationPreferences: undefined;
  MaterialCostEstimator: undefined;
  // Self-Service Onboardings
  ContractorOnboarding: undefined;
  VerifierRegister: undefined;
  QuincaillerieRegister: undefined;
};
