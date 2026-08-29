import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onFirebaseAuthChange, firebaseSignOut } from '../api/firebaseAuth';
import { fetchBackendUser, mapBackendRoles, isAdminUser, resolveAuthDestination, type BackendUser } from '../api/session';

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
  user: BackendUser | null;
  roles: NonNullable<Role>[];
  activeRole: NonNullable<Role>;
  setActiveRole: (role: NonNullable<Role>) => void;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  roleSelectorOpen: boolean;
  setRoleSelectorOpen: (open: boolean) => void;
  quickActionOpen: boolean;
  setQuickActionOpen: (open: boolean) => void;
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
  const [user, setUser] = useState<BackendUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<NonNullable<Role> | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [roleSelectorOpen, setRoleSelectorOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const firebaseSignedIn = useRef(false);

  const hydrate = (backendUser: BackendUser | null) => {
    setUser(backendUser);
    if (backendUser) {
      const userRoles = mapBackendRoles(backendUser.roles);
      if (userRoles.length > 0 && (!selectedRole || !userRoles.includes(selectedRole))) {
        setSelectedRole(userRoles[0]);
      }
    }
  };

  const refresh = async (): Promise<AuthDestination> => {
    if (!firebaseSignedIn.current) {
      setDestination('unauthenticated');
      hydrate(null);
      return 'unauthenticated';
    }
    const backendUser = await fetchBackendUser();
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
      } else {
        setDestination('unauthenticated');
        hydrate(null);
        qc.clear();
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
  const activeRole: NonNullable<Role> = selectedRole || (roles.length > 0 ? roles[0] : 'funder');

  return (
    <AppContext.Provider
      value={{
        destination,
        authChecked,
        user,
        roles,
        activeRole,
        setActiveRole: setSelectedRole,
        name: user?.fullName || '',
        avatarUrl: user?.avatarUrl ?? null,
        isAdmin: isAdminUser(user),
        notificationsOpen,
        setNotificationsOpen,
        roleSelectorOpen,
        setRoleSelectorOpen,
        quickActionOpen,
        setQuickActionOpen,
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
