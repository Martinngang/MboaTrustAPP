import { useMutation, useQuery } from '@tanstack/react-query';
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
//
// The real backend enum (User.js's RoleEntrySchema) is exactly
// ['funder', 'contractor', 'land_seller', 'verifier', 'admin', 'supplier']
// — 'seller' and 'quincaillerie' alone are never sent by the backend at
// all (mobile's own internal Role union just happens to spell the supplier
// role 'quincaillerie', unlike web's 'supplier'). Mapping those two
// non-existent strings while never mapping the real 'supplier' meant every
// real supplier-role account had its role silently dropped here entirely.
const BACKEND_TO_FRONTEND_ROLE: Record<string, NonNullable<Role> | undefined> = {
  funder: 'funder',
  contractor: 'contractor',
  land_seller: 'seller',
  supplier: 'quincaillerie',
  verifier: 'verifier',
};

export function mapBackendRoles(roles: { roleType: string }[]): NonNullable<Role>[] {
  const mapped = roles.map((r) => BACKEND_TO_FRONTEND_ROLE[r.roleType]).filter((r): r is NonNullable<Role> => Boolean(r));
  return Array.from(new Set(mapped));
}

/** Thrown when /users/me couldn't be reached (offline, DNS, timeout) or the
 * server itself errored — deliberately distinct from "the server answered,
 * and this account doesn't exist there". The old `catch { return null }`
 * collapsed both into null, and since resolveAuthDestination reads null as
 * "brand new account", an unreachable backend sent a fully-onboarded user
 * back to role selection to redo onboarding. */
export class SessionUnavailableError extends Error {
  constructor(message = 'Could not reach Mboa Trust') {
    super(message);
    this.name = 'SessionUnavailableError';
  }
}

/** Returns null ONLY when the backend positively answered that there's no
 * account for this identity. Anything else throws SessionUnavailableError,
 * so callers can tell "no account yet" apart from "we don't know". */
export async function fetchBackendUser(): Promise<BackendUser | null> {
  try {
    const { data } = await api.get<{ success: true; data: BackendUser }>('/users/me');
    return data.data;
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 401 || status === 403 || status === 404) return null;
    throw new SessionUnavailableError();
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
  const mappedRoles = mapBackendRoles(user.roles);
  // The web-only gate is for accounts that would otherwise land on a
  // Home dashboard with nothing real to show (admin isn't a mappable
  // mobile Role — see BACKEND_TO_FRONTEND_ROLE above). Real accounts in
  // the database already hold admin alongside a genuine functional role
  // (a contractor or verifier who is also staff, say) — gating on admin
  // alone locked every one of those accounts out of the entire mobile
  // app, not just the admin panel, since it pre-empted the funder/
  // contractor/etc. routing below unconditionally.
  if (isAdminUser(user) && mappedRoles.length === 0) return 'admin';
  if (user.onboardingCompleted) return 'home';
  return mappedRoles.length > 0 ? 'profile' : 'role';
}

/** PATCH /users/me — persists the account's language preference server-side
 * (User.preferredLanguage, see userValidators.js). Mobile has no in-app
 * translation strings yet (every screen is hardcoded English JSX, unlike
 * web's real i18n-driven `lang`), so this doesn't retranslate the UI — but
 * it's a real, saved account setting rather than component state that
 * resets on reload and touches nothing server-side. */
export function useUpdatePreferredLanguageMutation() {
  return useMutation({
    mutationFn: async (preferredLanguage: 'en' | 'fr') => {
      const { data } = await api.patch<{ data: BackendUser }>('/users/me', { preferredLanguage });
      return data.data;
    },
  });
}

/** POST /users/me/sessions/revoke — invalidates every other refresh token
 * issued to this account. The backend keeps no per-device session log to
 * enumerate (see userController.revokeSessions), so — matching web's own
 * TrustedDevicesCard comment — this is the one real action available, not a
 * fabricated device list. */
export function useRevokeOtherSessionsMutation() {
  return useMutation({
    mutationFn: async (): Promise<{ revoked: boolean }> => {
      const { data } = await api.post<{ data: { revoked: boolean } }>('/users/me/sessions/revoke', {});
      return data.data;
    },
  });
}

/** GET /users/me/export — a real, immediate export of everything this
 * account owns (see userController.exportMyData), not a fire-and-forget
 * "we'll email you" promise. */
export function useExportMyDataMutation() {
  return useMutation({
    mutationFn: async (): Promise<unknown> => {
      const { data } = await api.get<{ data: unknown }>('/users/me/export');
      return data.data;
    },
  });
}

/** Ported from MboaTrustFrontend/src/api/session.ts's useUploadAvatarMutation
 * — POST /users/me/avatar (backend streams it to Cloudinary and saves the
 * resulting URL as User.avatarUrl). Callers should follow success with
 * `useApp().refresh()` so the new avatarUrl flows back into AppContext,
 * mirroring how every other profile-mutating screen already refreshes
 * rather than mobile carrying its own local `setAvatarUrl` setter. */
export function useUploadAvatarMutation() {
  return useMutation({
    mutationFn: async (file: { uri: string; fileName?: string | null; mimeType?: string | null }): Promise<string | null> => {
      const form = new FormData();
      form.append('file', {
        uri: file.uri,
        name: file.fileName ?? 'avatar.jpg',
        type: file.mimeType ?? 'image/jpeg',
      } as unknown as Blob);
      const { data } = await api.post<{ data: BackendUser }>('/users/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data.avatarUrl;
    },
  });
}
