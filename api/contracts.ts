import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// Tender/bid browsing and submission moved to api/tenders.ts, ported to
// exactly match the real backend contract (this file's previous versions of
// those hooks used wrong field names — `amount`/`estimatedDurationDays`
// instead of the real `price`/`timelineDays` — so every real bid submission
// was rejected by the backend's own validator). What remains here is the
// separate Contract/evidence/payout domain.

export interface Contract {
  id: string;
  projectId: string;
  projectTitle: string;
  totalAmount: number;
  bidId: string;
  generatedDocumentText: string;
  generatedDocumentUrl: string;
  status: 'active' | 'completed' | 'terminated';
  createdAt: string;
}

interface BackendContract {
  _id: string;
  projectId: { _id: string; title: string; totalAmount: number } | string;
  bidId: string;
  generatedDocumentText: string;
  generatedDocumentUrl: string;
  status: 'active' | 'completed' | 'terminated';
  createdAt: string;
}

function mapContract(doc: BackendContract): Contract {
  return {
    id: doc._id,
    projectId: typeof doc.projectId === 'object' ? doc.projectId._id : doc.projectId,
    projectTitle: typeof doc.projectId === 'object' ? doc.projectId.title : 'Project',
    totalAmount: typeof doc.projectId === 'object' ? doc.projectId.totalAmount : 0,
    bidId: doc.bidId,
    generatedDocumentText: doc.generatedDocumentText || '',
    generatedDocumentUrl: doc.generatedDocumentUrl || '',
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

/** No filter = every real contract the caller is a party to — as funder
 * (via project ownership) or contractor (via their bid) — server-scoped the
 * same way land offers/escrows are. */
export function useContractsQuery(filter: { projectId?: string; bidId?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ['contracts', filter],
    queryFn: async (): Promise<Contract[]> => {
      const { data } = await api.get<{ data: BackendContract[] }>('/contracts', { params: filter });
      return data.data.map(mapContract);
    },
    staleTime: 10_000,
  });
}

function useContractAction(action: 'complete' | 'terminate') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ data: BackendContract }>(`/contracts/${id}/${action}`);
      return mapContract(data.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

export const useCompleteContractMutation = () => useContractAction('complete');
export const useTerminateContractMutation = () => useContractAction('terminate');

export interface SubmitEvidenceInput {
  projectId: string;
  milestoneId: string;
  file: { uri: string; fileName?: string | null; mimeType?: string | null };
  notes: string;
  geotagLat?: number;
  geotagLng?: number;
  placeName?: string;
}

/** Real multipart upload to POST /projects/:id/milestones/:milestoneId/evidence
 * (projectValidators.submitEvidence: flat geotagLat/geotagLng fields, a real
 * uploaded `file`, not a nested `geotag` object or a bare fileUrl string). */
export function useSubmitMilestoneEvidenceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, milestoneId, file, notes, geotagLat, geotagLng, placeName }: SubmitEvidenceInput) => {
      const form = new FormData();
      form.append('type', 'photo');
      form.append('file', {
        uri: file.uri,
        name: file.fileName ?? 'evidence.jpg',
        type: file.mimeType ?? 'image/jpeg',
      } as unknown as Blob);
      if (notes) form.append('notes', notes);
      if (geotagLat != null) form.append('geotagLat', String(geotagLat));
      if (geotagLng != null) form.append('geotagLng', String(geotagLng));
      if (placeName) form.append('placeName', placeName);
      const { data } = await api.post(`/projects/${projectId}/milestones/${milestoneId}/evidence`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data;
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export interface WithdrawableEscrow {
  id: string;
  projectTitle: string;
  netAmount: number;
  currency: string;
  createdAt: string;
}

export interface WithdrawableBalance {
  available: number;
  currency: string;
  escrows: WithdrawableEscrow[];
}

interface BackendEscrow {
  _id: string;
  netAmount: number;
  currency: string;
  createdAt: string;
  projectId?: { _id: string; title: string } | string | null;
}

/** Real shape from GET /escrows/withdrawable (escrowController.getWithdrawable)
 * — a single `available` total plus the underlying escrow records, no
 * "total earned" vs "pending escrow" split (that distinction never existed
 * on the backend). */
export function useWithdrawableBalanceQuery() {
  return useQuery({
    queryKey: ['escrows', 'withdrawable'],
    queryFn: async (): Promise<WithdrawableBalance> => {
      const { data } = await api.get<{ data: { available: number; currency: string; escrows: BackendEscrow[] } }>('/escrows/withdrawable');
      return {
        available: data.data.available,
        currency: data.data.currency,
        escrows: data.data.escrows.map((e) => ({
          id: e._id,
          projectTitle: typeof e.projectId === 'object' && e.projectId ? e.projectId.title : 'Project',
          netAmount: e.netAmount,
          currency: e.currency,
          createdAt: e.createdAt,
        })),
      };
    },
    staleTime: 15_000,
  });
}

/** Marks every currently-available escrow as withdrawn — money already
 * moved to the contractor's payout method automatically at milestone-release
 * time (see projectController.releaseMilestoneEscrow); this never
 * re-disburses or takes a fee, it only records the claim. No amount choice,
 * no payment-method selection — the real endpoint takes no body at all. */
export function useWithdrawMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ data: { amount: number; currency: string; count: number; withdrawnAt: string } }>('/escrows/withdraw', {});
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escrows', 'withdrawable'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export interface ContractorCertification {
  id: string;
  title: string;
  issuer: string;
  issuedAt: string | null;
  verified: boolean;
  rejected: boolean;
  documentUrl?: string;
}

