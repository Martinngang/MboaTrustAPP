import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface VerificationTask {
  id: string;
  targetType: 'milestone' | 'land_listing';
  targetId: string;
  projectTitle: string;
  milestoneTitle?: string;
  location: string;
  coordinates: { lat: number; lng: number };
  dueDate: string;
  bountyFee: number;
  status: 'assigned' | 'in_progress' | 'submitted';
  contractorEvidence?: {
    photos: string[];
    notes: string;
    submittedAt: string;
  };
  report?: {
    confirmedMatch: boolean;
    reportText: string;
    reportPhotos: string[];
    submittedAt: string;
  };
  createdAt: string;
}

export interface VerifierProfile {
  id: string;
  fullName: string;
  specialties: string[];
  regions: string[];
  bio: string;
  applicationStatus: 'pending' | 'approved' | 'rejected';
  isAvailable: boolean;
  rating: number;
  completedTasksCount: number;
  totalBountiesEarned: number;
}

const DEFAULT_TASKS: VerificationTask[] = [
  {
    id: 'task-101',
    targetType: 'milestone',
    targetId: 'm-1',
    projectTitle: 'Villa Odza Residential Construction',
    milestoneTitle: 'Foundation Trench & Steel Rebar Casting',
    location: 'Odza Borne 10, Yaoundé',
    coordinates: { lat: 3.848, lng: 11.502 },
    dueDate: 'In 2 days',
    bountyFee: 75000,
    status: 'assigned',
    contractorEvidence: {
      photos: [
        'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=600&h=400&fit=crop',
      ],
      notes: 'Excavation completed to 1.5m, steel cage assembled and concrete slab poured.',
      submittedAt: 'Yesterday',
    },
    createdAt: 'Yesterday',
  },
  {
    id: 'task-102',
    targetType: 'land_listing',
    targetId: 'land-1',
    projectTitle: '1,200 m² Prime Coastal Plot Inspection',
    milestoneTitle: 'Cadastral Boundary Markers & Title Verification',
    location: 'Ngoye Plage, Kribi',
    coordinates: { lat: 2.938, lng: 9.907 },
    dueDate: 'In 4 days',
    bountyFee: 120000,
    status: 'in_progress',
    contractorEvidence: {
      photos: [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop',
      ],
      notes: 'Cadastral concrete corner beacons placed according to TF #8812/Oce survey layout.',
      submittedAt: '2 days ago',
    },
    createdAt: '3 days ago',
  },
  {
    id: 'task-103',
    targetType: 'milestone',
    targetId: 'm-2',
    projectTitle: 'Mbalmayo Community Water Station',
    milestoneTitle: 'Borehole Drilling to 65m & Casing Installation',
    location: 'Quartier Oyack, Mbalmayo',
    coordinates: { lat: 3.518, lng: 11.503 },
    dueDate: 'Completed',
    bountyFee: 90000,
    status: 'submitted',
    report: {
      confirmedMatch: true,
      reportText: 'Borehole depth measured at 67.2m with hydraulic pressure gauge verified. Clear water discharge tested.',
      reportPhotos: [
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&h=400&fit=crop',
      ],
      submittedAt: 'Aug 24, 2026',
    },
    createdAt: '1 week ago',
  },
];

export function useMyVerifierProfileQuery() {
  return useQuery({
    queryKey: ['verifier-profile', 'me'],
    queryFn: async (): Promise<VerifierProfile> => {
      try {
        const { data } = await api.get<{ data: any }>('/verifier-profiles/me');
        if (data.data) {
          return {
            id: data.data._id || 'ver-1',
            fullName: data.data.userName || 'Dr. Christian Nguema (Ing. Civil)',
            specialties: data.data.specialties || ['Civil Engineering', 'Reinforced Concrete', 'Cadastral Surveying'],
            regions: data.data.regions || ['Centre', 'Littoral', 'Sud'],
            bio: data.data.bio || 'Sworn Civil Engineer & Land Surveyor registered with ONGC Cameroon.',
            applicationStatus: data.data.applicationStatus || 'approved',
            isAvailable: Boolean(data.data.isAvailable ?? true),
            rating: 4.9,
            completedTasksCount: 18,
            totalBountiesEarned: 1450000,
          };
        }
        return {
          id: 'ver-1',
          fullName: 'Dr. Christian Nguema (Ing. Civil)',
          specialties: ['Civil Engineering', 'Reinforced Concrete', 'Cadastral Surveying', 'Structural Audits'],
          regions: ['Centre', 'Littoral', 'Sud'],
          bio: 'Sworn Civil Engineer & Land Surveyor registered with ONGC Cameroon.',
          applicationStatus: 'approved',
          isAvailable: true,
          rating: 4.9,
          completedTasksCount: 18,
          totalBountiesEarned: 1450000,
        };
      } catch {
        return {
          id: 'ver-1',
          fullName: 'Dr. Christian Nguema (Ing. Civil)',
          specialties: ['Civil Engineering', 'Reinforced Concrete', 'Cadastral Surveying', 'Structural Audits'],
          regions: ['Centre', 'Littoral', 'Sud'],
          bio: 'Sworn Civil Engineer & Land Surveyor registered with ONGC Cameroon.',
          applicationStatus: 'approved',
          isAvailable: true,
          rating: 4.9,
          completedTasksCount: 18,
          totalBountiesEarned: 1450000,
        };
      }
    },
    staleTime: 20_000,
  });
}

export function useVerificationTasksQuery(status?: string) {
  return useQuery({
    queryKey: ['verification-tasks', status],
    queryFn: async (): Promise<VerificationTask[]> => {
      try {
        const { data } = await api.get<{ data: any[] }>('/verification-tasks', { params: { status } });
        if (data.data && data.data.length > 0) {
          return data.data.map((t) => ({
            id: t._id || t.id,
            targetType: t.targetType || 'milestone',
            targetId: t.targetId,
            projectTitle: t.target?.title || t.projectTitle || 'Construction Project',
            milestoneTitle: t.target?.milestoneTitle || t.milestoneTitle || 'Milestone Verification',
            location: t.target?.location || t.location || 'Yaoundé, Cameroon',
            coordinates: t.coordinates || { lat: 3.848, lng: 11.502 },
            dueDate: t.dueDate || 'In 2 days',
            bountyFee: t.bountyFee || 75000,
            status: t.status || 'assigned',
            contractorEvidence: t.contractorEvidence,
            report: t.report,
            createdAt: t.createdAt || new Date().toISOString(),
          }));
        }
        return DEFAULT_TASKS;
      } catch {
        return DEFAULT_TASKS;
      }
    },
    staleTime: 10_000,
  });
}

export function useStartVerificationTaskMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await api.post(`/verification-tasks/${taskId}/start`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verification-tasks'] });
    },
  });
}

export interface SubmitReportInput {
  taskId: string;
  reportText: string;
  reportPhotos: string[];
  confirmedMatch: boolean;
}

export function useSubmitVerificationReportMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, reportText, reportPhotos, confirmedMatch }: SubmitReportInput) => {
      const { data } = await api.post(`/verification-tasks/${taskId}/report`, {
        reportText,
        reportPhotos,
        confirmedMatch,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verification-tasks'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export interface UpsertVerifierProfileInput {
  specialties: string[];
  regions: string[];
  bio?: string;
}

export function useUpsertVerifierProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertVerifierProfileInput) => {
      const { data } = await api.post('/verifier-profiles/me', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verifier-profile'] });
    },
  });
}
