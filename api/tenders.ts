import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface ContractorBid {
  id: string;
  projectId: string;
  contractorId: string;
  contractorName: string;
  proposedAmount: number;
  estimatedDurationDays: number;
  notes: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  rating: number;
  completedJobs: number;
  createdAt: string;
}

interface BackendBid {
  _id: string;
  projectId: string;
  contractorId: { _id: string; fullName: string; rating?: number; completedJobs?: number } | string;
  amount: number;
  estimatedDurationDays: number;
  notes: string;
  status: string;
  createdAt: string;
}

function mapBid(b: BackendBid): ContractorBid {
  const contractorId = typeof b.contractorId === 'object' ? b.contractorId._id : String(b.contractorId);
  const contractorName = typeof b.contractorId === 'object' ? b.contractorId.fullName : 'Contractor';
  const rating = typeof b.contractorId === 'object' ? b.contractorId.rating || 4.8 : 4.8;
  const completedJobs = typeof b.contractorId === 'object' ? b.contractorId.completedJobs || 12 : 12;

  return {
    id: b._id,
    projectId: b.projectId,
    contractorId,
    contractorName,
    proposedAmount: b.amount || 0,
    estimatedDurationDays: b.estimatedDurationDays || 30,
    notes: b.notes || '',
    status: (b.status as any) || 'pending',
    rating,
    completedJobs,
    createdAt: b.createdAt || new Date().toISOString(),
  };
}

export function useBidsForProjectQuery(projectId: string | undefined) {
  return useQuery({
    queryKey: ['bids', projectId],
    queryFn: async (): Promise<ContractorBid[]> => {
      if (!projectId) return [];
      try {
        const { data } = await api.get<{ data: BackendBid[] }>('/bids', {
          params: { projectId },
        });
        return (data.data || []).map(mapBid);
      } catch {
        return [];
      }
    },
    enabled: !!projectId,
    staleTime: 10_000,
  });
}

export function useAcceptBidMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bidId, projectId }: { bidId: string; projectId: string }) => {
      const { data } = await api.post(`/bids/${bidId}/accept`);
      return data;
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['bids', projectId] });
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export interface CreateTenderInput {
  title: string;
  category: string;
  tradeSpecialty: string;
  description: string;
  locationName: string;
  budget: number;
  durationDays: number;
}

export function useCreateTenderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTenderInput) => {
      const payload = {
        title: input.title,
        category: input.category,
        description: `${input.description}\n\nTrade Specialty: ${input.tradeSpecialty}\nEstimated Duration: ${input.durationDays} days`,
        locationName: input.locationName,
        totalAmount: input.budget,
        projectType: 'tender',
        milestones: [
          {
            name: 'Initial Foundation & Site Prep',
            amount: Math.round(input.budget * 0.3),
            description: 'Site mobilization, materials prep and primary structure',
          },
          {
            name: 'Main Structural Work & Execution',
            amount: Math.round(input.budget * 0.4),
            description: 'Core trade construction and installation',
          },
          {
            name: 'Finishing, Inspection & Handover',
            amount: Math.round(input.budget * 0.3),
            description: 'Final touches, quality verification and acceptance',
          },
        ],
      };
      const { data } = await api.post('/projects', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
