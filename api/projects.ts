import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface MilestoneEvidence {
  id: string;
  type: string;
  fileUrl: string;
  notes: string;
  capturedAt: string | null;
  createdAt: string;
  geotag: { lat: number; lng: number } | null;
  placeName: string | null;
  locationMatch: boolean | null;
  duplicateFlag: boolean;
  submittedByName: string | null;
}

export interface MilestoneApprover {
  userId: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface MilestoneChangeRequest {
  reason: string;
  requestedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  evidence: MilestoneEvidence[];
  requiresVideo: boolean;
  requiresMultiApproval: boolean;
  approvers: MilestoneApprover[];
  changeRequests: MilestoneChangeRequest[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  locationName: string;
  imageUrl: string;
  totalAmount: number;
  raised: number;
  released: number;
  escrowBalance: number;
  status: string;
  ownerId: string;
  ownerName: string;
  milestones: Milestone[];
  requiresMultiSig: boolean;
  coSignerId?: string;
  coSignerName?: string;
  materialsManagedBy: 'contractor' | 'supplier';
  preferredSupplierId: string | null;
}

interface FundingSummary {
  raised: number;
  released: number;
  escrowBalance: number;
}

export interface BackendMilestone {
  _id: string;
  name: string;
  description?: string;
  amount: number;
  status: string;
  evidence?: {
    _id: string;
    type: string;
    fileUrl: string;
    notes: string;
    capturedAt: string | null;
    createdAt: string;
    geotag?: { lat: number | null; lng: number | null } | null;
    placeName?: string | null;
    locationMatch?: boolean | null;
    duplicateFlag?: boolean;
    submittedBy?: { _id: string; fullName: string } | string;
  }[];
  requiresCosigner?: boolean;
  requiresVideo?: boolean;
  approvers?: {
    userId: { _id: string; fullName: string } | string;
    status: 'pending' | 'approved' | 'rejected';
  }[];
  changeRequests?: {
    reason: string;
    requestedAt: string;
  }[];
}

export interface BackendProject {
  _id: string;
  title: string;
  description: string;
  projectType: string;
  category: string;
  locationName: string;
  imageUrl?: string;
  totalAmount: number;
  status: string;
  ownerId?: { _id: string; fullName: string } | string;
  milestones?: BackendMilestone[];
  requiresMultiSig?: boolean;
  coSignerId?: { _id: string; fullName: string } | string | null;
  materialsManagedBy?: 'contractor' | 'supplier';
  preferredSupplierId?: string | null;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=350&fit=crop&auto=format';

/** `funding` is `undefined` for callers that deliberately skip the real
 * GET /projects/:id/funding-summary lookup (e.g. a management list that
 * only needs totalAmount/status) — those get an honest 0, never a fake
 * "fully funded" or "untouched" guess. Previously this field simply didn't
 * exist on the base project response at all, and the fallback here derived
 * a fake raised/escrowBalance from the project's status flag alone — every
 * project showed as either 0% or 100% funded, never the real partial
 * amount from actual pooled/direct contributions. */
export function mapProject(p: BackendProject, funding?: FundingSummary): Project {
  const milestones: Milestone[] = (p.milestones || []).map((m) => ({
    id: m._id,
    title: m.name || 'Milestone',
    description: m.description || '',
    amount: m.amount || 0,
    status: m.status || 'pending',
    requiresVideo: Boolean(m.requiresVideo),
    requiresMultiApproval: Boolean(m.requiresCosigner),
    evidence: (m.evidence || []).map((e) => ({
      id: e._id,
      type: e.type || 'photo',
      fileUrl: e.fileUrl,
      notes: e.notes || '',
      capturedAt: e.capturedAt,
      createdAt: e.createdAt || new Date().toISOString(),
      geotag: e.geotag && e.geotag.lat != null && e.geotag.lng != null ? { lat: e.geotag.lat, lng: e.geotag.lng } : null,
      placeName: e.placeName ?? null,
      locationMatch: e.locationMatch ?? null,
      duplicateFlag: Boolean(e.duplicateFlag),
      submittedByName: typeof e.submittedBy === 'object' ? e.submittedBy.fullName : null,
    })),
    approvers: (m.approvers || []).map((a) => ({
      userId: typeof a.userId === 'object' ? a.userId._id : String(a.userId),
      userName: typeof a.userId === 'object' ? a.userId.fullName : 'Approver',
      status: a.status,
    })),
    changeRequests: (m.changeRequests || []).map((c) => ({
      reason: c.reason,
      requestedAt: c.requestedAt,
    })),
  }));

  const ownerId = typeof p.ownerId === 'object' ? p.ownerId._id : String(p.ownerId || '');
  const ownerName = typeof p.ownerId === 'object' ? p.ownerId.fullName : 'Project Creator';

  return {
    id: p._id,
    title: p.title || 'Untitled Project',
    description: p.description || '',
    category: p.category || 'Construction',
    location: p.locationName || 'Cameroon',
    locationName: p.locationName || 'Cameroon',
    imageUrl: p.imageUrl || DEFAULT_IMAGE,
    totalAmount: p.totalAmount || 0,
    raised: funding?.raised ?? 0,
    released: funding?.released ?? 0,
    escrowBalance: funding?.escrowBalance ?? 0,
    status: p.status === 'funded' || p.status === 'in_progress' ? 'active' : p.status,
    ownerId,
    ownerName,
    milestones,
    requiresMultiSig: Boolean(p.requiresMultiSig),
    coSignerId: p.coSignerId ? (typeof p.coSignerId === 'object' ? p.coSignerId._id : p.coSignerId) : undefined,
    coSignerName: p.coSignerId && typeof p.coSignerId === 'object' ? p.coSignerId.fullName : undefined,
    materialsManagedBy: p.materialsManagedBy ?? 'contractor',
    preferredSupplierId: p.preferredSupplierId ?? null,
  };
}

async function fetchFundingSummary(id: string): Promise<FundingSummary> {
  const { data } = await api.get<{ data: FundingSummary }>(`/projects/${id}/funding-summary`);
  return data.data;
}

export function useProjectsQuery(params?: { projectType?: string; category?: string; ownerId?: string }) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async (): Promise<Project[]> => {
      const { data } = await api.get<{ data: BackendProject[] }>('/projects', {
        params: { projectType: 'funding', ...params },
      });
      const fundings = await Promise.all(data.data.map((p) => fetchFundingSummary(p._id)));
      return data.data.map((p, i) => mapProject(p, fundings[i]));
    },
    staleTime: 15_000,
  });
}

