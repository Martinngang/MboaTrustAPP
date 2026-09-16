import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// Ported 1:1 from MboaTrustFrontend/src/api/teamMembers.ts — same field
// shapes, same query keys, same role/status enums.
export type TeamRole = 'owner' | 'approver' | 'viewer';
// The one permission actually enforced anywhere (see
// projectController.assertProjectParty's delegate check) — additive to and
// independent of `role`, which stays decorative.
export type TeamPermission = 'submit_milestones';

export interface TeamMemberRecord {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: 'invited' | 'active';
  permissions: TeamPermission[];
  initials: string;
}

interface BackendTeamMember {
  _id: string;
  ownerId: string;
  userId: { _id: string; fullName: string; avatarUrl?: string } | string | null;
  invitedEmail: string;
  invitedName: string;
  role: TeamRole;
  status: 'invited' | 'active';
  permissions?: TeamPermission[];
  createdAt: string;
}

function mapTeamMember(doc: BackendTeamMember): TeamMemberRecord {
  const name = (typeof doc.userId === 'object' && doc.userId?.fullName) || doc.invitedName || doc.invitedEmail;
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return { id: doc._id, name, email: doc.invitedEmail, role: doc.role, status: doc.status, permissions: doc.permissions || [], initials };
}

export function useTeamMembersQuery(enabled = true) {
  return useQuery({
    queryKey: ['teamMembers'],
    queryFn: async (): Promise<TeamMemberRecord[]> => {
      const { data } = await api.get<{ data: BackendTeamMember[] }>('/team-members/mine');
      return data.data.map(mapTeamMember);
    },
    enabled,
    staleTime: 10_000,
  });
}

export function useInviteTeamMemberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, name, role, permissions }: { email: string; name?: string; role: 'approver' | 'viewer'; permissions?: TeamPermission[] }) => {
      const { data } = await api.post<{ data: BackendTeamMember }>('/team-members', { email, name, role, permissions });
      return mapTeamMember(data.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teamMembers'] });
      qc.invalidateQueries({ queryKey: ['teamActivity'] });
    },
  });
}

/** `role` and `permissions` are each optional — the backend only touches
 * whichever one is actually sent (see teamMemberValidators.updateRole). */
export function useUpdateTeamMemberRoleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role, permissions }: { id: string; role?: 'approver' | 'viewer'; permissions?: TeamPermission[] }) => {
      const { data } = await api.patch<{ data: BackendTeamMember }>(`/team-members/${id}/role`, { role, permissions });
      return mapTeamMember(data.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teamMembers'] });
      qc.invalidateQueries({ queryKey: ['teamActivity'] });
    },
  });
}

export function useRemoveTeamMemberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/team-members/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teamMembers'] });
      qc.invalidateQueries({ queryKey: ['teamActivity'] });
    },
  });
}

/** Best-effort — called once after login, same convention as web's
 * `team.tsx`. Links any roster rows that were invited by email before this
 * account existed; failures are swallowed, never surfaced. */
export async function claimTeamMemberships(): Promise<void> {
  await api.post('/team-members/claim').catch(() => {});
}

// ── Activity / audit history ────────────────────────────────────────────
export interface TeamActivityRow {
  id: string;
  actorName: string;
  action: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

interface BackendTeamActivity {
  _id: string;
  actorId: { _id: string; fullName: string } | string;
  action: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

/** A contractor's own durable history of who invited/changed/removed a team
 * member, and which delegate submitted evidence on their behalf — see
 * teamMemberController.getActivity / services/teamActivityLogService.js. */
export function useTeamActivityQuery(enabled = true) {
  return useQuery({
    queryKey: ['teamActivity'],
    queryFn: async (): Promise<TeamActivityRow[]> => {
      const { data } = await api.get<{ data: BackendTeamActivity[] }>('/team-members/activity');
      return data.data.map((row) => ({
        id: row._id,
        actorName: typeof row.actorId === 'object' ? row.actorId.fullName : 'Someone',
        action: row.action,
        detail: row.detail || {},
        createdAt: row.createdAt,
      }));
    },
    enabled,
    staleTime: 10_000,
  });
}
