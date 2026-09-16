import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api, newIdempotencyKey } from './client';
import { getNextPageParam, type PageMeta } from './pagination';

// Ported from web's real MboaTrustFrontend/src/api/tenders.ts. The previous
// version of this file used the wrong response shape entirely (`amount`
// instead of `price`, `estimatedDurationDays` instead of `timelineDays`),
// called a nonexistent `POST /bids/:id/accept` (the real endpoint is
// `PATCH /bids/:id/status`, guarded by the same Idempotency-Key requirement
// as fund/approval), and never sent `orderIndex` on a tender's milestones —
// every real tender creation was rejected by the backend's own validator.
export interface JobPosting {
  id: string;
  title: string;
  category: string;
  location: string;
  coordinates: { lat: number; lng: number } | null;
  budget: number;
  deadline: string;
  bids: number;
  milestones: number;
  posted: string;
  description: string;
  status: string;
  ownerId: string;
  materialsManagedBy: 'contractor' | 'supplier';
  preferredSupplierId: string | null;
}

interface BackendMilestone { _id: string; name: string; amount: number; status: string }
interface BackendProject {
  _id: string;
  title: string;
  description: string;
  category: string;
  locationName: string;
  location?: { lat: number | null; lng: number | null };
  totalAmount: number;
  status: string;
  deadline: string | null;
  createdAt: string;
  milestones: BackendMilestone[];
  ownerId: { _id: string; fullName: string } | string;
  materialsManagedBy?: 'contractor' | 'supplier';
  preferredSupplierId?: string | null;
}
interface BackendMilestoneProposal { title: string; description: string; amount: number }
interface BackendNegotiationRound {
  proposedBy: 'funder' | 'contractor';
  price: number;
  timelineDays: number;
  milestones: BackendMilestoneProposal[];
  message: string;
  createdAt: string;
}
interface BackendBid {
  _id: string;
  projectId: string;
  contractorId: { _id: string; fullName: string } | string;
  price: number;
  timelineDays: number;
  materialsPlan: string;
  notes: string;
  status: string;
  createdAt: string;
  milestones?: BackendMilestoneProposal[];
  rounds?: BackendNegotiationRound[];
  lastProposedBy?: 'funder' | 'contractor';
}

export interface MilestoneProposal {
  title: string;
  description: string;
  amount: number;
}

export interface NegotiationRound {
  proposedBy: 'funder' | 'contractor';
  price: number;
  timelineDays: number;
  milestones: MilestoneProposal[];
  message: string;
  createdAt: string;
}

export interface Bid {
  id: string;
  jobId: string;
  jobTitle: string;
  contractorName: string;
  contractorId: string;
  price: number;
  timelineDays: number;
  materials: string;
  notes: string;
  status: string;
  submitted: string;
  milestones: MilestoneProposal[];
  rounds: NegotiationRound[];
  lastProposedBy: 'funder' | 'contractor';
}

function mapTenderStatus(status: string): string {
  if (status === 'in_progress' || status === 'funded') return 'awarded';
  if (status === 'completed' || status === 'cancelled') return 'closed';
  return status;
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'TBD';
  return new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatPosted(createdAt: string): string {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
  if (days <= 0) return 'Just now';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

/** A wrong count for one tender is far less harmful than losing the whole
 * list — this runs inside a Promise.all in useJobsQuery, so one transient
 * failure must not reject the entire batch. */
async function fetchBidCount(projectId: string): Promise<number> {
  try {
    const { data } = await api.get<{ meta: { total: number } }>('/bids', { params: { projectId, limit: 1 } });
    return data.meta.total;
  } catch {
    return 0;
  }
}

function mapJob(doc: BackendProject, bidCount: number): JobPosting {
  const ownerId = typeof doc.ownerId === 'object' ? doc.ownerId._id : doc.ownerId;
  return {
    id: doc._id,
    title: doc.title,
    category: doc.category || 'General',
    location: doc.locationName || '',
    coordinates: doc.location?.lat != null && doc.location?.lng != null ? { lat: doc.location.lat, lng: doc.location.lng } : null,
    budget: doc.totalAmount,
    deadline: formatDeadline(doc.deadline),
    bids: bidCount,
    milestones: doc.milestones?.length || 1,
    posted: formatPosted(doc.createdAt),
    description: doc.description || '',
    status: mapTenderStatus(doc.status),
    ownerId,
    materialsManagedBy: doc.materialsManagedBy ?? 'contractor',
    preferredSupplierId: doc.preferredSupplierId ?? null,
  };
}

export function useJobsQuery() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async (): Promise<JobPosting[]> => {
      const { data } = await api.get<{ data: BackendProject[] }>('/projects', { params: { projectType: 'tender' } });
      const counts = await Promise.all(data.data.map((p) => fetchBidCount(p._id)));
      return data.data.map((p, i) => mapJob(p, counts[i]));
    },
    staleTime: 10_000,
  });
}

