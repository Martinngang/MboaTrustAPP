import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { Role } from '../context/AppContext';

// Ported 1:1 from MboaTrustFrontend/src/api/session.ts — same shape, same
// resolution rules, so onboarding/routing decisions match web exactly.
export interface BackendUser {
  _id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  preferredLanguage?: 'en' | 'fr';
  roles: { roleType: string; profileRef: string | null }[];
  authProviders: { provider: 'google' | 'email' | 'phone'; providerId: string }[];
  kycStatus: string;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  adminPermissions?: string[] | null;
  payoutMethods?: { _id: string; label: string; provider: 'mtn_momo' | 'orange_money'; phoneNumber: string; isDefault: boolean }[];
  residenceCountry?: string;
}

// Recipient is deliberately excluded — the actor is being retired from the
// product even though the backend model/roleType still technically exists
// for legacy data (see docs/WEB_APP_MAP.md). A legacy account that somehow
// still carries it just has that roleType silently drop out of `roles`
// here, same as any other roleType this mobile build doesn't build a
// dashboard for.
const BACKEND_TO_FRONTEND_ROLE: Record<string, NonNullable<Role> | undefined> = {
  funder: 'funder',
  contractor: 'contractor',
  land_seller: 'seller',
  seller: 'seller',
  quincaillerie: 'quincaillerie',
  verifier: 'verifier',
};

export function mapBackendRoles(roles: { roleType: string }[]): NonNullable<Role>[] {
  const mapped = roles.map((r) => BACKEND_TO_FRONTEND_ROLE[r.roleType]).filter((r): r is NonNullable<Role> => Boolean(r));
  return Array.from(new Set(mapped));
}

export async function fetchBackendUser(): Promise<BackendUser | null> {
  try {
    const { data } = await api.get<{ success: true; data: BackendUser }>('/users/me');
    return data.data;
  } catch {
    return null;
  }
}

export function useSessionQuery() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchBackendUser,
    staleTime: 30_000,
  });
}

export function isAdminUser(user: BackendUser | null): boolean {
  return !!user && user.roles.some((r) => r.roleType === 'admin');
}

export function resolveAuthDestination(user: BackendUser | null): 'home' | 'role' | 'profile' | 'admin' {
  if (!user) return 'role';
  if (isAdminUser(user)) return 'admin';
  if (user.onboardingCompleted) return 'home';
  return mapBackendRoles(user.roles).length > 0 ? 'profile' : 'role';
}
