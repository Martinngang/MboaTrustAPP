import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface MilestoneEvidence {
  id: string;
  type: string;
  fileUrl: string;
  notes: string;
  capturedAt: string | null;
  createdAt: string;
}

export interface MilestoneApprover {
  userId: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
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
  }[];
  requiresCosigner?: boolean;
  requiresVideo?: boolean;
  approvers?: {
    userId: { _id: string; fullName: string } | string;
    status: 'pending' | 'approved' | 'rejected';
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
  raised?: number;
  released?: number;
  escrowBalance?: number;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=350&fit=crop&auto=format';

export function mapProject(p: BackendProject): Project {
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
    })),
    approvers: (m.approvers || []).map((a) => ({
      userId: typeof a.userId === 'object' ? a.userId._id : String(a.userId),
      userName: typeof a.userId === 'object' ? a.userId.fullName : 'Approver',
      status: a.status,
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
    raised: p.raised ?? (p.status === 'funded' || p.status === 'in_progress' ? p.totalAmount : 0),
    released: p.released || 0,
    escrowBalance: p.escrowBalance ?? (p.totalAmount - (p.released || 0)),
    status: p.status === 'funded' || p.status === 'in_progress' ? 'active' : p.status,
    ownerId,
    ownerName,
    milestones,
  };
}

export function useProjectsQuery(params?: { projectType?: string; category?: string; ownerId?: string }) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async (): Promise<Project[]> => {
      try {
        const { data } = await api.get<{ data: BackendProject[] }>('/projects', {
          params: { projectType: 'funding', ...params },
        });
        return (data.data || []).map(mapProject);
      } catch {
        return [];
      }
    },
    staleTime: 15_000,
  });
}

export function useMyProjectsQuery(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['projects', 'mine', ownerId],
    queryFn: async (): Promise<Project[]> => {
      if (!ownerId) return [];
      try {
        const { data } = await api.get<{ data: BackendProject[] }>('/projects', {
          params: { projectType: 'funding', ownerId },
        });
        return (data.data || []).map(mapProject);
      } catch {
        return [];
      }
    },
    enabled: !!ownerId,
    staleTime: 15_000,
  });
}

export function useProjectQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async (): Promise<Project | null> => {
      if (!id) return null;
      try {
        const { data } = await api.get<{ data: BackendProject }>(`/projects/${id}`);
        return mapProject(data.data);
      } catch {
        return null;
      }
    },
    enabled: !!id,
    staleTime: 10_000,
  });
}

export interface CreateProjectInput {
  title: string;
  category: string;
  description: string;
  locationName: string;
  totalAmount: number;
  milestones: {
    name: string;
    description: string;
    amount: number;
    requiresVideo?: boolean;
    requiresCosigner?: boolean;
  }[];
}

export function useCreateProjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const payload = {
        ...input,
        projectType: 'funding',
        imageUrl: DEFAULT_IMAGE,
      };
      const { data } = await api.post<{ success: true; data: BackendProject }>('/projects', payload);
      return mapProject(data.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
