import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, newIdempotencyKey } from './client';

export interface FundProjectInput {
  projectId: string;
  amount: number;
  paymentProvider: 'mtn_momo' | 'orange_money' | 'stripe' | 'flutterwave';
  payerPhoneNumber?: string;
  currency?: string;
}

export interface FundProjectResult {
  _id: string;
  status: EscrowEntry['status'];
  paymentUrl?: string;
  /** Only present for paymentProvider: 'stripe' — the real PaymentIntent's
   * client secret, needed to confirm the card client-side (see
   * stripeProvider.js's collect()). */
  clientSecret?: string;
}

export function useFundProjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, amount, paymentProvider, payerPhoneNumber, currency }: FundProjectInput): Promise<FundProjectResult> => {
      const { data } = await api.post(
        `/projects/${projectId}/fund`,
        { amount, paymentProvider, payerPhoneNumber, currency },
        { headers: { 'Idempotency-Key': newIdempotencyKey() } }
      );
      return data.data;
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export interface MilestoneApprovalInput {
  projectId: string;
  milestoneId: string;
  status: 'approved' | 'rejected';
}

export interface MilestoneApprovalResult {
  project: unknown;
  /** Non-null only once every required approver (owner + co-signer, on a
   * multi-sig milestone) has signed off — see
   * projectController.applyApprovalDecision/decideApproval. `null` here
   * means this decision was recorded but funds have NOT actually released
   * yet; the caller must check this before showing any "released" state. */
  releasedEscrow: unknown | null;
}

export function useMilestoneApprovalMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, milestoneId, status }: MilestoneApprovalInput): Promise<MilestoneApprovalResult> => {
      const { data } = await api.post(
        `/projects/${projectId}/milestones/${milestoneId}/approval`,
        { status },
        { headers: { 'Idempotency-Key': newIdempotencyKey() } }
      );
      return data.data;
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export interface MilestoneChangesInput {
  projectId: string;
  milestoneId: string;
  reason: string;
}

/** Distinct real endpoint from approval (`/request-changes`, not `/approval`)
 * — not idempotency-guarded since it never moves money. */
export function useRequestMilestoneChangesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, milestoneId, reason }: MilestoneChangesInput) => {
      const { data } = await api.post(`/projects/${projectId}/milestones/${milestoneId}/request-changes`, {
        reason,
      });
      return data;
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export interface MilestoneDisputeInput {
  projectId: string;
  milestoneId: string;
  reason: string;
  evidenceNotes?: string;
}

export function useMilestoneDisputeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, milestoneId, reason, evidenceNotes }: MilestoneDisputeInput) => {
      const { data } = await api.post(`/projects/${projectId}/milestones/${milestoneId}/dispute`, {
        reason,
        evidenceNotes,
      });
      return data;
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export interface EscrowEntry {
  id: string;
  projectId: string;
  projectTitle: string;
  type: 'fund' | 'release' | 'refund' | 'fee_deduction';
  grossAmount: number;
  netAmount: number;
  currency: string;
  paymentProvider: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  createdAt: string;
}

interface BackendEscrow {
  _id: string;
  projectId: { _id: string; title: string } | string;
  type: EscrowEntry['type'];
  grossAmount: number;
  netAmount: number;
  currency: string;
  paymentProvider: string;
  status: EscrowEntry['status'];
  createdAt: string;
}

function mapEscrow(e: BackendEscrow): EscrowEntry {
  return {
    id: e._id,
    projectId: typeof e.projectId === 'object' ? e.projectId._id : e.projectId,
    projectTitle: typeof e.projectId === 'object' ? e.projectId.title : '',
    type: e.type,
    grossAmount: e.grossAmount,
    netAmount: e.netAmount,
    currency: e.currency,
    paymentProvider: e.paymentProvider,
    status: e.status,
    createdAt: e.createdAt,
  };
}

/** GET /escrows — server already scopes non-admins to their own
 * transactions, so the filter is all that's needed here. */
export function useEscrowQuery(filter: { projectId?: string; type?: string; status?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: ['escrow', filter],
    queryFn: async (): Promise<{ entries: EscrowEntry[]; total: number }> => {
      const { data } = await api.get<{ data: BackendEscrow[]; meta: { total: number } }>('/escrows', {
        params: { ...filter, limit: filter.limit ?? 100 },
      });
      return { entries: data.data.map(mapEscrow), total: data.meta.total };
    },
    staleTime: 10_000,
  });
}

/** Re-checks a still-pending escrow's real status directly with its payment
 * provider (POST /escrows/:id/refresh-status) — the fallback for when a
 * webhook never arrives, so a payment doesn't stay stuck on "pending"
 * forever with no path to notice the real charge went through. */
export function useRefreshEscrowStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (escrowId: string) => {
      const { data } = await api.post<{ data: BackendEscrow }>(`/escrows/${escrowId}/refresh-status`);
      return mapEscrow(data.data);
    },
    onSuccess: (escrow) => {
      qc.invalidateQueries({ queryKey: ['escrow'] });
      qc.invalidateQueries({ queryKey: ['project', escrow.projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
