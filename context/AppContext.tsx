import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onFirebaseAuthChange, firebaseSignOut } from '../api/firebaseAuth';
import { fetchBackendUser, mapBackendRoles, isAdminUser, resolveAuthDestination, type BackendUser } from '../api/session';
import { useMySupplierProfileQuery } from '../api/supplierProfiles';
import { useMyVerifierProfileQuery } from '../api/verifier';
import { claimTeamMemberships } from '../api/teamMembers';
import { useGlobalRealtime } from '../api/realtime';
import { disconnectSocket } from '../api/socket';
import type { Lang } from '../i18n/translations';
import type { SupportTicketType } from '../api/support';

// Ported from MboaTrustFrontend/src/context.tsx's completeAuthSuccess/
// resolveAuthDestination — real Firebase auth state drives everything now
// (see api/firebaseAuth.ts), not a cached "last picked role". `destination`
// is the single source of truth RootNavigator switches screens on, the RN
// equivalent of web's imperative `nav(path)` calls after each auth step:
// here, any screen that changes the backend user's state (role picked,
// profile completed) just calls `refresh()` and the navigator reacts.
export type Role = 'funder' | 'contractor' | 'seller' | 'quincaillerie' | 'verifier' | null;
export type AuthDestination = 'unauthenticated' | 'role' | 'profile' | 'home' | 'admin';