function mapCertification(c: any): ContractorCertification {
  return {
    id: c._id || c.id,
    title: c.title,
    issuer: c.issuer,
    issuedAt: c.issuedAt,
    verified: Boolean(c.verified),
    rejected: Boolean(c.rejected),
    documentUrl: c.documentUrl,
  };
}

/** GET /contractor-certifications/me — the bare `/contractor-certifications`
 * route is the admin review queue (requireRole('admin')); a contractor
 * calling it directly gets a 403. */
export function useCertificationsQuery() {
  return useQuery({
    queryKey: ['contractor-certifications'],
    queryFn: async (): Promise<ContractorCertification[]> => {
      const { data } = await api.get<{ data: any[] }>('/contractor-certifications/me');
      return (data.data || []).map(mapCertification);
    },
    staleTime: 30_000,
  });
}

/** GET /contractor-certifications/:userId — public-view-by-id, for a
 * funder evaluating a contractor's portfolio (or the contractor's own "how
 * funders see me" view of the same screen). */
export function useCertificationsForUserQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['contractor-certifications', userId],
    queryFn: async (): Promise<ContractorCertification[]> => {
      const { data } = await api.get<{ data: any[] }>(`/contractor-certifications/${userId}`);
      return (data.data || []).map(mapCertification);
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}

export interface AddCertificationInput {
  title: string;
  issuer: string;
  issuedAt?: string;
  file?: { uri: string; fileName?: string | null; mimeType?: string | null };
}

/** `verified` is never sent — it's admin-only and defaults false on the
 * backend; a freshly added certification is always "pending review", never
 * pre-verified. */
export function useAddCertificationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, issuer, issuedAt, file }: AddCertificationInput) => {
      const form = new FormData();
      form.append('title', title);
      form.append('issuer', issuer);
      if (issuedAt) form.append('issuedAt', issuedAt);
      if (file) {
        form.append('file', {
          uri: file.uri,
          name: file.fileName ?? 'certificate.jpg',
          type: file.mimeType ?? 'image/jpeg',
        } as unknown as Blob);
      }
      const { data } = await api.post('/contractor-certifications', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contractor-certifications'] });
    },
  });
}

/** DELETE /contractor-certifications/:id — mirrors
 * MboaTrustFrontend/src/api/certifications.ts's useRemoveCertificationMutation. */
export function useRemoveCertificationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (certId: string) => {
      await api.delete(`/contractor-certifications/${certId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contractor-certifications'] });
    },
  });
}