/** A project's real owner — the recipient side, not a funder. */
export function useMyProjectsQuery(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['projects', 'mine', ownerId],
    queryFn: async (): Promise<Project[]> => {
      const { data } = await api.get<{ data: BackendProject[] }>('/projects', {
        params: { projectType: 'funding', ownerId },
      });
      const fundings = await Promise.all(data.data.map((p) => fetchFundingSummary(p._id)));
      return data.data.map((p, i) => mapProject(p, fundings[i]));
    },
    enabled: !!ownerId,
    staleTime: 15_000,
  });
}

/** A funder never owns the project they fund — their relationship is
 * having actually paid into its escrow, resolved server-side via the
 * `funderId` filter (matches who funded, not who owns). Without this, a
 * funder's own dashboard has no correct way to ask "which projects have I
 * funded" and would need to fall back to the full public catalog. */
export function useMyFundedProjectsQuery(funderId: string | undefined) {
  return useQuery({
    queryKey: ['projects', 'funded-by-me', funderId],
    queryFn: async (): Promise<Project[]> => {
      const { data } = await api.get<{ data: BackendProject[] }>('/projects', {
        params: { projectType: 'funding', funderId },
      });
      const fundings = await Promise.all(data.data.map((p) => fetchFundingSummary(p._id)));
      return data.data.map((p, i) => mapProject(p, fundings[i]));
    },
    enabled: !!funderId,
    staleTime: 15_000,
  });
}

export function useProjectQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async (): Promise<Project | null> => {
      if (!id) return null;
      const [{ data }, funding] = await Promise.all([
        api.get<{ data: BackendProject }>(`/projects/${id}`),
        fetchFundingSummary(id),
      ]);
      return mapProject(data.data, funding);
    },
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useAddCoSignerMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, coSignerId }: { projectId: string; coSignerId: string }) => {
      const { data } = await api.post<{ data: BackendProject }>(`/projects/${projectId}/co-signer`, { coSignerId });
      return mapProject(data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

/** Assigns (or, with supplierId: null, clears) the project's preferred
 * materials supplier — ported from MboaTrustFrontend/src/api/projects.ts's
 * useAssignSupplierMutation, same endpoint (projectController.assignSupplier),
 * legal at any project status. */
export function useAssignSupplierMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, supplierId }: { projectId: string; supplierId: string | null }) => {
      const { data } = await api.post<{ data: BackendProject }>(`/projects/${projectId}/assign-supplier`, { supplierId });
      return mapProject(data.data);
    },
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