/** Paginated feed for the browse-jobs screen — defaults to open-only, since
 * a contractor looking for work to bid on should never see an
 * already-awarded or closed tender mixed into results. */
export function useJobsInfiniteQuery(limit = 10, status: string | undefined = 'open') {
  return useInfiniteQuery({
    queryKey: ['jobs', 'infinite', status],
    queryFn: async ({ pageParam }: { pageParam: number }): Promise<{ items: JobPosting[]; meta: PageMeta }> => {
      const { data } = await api.get<{ data: BackendProject[]; meta: PageMeta }>('/projects', {
        params: { projectType: 'tender', status, page: pageParam, limit },
      });
      const counts = await Promise.all(data.data.map((p) => fetchBidCount(p._id)));
      return { items: data.data.map((p, i) => mapJob(p, counts[i])), meta: data.meta };
    },
    initialPageParam: 1,
    getNextPageParam,
    staleTime: 10_000,
  });
}

/** A funder's own posted tenders — scoped by ownerId. */
export function useMyTendersQuery(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['jobs', 'mine', ownerId],
    queryFn: async (): Promise<JobPosting[]> => {
      const { data } = await api.get<{ data: BackendProject[] }>('/projects', { params: { projectType: 'tender', ownerId } });
      const counts = await Promise.all(data.data.map((p) => fetchBidCount(p._id)));
      return data.data.map((p, i) => mapJob(p, counts[i]));
    },
    enabled: Boolean(ownerId),
    staleTime: 10_000,
  });
}

export interface CreateJobInput {
  title: string;
  category: string;
  location: string;
  coordinates?: { lat: number; lng: number } | null;
  budget: number;
  deadline?: string;
  milestoneCount: number;
  description: string;
  milestoneSchedule?: { title: string; amount: number; description: string }[];
}

export function useCreateJobMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (j: CreateJobInput): Promise<JobPosting> => {
      let milestones;
      if (j.milestoneSchedule?.length) {
        milestones = j.milestoneSchedule.map((m, i) => ({ name: m.title, amount: m.amount, description: m.description, orderIndex: i }));
      } else {
        const count = Math.max(1, j.milestoneCount);
        const perMilestone = Math.round(j.budget / count);
        milestones = Array.from({ length: count }, (_, i) => ({
          name: `Milestone ${i + 1}`,
          amount: i === count - 1 ? j.budget - perMilestone * (count - 1) : perMilestone,
          orderIndex: i,
        }));
      }
      const { data } = await api.post<{ data: BackendProject }>('/projects', {
        projectType: 'tender',
        title: j.title,
        description: j.description,
        category: j.category,
        locationName: j.location,
        ...(j.coordinates ? { location: j.coordinates } : {}),
        totalAmount: j.budget,
        ...(j.deadline ? { deadline: j.deadline } : {}),
        milestones,
      });
      return mapJob(data.data, 0);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

export function useCancelJobMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ data: BackendProject }>(`/projects/${id}/cancel`, {});
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['bids'] });
    },
  });
}

// ── Bids ─────────────────────────────────────────────────────────────────

function mapRound(r: BackendNegotiationRound): NegotiationRound {
  return { proposedBy: r.proposedBy, price: r.price, timelineDays: r.timelineDays, milestones: r.milestones ?? [], message: r.message ?? '', createdAt: r.createdAt };
}

