# MboaTrust web app — full route / feature / API map

Source of truth: `MboaTrustFrontend/src/App.tsx` (routes), `MboaTrustFrontend/src/api/*.ts`
(hooks + endpoints), `MboaTrustFrontend/src/context.tsx` (global app state).
Backend: `MboaTrustBackend/src/routes/*.js` + controllers. All endpoints below are
relative to `EXPO_PUBLIC_API_BASE_URL` (`/api/v1`).

This is the reference for the React Native build. Build order follows the
numbered sections — each is a self-contained vertical slice that can be
implemented, wired to the real backend, and tested before the next one.

## Auth model (shared by web and must be mirrored 1:1 on mobile)

- Real auth: Firebase (phone OTP / Google / email) — `api/firebaseAuth.ts`. Axios attaches
  `Authorization: Bearer <idToken>` when a Firebase user exists (`api/client.ts`).
- Dev bypass (**this is what's actually wired up today** — Firebase phone sign-in UI exists
  but isn't connected to real verification yet, see `devController.js`): when no Firebase
  token, axios attaches `x-dev-user-id: <mongoId>`. That id comes from
  `GET /dev/demo-user?role=<funder|recipient|contractor|seller|null-role>`, which
  find-or-creates one fixed demo User per role (`api/devAuth.ts`). Backend requires
  `DEV_AUTH_BYPASS=true` (dev-only, rejected in production).
- `GET /users/me` resolves the current session (real or dev) → `resolveAuthDestination`
  decides `admin | home | role | profile` based on `onboardingCompleted` / roles.
- Roles (`User.roles[].roleType`): `funder`, `recipient`, `contractor`, `land_seller`,
  `verifier`, `quincaillerie`, `admin`. A user can hold several simultaneously. The
  sidebar/tab bar exposes Verifier + Admin panels from ANY primary role as a demo
  convenience (`wantedRoles` in devController.js).
- Mobile plan: replicate the dev-bypass path first (same backend, zero extra setup),
  structure the auth layer so real Firebase (phone/Google) can be dropped in later
  without touching screens (see `api/client.ts` equivalent).

## 1. Onboarding / Auth — build first, blocks everything else

| Route | Screen | Backend |
|---|---|---|
| `/` | LandingScreen (marketing, signed-out) | — |
| `/language` | LanguageScreen (en/fr) | — |
| `/signup` | SignupScreen (phone/email/Google) | Firebase; dev bypass fallback |
| `/otp` | OTPScreen | Firebase phone confirm |
| `/login` | LoginScreen | Firebase / dev bypass |
| `/role` | RoleScreen (funder/recipient/contractor/seller) | `POST /users/me/roles` |
| `/profile` | ProfileSetupScreen (name, residence, avatar) | `PATCH /users/me`, `POST /users/me/avatar` |

## 2. Shared shell — Home + navigation chrome

| Route | Screen | Backend |
|---|---|---|
| `/home` | HomeScreen — role-specific dashboard | `GET /users/me`, `GET /projects`, `GET /notifications`, `GET /fee-config` |
| `/activity` | GlobalActivityScreen | `GET /activity/mine` |
| `/shared/settings` | SettingsScreen | `GET/PATCH /users/me` |
| `/shared/settings/delete-account` | DeleteAccountScreen | `DELETE /users/me` |
| `/shared/help` | HelpScreen | static |
| `/shared/profile` | ProfileScreen (view any user) | `GET /users/:id` |
| `/shared/notifications/preferences` | NotificationPreferencesScreen | `GET/PATCH /notification-preferences/me` |
| `/account/payout-settings` | PayoutSettingsScreen | `POST/DELETE /users/me/payout-methods` |
| `/account/subscription` | SubscriptionScreen | `GET/POST /subscriptions` |
| `/tools/currency-converter` | CurrencyConverterScreen | `GET /tools/convert` |
| bottom-nav | Messages badge, notifications bell | `GET /notifications`, socket.io |

Bottom tab bar (per role, mirrors `MobileLayout.tsx`'s nav config): **Home, Projects/Jobs
(role-specific), Messages, Activity, Profile**. Funder/Recipient/Contractor/Seller each
see a differently-labeled 2nd tab; Verifier/Admin reachable via Profile menu.

## 3. Funder

| Route | Screen | Backend |
|---|---|---|
| `/workspace/projects` | WorkspaceProjectsScreen (kanban) | `GET /projects?ownerId=me`, `POST /projects/:id/cancel` |
| `/funder/browse` | BrowseProjectsScreen | `GET /projects?projectType=funding` |
| `/funder/project/:id` | ProjectDetailScreen | `GET /projects/:id`, `GET /escrows?projectId=` |
| `/funder/create` | CreateProjectScreen | `POST /projects` |
| `/funder/fund` | FundProjectScreen | `POST /projects/:id/fund` (Stripe/MoMo/OM), `POST /escrows/:id/refresh-status` |
| `/funder/milestones` | MilestonesScreen | embedded in project |
| `/funder/review/:id?` | MilestoneReviewScreen (approve/reject) | `POST /projects/:id/milestones/:mid/approval` |
| `/funder/dispute/:id/:milestoneId` | DisputeScreen | `POST /projects/:id/milestones/:mid/dispute` |
| `/funder/video-verification/:pid/:mid` | VideoVerificationScheduleScreen | `POST /video-verifications` |
| `/funder/transactions` | TransactionHistoryScreen | `GET /escrows` |
| `/funder/contractors` | BidComparisonScreen | `GET /bids?projectId=` |
| `/funder/post-job` | PostJobScreen (tender) | `POST /projects` (projectType=tender) |
| `/funder/tender/:jobId/bids` | TenderBidsScreen | `GET /bids?projectId=`, accept bid |
| `/negotiation/:bidId` | NegotiationScreen | `GET/POST /bids/:id/negotiate` |
| `/funder/contract-summary/:bidId` | ContractSummaryScreen | `GET /contracts?bidId=` |
| `/funder/rate-contractor/:jobId`, `/funder/rate-recipient/:id` | Rating screens | `POST /ratings` |
| `/funder/recipient/:id?` | RecipientProfileScreen | `GET /users/:id`, `GET /ratings` |
| `/funder/co-signer/:projectId?` | AddCoSignerScreen | `POST /pooled-contributions/invite` |
| `/funder/project/:id/funding` | PooledFundingScreen | `GET /pooled-contributions?projectId=` |
| `/funder/invite-cofunder/:projectId?` | InviteCoFunderScreen | `POST /pooled-contributions/invite` |
| `/funder/recurring/new/:projectId?`, `/funder/recurring` | Recurring contribution screens | `POST/GET /pooled-contributions` (isRecurring) |
| `/funder/templates` | TemplatesScreen | `GET/POST /project-templates` |
| `/workspace/team` | TeamManagementScreen | `GET/POST /team-members` |

## 4. Recipient

| Route | Screen | Backend |
|---|---|---|
| `/recipient/projects` | RecipientProjectsScreen | `GET /projects?ownerId=me` |
| `/recipient/submit/:id?` (shared with contractor) | MilestoneSubmitScreen | `POST /projects/:id/milestones/:mid/evidence` |
| `/recipient/submission-status` | SubmissionStatusScreen | `GET /projects` |
| `/recipient/withdrawal` | WithdrawalScreen (shared with contractor) | `GET /escrows/withdrawable`, `POST /escrows/withdraw` |
| `/recipient/reputation` | ReputationScreen | `GET /ratings` |
| `/recipient/history` | ProjectHistoryScreen | `GET /projects` |

## 5. Contractor

| Route | Screen | Backend |
|---|---|---|
| `/contractor/onboarding` | ContractorOnboardingScreen | `POST /users/me/roles`, `POST /contractor-profiles` |
| `/contractor/profile` | ContractorProfileScreen (Earnings + certs) | `GET /contractor-profiles`, `GET /escrows?type=release`, `GET/POST/DELETE /contractor-certifications` |
| `/contractor/jobs` | BrowseJobsScreen | `GET /projects?projectType=tender` |
| `/contractor/job/:id` | JobDetailScreen | `GET /projects/:id` |
| `/contractor/bid/:id?` | SubmitBidScreen | `POST /bids` |
| `/contractor/bids` | MyBidsScreen | `GET /bids?contractorId=me` |
| `/contractor/contract/:bidId` | ContractDetailScreen | `GET /contracts?bidId=`, `GET /projects/:id` |
| `/contractor/earnings` | EarningsScreen | `GET /escrows?type=release` |
| `/contractor/portfolio/edit`, `/contractor/portfolio/:userId` | Portfolio screens | `GET/PATCH /contractor-profiles` |
| `/contractor/certifications/new` | AddCertificationScreen | `POST /contractor-certifications` (multipart) |
| `/contractor/availability/:contractorId?` | AvailabilityCalendarScreen | part of contractor-profiles |
| `/tools/material-estimator` | MaterialCostEstimatorScreen | static calculator |
| `/materials/request/:projectId/:milestoneId` | RequestMaterialsScreen | `POST /material-orders` |

## 6. Land marketplace

| Route | Screen | Backend |
|---|---|---|
| `/land/browse` | BrowseLandScreen | `GET /land-listings` |
| `/land/listing/:id` | LandListingDetailScreen | `GET /land-listings/:id` |
| `/land/contact/:id?` | ContactSellerScreen | `POST /messages/direct` |
| `/land/offer/:id?` | PurchaseOfferScreen | `POST /land-offers` |
| `/land/create` | CreateListingScreen | `POST /land-listings` (multipart photos) |
| `/land/my-listings` | MyListingsScreen | `GET /land-listings?sellerId=me` |
| `/land/schedule/:id` | LandScheduleVisitScreen | `POST /visit-requests` |
| `/workspace/land` | WorkspaceLandScreen | `GET /land-listings?sellerId=me`, `GET /land-offers` |

## 7. Verifier

| Route | Screen | Backend |
|---|---|---|
| `/verifier/register` | VerifierRegistrationScreen | `POST /verifier-profiles/me` |
| `/verifier/dashboard` | VerifierDashboard | `GET /verification-tasks` |
| `/verifier/task/:id` | VerifierTaskDetailScreen | `GET /verification-tasks/:id` |
| `/verifier/report/:id?` | VerifierReportScreen | `POST /verification-tasks/:id/report` |
| `/verifier/profile` | VerifierProfileScreen | `GET/POST /verifier-profiles/me` |

## 8. Quincaillerie (hardware store)

| Route | Screen | Backend |
|---|---|---|
| `/quincaillerie/register` | QuincaillerieRegistrationScreen | `POST /quincaillerie-profiles/me` |
| `/quincaillerie/dashboard` | QuincaillerieDashboardScreen | `GET /material-orders/for-quincaillerie` |
| `/quincaillerie/profile/:id` | QuincaillerieProfileScreen | `GET /quincaillerie-profiles/:id` |
| `/quincaillerie/inventory` | InventoryScreen | `GET /inventory-items/mine` |
| `/quincaillerie/inventory/new`, `/:id/edit` | InventoryItemFormScreen | `POST/PATCH /inventory-items` |

## 9. Messaging (real-time, socket.io)

| Route | Screen | Backend |
|---|---|---|
| `/messages` | ConversationListScreen | `GET /conversations` |
| `/messages/:id` | ChatDetailScreen (incl. `new_<userId>` draft ids — see below) | `GET/POST /conversations/:id/messages`, `POST /messages/direct`, `GET /conversations/direct/:userId`, socket `message:new` |

**Important, non-obvious backend contract fixed this session**: a 1:1 conversation is
unique per pair of users (`Conversation.directKey`, unique index) regardless of which
screen started it. Opening a chat never persists anything — only `POST /messages/direct`
(first message) or an existing conversation does. Mobile MUST reproduce this
draft-until-first-send pattern, not eagerly `POST /conversations` on chat-open.

## 10. Community / referrals

| Route | Screen | Backend |
|---|---|---|
| `/groups/create` | GroupSetupScreen | `POST /groups` |
| `/groups/join/:id?` | JoinGroupScreen | `POST /groups/:id/join` |
| `/groups/members/:id?` | GroupMembersScreen | `GET /groups/:id/dashboard`, `POST /groups/:id/invite` |
| `/groups/dashboard/:id?` | GroupDashboardScreen | `GET /groups/:id/dashboard` |
| `/referrals` | ReferralScreen | `GET/POST /referrals` |

## 11. Compliance

| Route | Screen | Backend |
|---|---|---|
| `/compliance/kyc` | KycExplainerScreen | static |
| `/compliance/kyc/verify` | KycVerifyScreen | `POST /kyc/verify`, `POST /users/me/documents` |

## 12. Admin (separate auth guard, `RequireAdmin`)

| Route | Screen | Backend |
|---|---|---|
| `/admin/login` | AdminLoginScreen | Firebase / dev bypass, `isAdmin` check |
| `/admin` | AdminOverviewScreen | `GET /admin/platform-stats`, `/admin/system-health` |
| `/admin/users` | AdminUsersScreen | `GET/POST /admin/users` |
| `/admin/projects` | AdminProjectsScreen | `GET /projects` (admin, unscoped) |
| `/admin/land` | AdminLandScreen | `GET /land-listings` (admin) |
| `/admin/contractors` | AdminContractorsScreen | `GET /contractor-profiles` (admin) |
| `/admin/community` | AdminCommunityScreen | `GET /admin/team-members`, `/admin/subscriptions` |
| `/admin/verifications` | AdminVerificationsScreen | `GET /verification-tasks` (admin) |
| `/admin/notifications` | AdminNotificationsScreen | `GET /admin/notifications`, `POST .../broadcast` |
| `/admin/settings` | AdminSettingsScreen | `GET /fee-config` |
| `/admin/accounts` | AdminAccountsScreen | `GET /admin/admins` |
| `/admin/disputes` | DisputeResolutionScreen | `GET/PATCH /disputes` |
| `/admin/fraud-analytics` | AdminFraudAnalyticsScreen | `GET /risk-flags`, `/risk-flags/summary` |

Admin is explicitly **deferred to last** — it's a staff console, not part of the core
mobile user experience, and every admin screen is a variant of a consumer list screen
already being built.

## Cross-cutting infra to build once, reuse everywhere

- **API client** (`api/client.ts` equiv.): axios instance, base URL from env, dev-bypass
  header interceptor, `apiErrorMessage(err)` helper.
- **React Query**: same query-key conventions as web (`['projects', ...]`, `['project', id]`,
  etc.) so the caching lessons already fixed on web (see this session's stale-cache fixes)
  aren't reintroduced on mobile.
- **Theme**: exact color hex values pulled from `index.css` (light + dark), `Fraunces` /
  `Inter` / `JetBrains Mono` fonts via `@expo-google-fonts/*`.
- **Icons**: `lucide-react-native` — same icon set as web's `lucide-react`, 1:1 name parity.
- **Navigation**: stack (auth/onboarding/detail screens) nested inside role-aware bottom
  tabs, guarded the same way `RequireAuth`/`RequireRole`/`RequireAdmin` guard web routes.
- **Socket.io**: `socket.io-client`, same event names as `api/socket.ts`.