interface AppContextValue {
  destination: AuthDestination;
  authChecked: boolean;
  /** Signed in, but the backend couldn't be reached to resolve the session.
   * Distinct from "no account" — RootNavigator shows a retry screen rather
   * than dropping the user into onboarding. */
  sessionUnavailable: boolean;
  /** True only while a roles.length===0 account's pending Supplier/Verifier
   * application status is still being resolved — see the comment at its
   * computation. RootNavigator holds the splash screen through this so
   * Home never briefly renders with `activeRole` defaulted to 'funder'. */
  resolvingPendingRole: boolean;
  user: BackendUser | null;
  roles: NonNullable<Role>[];
  activeRole: NonNullable<Role>;
  setActiveRole: (role: NonNullable<Role>) => void;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  /** Initialized from the real `user.preferredLanguage` on login/refresh
   * (see hydrate below) — account-scoped global UI state exactly like
   * `activeRole`, not a separate provider. SettingsScreen's language toggle
   * calls `setLanguage` directly (alongside persisting the choice via
   * useUpdatePreferredLanguageMutation), so every screen reading it through
   * useTranslation() re-renders in the new language immediately. */
  language: Lang;
  setLanguage: (lang: Lang) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  roleSelectorOpen: boolean;
  setRoleSelectorOpen: (open: boolean) => void;
  quickActionOpen: boolean;
  setQuickActionOpen: (open: boolean) => void;
  /** Mirrors notificationsOpen's shape — the global "Help & feedback" sheet
   * (components/FeedbackSheet.tsx, rendered once from components/Screen.tsx)
   * reachable from Header's icon on every screen. `preset` carries an
   * optional ticket type (skips the type picker) and the context captured
   * at the moment it was opened (current route name), shown to the user as
   * a removable chip — see Header.tsx's onPress. */
  feedbackSheetOpen: boolean;
  feedbackPreset: { type?: SupportTicketType; screen?: string; screenLabel?: string; feature?: string } | null;
  setFeedbackSheetOpen: (open: boolean, preset?: { type?: SupportTicketType; screen?: string; screenLabel?: string; feature?: string }) => void;
  /** Re-fetches GET /users/me and recomputes `destination` — call after any
   * mutation that changes onboarding state (role picked, profile finished). */
  refresh: () => Promise<AuthDestination>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [destination, setDestination] = useState<AuthDestination>('unauthenticated');
  const [authChecked, setAuthChecked] = useState(false);
  // True when we're signed in to Firebase but couldn't reach our own
  // backend to resolve the session — see refresh() below.
  const [sessionUnavailable, setSessionUnavailable] = useState(false);
  const [user, setUser] = useState<BackendUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<NonNullable<Role> | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [roleSelectorOpen, setRoleSelectorOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [feedbackSheetOpen, setFeedbackSheetOpenState] = useState(false);
  const [feedbackPreset, setFeedbackPreset] = useState<{ type?: SupportTicketType; screen?: string; screenLabel?: string; feature?: string } | null>(null);
  const setFeedbackSheetOpen = (open: boolean, preset?: { type?: SupportTicketType; screen?: string; screenLabel?: string; feature?: string }) => {
    if (open) setFeedbackPreset(preset ?? null);
    setFeedbackSheetOpenState(open);
  };
  const [language, setLanguage] = useState<Lang>('en');
  const firebaseSignedIn = useRef(false);
  // Once per session, right after auth resolves — links any team-roster rows
  // this account was invited into by email before it existed. Same
  // best-effort, swallow-failures convention as web's team.tsx.
  const teamMembershipsClaimed = useRef(false);

  const hydrate = (backendUser: BackendUser | null) => {
    setUser(backendUser);
    if (backendUser) {
      const userRoles = mapBackendRoles(backendUser.roles);
      if (userRoles.length > 0 && (!selectedRole || !userRoles.includes(selectedRole))) {
        setSelectedRole(userRoles[0]);
      }
      if (backendUser.preferredLanguage) {
        setLanguage(backendUser.preferredLanguage);
      }
    }
  };

  const refresh = async (): Promise<AuthDestination> => {
    if (!firebaseSignedIn.current) {
      setDestination('unauthenticated');
      hydrate(null);
      setSessionUnavailable(false);
      return 'unauthenticated';
    }
    let backendUser: BackendUser | null;
    try {
      backendUser = await fetchBackendUser();
    } catch {
      // Backend unreachable (see SessionUnavailableError). The account's
      // real state is unknown, so deliberately do NOT touch `destination`
      // here: treating this like a null user would route a signed-in,
      // fully-onboarded person back into role selection. RootNavigator
      // shows a retry screen off this flag instead.
      setSessionUnavailable(true);
      return destination;
    }
    setSessionUnavailable(false);
    hydrate(backendUser);
    const dest = resolveAuthDestination(backendUser);
    setDestination(dest);
    return dest;
  };

  useEffect(() => {
    const unsubscribe = onFirebaseAuthChange(async (fbUser) => {
      firebaseSignedIn.current = !!fbUser;
      if (fbUser) {
        await refresh();
        if (!teamMembershipsClaimed.current) {
          teamMembershipsClaimed.current = true;
          claimTeamMemberships();
        }
      } else {
        setDestination('unauthenticated');
        hydrate(null);
        qc.clear();
        disconnectSocket();
      }
      setAuthChecked(true);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    await firebaseSignOut();
    // onFirebaseAuthChange's callback (above) handles clearing state —
    // firebaseSignOut() triggers it synchronously with fbUser=null.
  };

  const roles = user ? mapBackendRoles(user.roles) : [];
  // A Supplier or Verifier application is real, pending state — not
  // "no role, default to funder". `roles` only reflects backend-granted
  // roleTypes (see mapBackendRoles), which for these two is admin-approval-
  // only (see QuincaillerieRegisterScreen/VerifierRegisterScreen), so an
  // account mid-review always has roles.length === 0 right up until
  // approval. Checking these two pending-application queries before
  // falling back to 'funder' is what stops a brand-new Supplier/Verifier
  // applicant from being silently attached to the funder identity/dashboard
  // they never chose and the backend never granted — ported from web's
  // identical fix in Dashboard.tsx's HomeScreen (role === null branch).
  const pendingApplicationsEnabled = authChecked && roles.length === 0 && !!user;
  const { data: pendingSupplier, isLoading: isLoadingPendingSupplier } = useMySupplierProfileQuery(pendingApplicationsEnabled);
  const { data: pendingVerifier, isLoading: isLoadingPendingVerifier } = useMyVerifierProfileQuery(pendingApplicationsEnabled);
  const pendingRole: NonNullable<Role> | null = pendingSupplier ? 'quincaillerie' : pendingVerifier ? 'verifier' : null;
  // True only in the brief window right after login/refresh for a
  // roles.length===0 account, before we know whether it's a genuine
  // no-role account or a pending Supplier/Verifier applicant. Without this,
  // `activeRole` briefly falls back to 'funder' (both pending queries still
  // loading, so `pendingRole` is null) and a pending applicant sees a real,
  // if momentary, Funder dashboard flash on every login before it
  // self-corrects — the same "never attach to Funder" bug, just transient
  // instead of persistent. RootNavigator holds the splash screen a beat
  // longer for this instead of rendering Home mid-resolution.
  const resolvingPendingRole = pendingApplicationsEnabled && (isLoadingPendingSupplier || isLoadingPendingVerifier);
  const activeRole: NonNullable<Role> =
    selectedRole && (roles.includes(selectedRole) || selectedRole === pendingRole)
      ? selectedRole
      : roles.length > 0
        ? roles[0]
        : (pendingRole ?? 'funder');

  // App-wide live updates (bids, milestones, project postings, notification
  // bell, inbox) for whatever screen is currently open — see api/realtime.ts.
  // Messaging's own open-thread live-append (useConversationRealtime) is
  // separate and untouched by this.
  useGlobalRealtime(user?._id);

  return (
    <AppContext.Provider
      value={{
        destination,
        authChecked,
        sessionUnavailable,
        resolvingPendingRole,
        user,
        roles,
        activeRole,
        setActiveRole: setSelectedRole,
        name: user?.fullName || '',
        avatarUrl: user?.avatarUrl ?? null,
        isAdmin: isAdminUser(user),
        language,
        setLanguage,
        notificationsOpen,
        setNotificationsOpen,
        roleSelectorOpen,
        setRoleSelectorOpen,
        quickActionOpen,
        setQuickActionOpen,
        feedbackSheetOpen,
        feedbackPreset,
        setFeedbackSheetOpen,
        refresh,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