function mapBid(doc: BackendBid, jobTitle: string): Bid {
  return {
    id: doc._id,
    jobId: doc.projectId,
    jobTitle,
    contractorName: typeof doc.contractorId === 'object' ? doc.contractorId.fullName : 'Contractor',
    contractorId: typeof doc.contractorId === 'object' ? doc.contractorId._id : doc.contractorId,
    price: doc.price,
    timelineDays: doc.timelineDays,
    materials: doc.materialsPlan,
    notes: doc.notes,
    status: doc.status === 'submitted' ? 'pending' : doc.status,
    submitted: new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    milestones: (doc.milestones ?? []).map((m) => ({ title: m.title, description: m.description ?? '', amount: m.amount })),
    rounds: (doc.rounds ?? []).map(mapRound),
    lastProposedBy: doc.lastProposedBy ?? 'contractor',
  };
}

/** Bids the current user placed (as contractor) or received (as tender owner, via projectId). */
export function useBidsQuery(filter: { projectId?: string; contractorId?: string } = {}) {
  return useQuery({
    queryKey: ['bids', filter],
    queryFn: async (): Promise<Bid[]> => {
      const { data } = await api.get<{ data: BackendBid[] }>('/bids', { params: filter });
      const jobIds = [...new Set(data.data.map((b) => b.projectId))];
      const jobTitles = new Map<string, string>();
      await Promise.all(
        jobIds.map(async (id) => {
          try {
            const { data: proj } = await api.get<{ data: BackendProject }>(`/projects/${id}`);
            jobTitles.set(id, proj.data.title);
          } catch {
            jobTitles.set(id, '');
          }
        })
      );
      return data.data.map((b) => mapBid(b, jobTitles.get(b.projectId) ?? ''));
    },
    staleTime: 10_000,
  });
}

/** A single bid by id — both parties may poll this during an open
 * negotiation. Party access is enforced server-side (bidController.getOne). */
export function useBidQuery(bidId: string | undefined) {
  return useQuery({
    queryKey: ['bids', 'one', bidId],
    queryFn: async (): Promise<Bid> => {
      const { data } = await api.get<{ data: BackendBid }>(`/bids/${bidId}`);
      let jobTitle = '';
      try {
        const { data: proj } = await api.get<{ data: BackendProject }>(`/projects/${data.data.projectId}`);
        jobTitle = proj.data.title;
      } catch {
        /* a missing project shouldn't fail the whole bid view */
      }
      return mapBid(data.data, jobTitle);
    },
    enabled: Boolean(bidId),
    staleTime: 5_000,
    refetchInterval: 8_000,
  });
}

export interface CreateBidInput {
  jobId: string;
  price: number;
  timelineDays: number;
  materials: string;
  notes: string;
  milestones?: MilestoneProposal[];
}

export function useCreateBidMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (b: CreateBidInput): Promise<Bid> => {
      const { data } = await api.post<{ data: BackendBid }>('/bids', {
        projectId: b.jobId,
        price: b.price,
        timelineDays: b.timelineDays,
        materialsPlan: b.materials,
        notes: b.notes,
        milestones: b.milestones ?? [],
      });
      return mapBid(data.data, '');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bids'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

/** Either real party to the negotiation (tender owner or bidder) appends a
 * new round — unlimited rounds, not strictly alternating. */
export function useCounterBidMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bidId, price, timelineDays, milestones, message }: {
      bidId: string; price: number; timelineDays: number; milestones?: MilestoneProposal[]; message?: string;
    }): Promise<Bid> => {
      const { data } = await api.post<{ data: BackendBid }>(`/bids/${bidId}/counter`, {
        price, timelineDays, milestones: milestones ?? [], message: message ?? '',
      });
      return mapBid(data.data, '');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bids'] }),
  });
}

export function useUpdateBidStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bidId, status }: { bidId: string; status: 'accepted' | 'rejected' | 'withdrawn' }) => {
      const { data } = await api.patch(
        `/bids/${bidId}/status`,
        { status },
        { headers: { 'Idempotency-Key': newIdempotencyKey() } }
      );
      return data.data as { bid: BackendBid; contract: { _id: string; generatedDocumentText: string } | null };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bids'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
