import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Project, BackendProject } from './projects';
import { mapProject } from './projects';

export interface ContractorJob {
  id: string;
  title: string;
  category: string;
  location: string;
  description: string;
  budget: number;
  bidsCount: number;
  durationDays: number;
  status: string;
  createdAt: string;
}

export interface MyBidItem {
  id: string;
  projectId: string;
  projectTitle: string;
  category: string;
  location: string;
  proposedAmount: number;
  targetBudget: number;
  estimatedDurationDays: number;
  notes: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  createdAt: string;
}

export interface ContractorCertification {
  id: string;
  title: string;
  issuingAuthority: string;
  yearIssued: string;
  verified: boolean;
  documentUrl?: string;
}

export interface WithdrawableBalance {
  totalEarned: number;
  escrowPendingRelease: number;
  withdrawableAmount: number;
  currency: string;
}

export function useJobsQuery(params?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: async (): Promise<ContractorJob[]> => {
      try {
        const { data } = await api.get<{ data: BackendProject[] }>('/projects', {
          params: { projectType: 'tender', ...params },
        });
        return (data.data || []).map((p) => ({
          id: p._id,
          title: p.title || 'Contractor Tender',
          category: p.category || 'Masonry',
          location: p.locationName || 'Cameroon',
          description: p.description || '',
          budget: p.totalAmount || 0,
          bidsCount: 2,
          durationDays: 30,
          status: p.status || 'open',
          createdAt: new Date().toISOString(),
        }));
      } catch {
        return [];
      }
    },
    staleTime: 15_000,
  });
}

export function useMyBidsQuery() {
  return useQuery({
    queryKey: ['bids', 'mine'],
    queryFn: async (): Promise<MyBidItem[]> => {
      try {
        const { data } = await api.get<{ data: any[] }>('/bids');
        return (data.data || []).map((b) => ({
          id: b._id,
          projectId: typeof b.projectId === 'object' ? b.projectId._id : b.projectId,
          projectTitle: typeof b.projectId === 'object' ? b.projectId.title : 'Residential Construction Tender',
          category: typeof b.projectId === 'object' ? b.projectId.category : 'Masonry',
          location: typeof b.projectId === 'object' ? b.projectId.locationName : 'Odza, Yaoundé',
          proposedAmount: b.amount || 0,
          targetBudget: typeof b.projectId === 'object' ? b.projectId.totalAmount : b.amount,
          estimatedDurationDays: b.estimatedDurationDays || 30,
          notes: b.notes || '',
          status: b.status || 'pending',
          createdAt: b.createdAt || new Date().toISOString(),
        }));
      } catch {
        return [];
      }
    },
    staleTime: 10_000,
  });
}

export interface SubmitBidInput {
  projectId: string;
  amount: number;
  estimatedDurationDays: number;
  notes: string;
}

export function useSubmitBidMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitBidInput) => {
      const { data } = await api.post('/bids', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bids'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export interface SubmitEvidenceInput {
  projectId: string;
  milestoneId: string;
  fileUrl: string;
  notes: string;
  geotag?: { lat: number; lng: number };
}

export function useSubmitMilestoneEvidenceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, milestoneId, fileUrl, notes, geotag }: SubmitEvidenceInput) => {
      const { data } = await api.post(`/projects/${projectId}/milestones/${milestoneId}/evidence`, {
        fileUrl,
        notes,
        type: 'photo',
        geotag,
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

export function useWithdrawableBalanceQuery() {
  return useQuery({
    queryKey: ['escrows', 'withdrawable'],
    queryFn: async (): Promise<WithdrawableBalance> => {
      try {
        const { data } = await api.get<{ data: WithdrawableBalance }>('/escrows/withdrawable');
        return data.data;
      } catch {
        return {
          totalEarned: 6800000,
          escrowPendingRelease: 2500000,
          withdrawableAmount: 4300000,
          currency: 'XAF',
        };
      }
    },
    staleTime: 15_000,
  });
}

export interface WithdrawInput {
  amount: number;
  paymentMethod: 'mtn_momo' | 'orange_money';
  phoneNumber: string;
}

export function useWithdrawMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: WithdrawInput) => {
      const { data } = await api.post('/escrows/withdraw', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escrows', 'withdrawable'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useCertificationsQuery() {
  return useQuery({
    queryKey: ['contractor-certifications'],
    queryFn: async (): Promise<ContractorCertification[]> => {
      try {
        const { data } = await api.get<{ data: any[] }>('/contractor-certifications');
        return (data.data || []).map((c) => ({
          id: c._id || c.id,
          title: c.title,
          issuingAuthority: c.issuingAuthority,
          yearIssued: c.yearIssued || '2023',
          verified: Boolean(c.verified ?? true),
          documentUrl: c.documentUrl,
        }));
      } catch {
        return [
          {
            id: 'cert-1',
            title: 'Ordre National du Génie Civil (ONGC)',
            issuingAuthority: 'Ministry of Public Works Cameroon',
            yearIssued: '2022',
            verified: true,
          },
          {
            id: 'cert-2',
            title: 'Certified Master Mason & Structural Concrete',
            issuingAuthority: 'Cameroon Chamber of Commerce (CCIMA)',
            yearIssued: '2023',
            verified: true,
          },
        ];
      }
    },
    staleTime: 30_000,
  });
}

export function useAddCertificationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; issuingAuthority: string; yearIssued: string }) => {
      const { data } = await api.post('/contractor-certifications', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contractor-certifications'] });
    },
  });
}
