import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// Ported from the real backend (verificationController.js,
// verifierProfileController.js) and web's equivalent hooks in
// api/reputation.ts / api/verifierProfiles.ts. The previous version of this
// file invented fields with no backend counterpart at all — a `bountyFee`
// per task (there is no verifier payment/bounty system anywhere in this
// backend), `coordinates`, `dueDate`, a nested `contractorEvidence` block,
// and a verifier profile `rating`/`completedTasksCount`/
// `totalBountiesEarned` — and fell back to one specific fake verifier
// ("Dr. Christian Nguema", 4.9 rating, 18 completed audits) and 3 fake
// tasks (two with real-looking but fabricated Unsplash "evidence" photos)
// whenever a real fetch failed or returned empty.
export type VerificationTaskStatus = 'assigned' | 'in_progress' | 'submitted';

export interface VerificationTask {
  id: string;
  targetType: 'milestone' | 'land_listing';
  targetId: string;
  verifierId: string;
  status: VerificationTaskStatus;
  reportText: string;
  reportPhotos: string[];
  confirmedMatch: boolean | null;
  createdAt: string;
  projectTitle: string;
  milestoneTitle?: string;
  location: string;
  projectId?: string;
}

interface BackendVerificationTask {
  _id: string;
  targetType: 'milestone' | 'land_listing';
  targetId: string;
  verifierId: string;
  status: VerificationTaskStatus;
  reportText: string;
  reportPhotos: string[];
  confirmedMatch: boolean | null;
  createdAt: string;
  target: { title: string; location: string; milestoneTitle?: string; projectId?: string } | null;
}

function mapTask(doc: BackendVerificationTask): VerificationTask {
  return {
    id: doc._id,
    targetType: doc.targetType,
    targetId: doc.targetId,
    verifierId: doc.verifierId,
    status: doc.status,
    reportText: doc.reportText,
    reportPhotos: doc.reportPhotos,
    confirmedMatch: doc.confirmedMatch,
    createdAt: doc.createdAt,
    projectTitle: doc.target?.title ?? (doc.targetType === 'land_listing' ? 'Land listing' : 'Project'),
    milestoneTitle: doc.target?.milestoneTitle,
    location: doc.target?.location ?? '',
    projectId: doc.target?.projectId,
  };
}

/** No verifierId filter = the caller's own task queue (server-scoped). */
export function useVerificationTasksQuery(status?: VerificationTaskStatus) {
  return useQuery({
    queryKey: ['verification-tasks', status],
    queryFn: async (): Promise<VerificationTask[]> => {
      const { data } = await api.get<{ data: BackendVerificationTask[] }>('/verification-tasks', { params: { status } });
      return data.data.map(mapTask);
    },
    staleTime: 10_000,
  });
}

/** For a target owner (a funder's own milestone, a seller's own listing)
 * checking whether it has a real, submitted independent verifier report —
 * not a task-queue view, so it's keyed by target rather than the caller. */
export function useTargetVerificationTasksQuery(targetType: 'milestone' | 'land_listing', targetId: string | undefined) {
  return useQuery({
    queryKey: ['verification-tasks', 'target', targetType, targetId],
    queryFn: async (): Promise<VerificationTask[]> => {
      const { data } = await api.get<{ data: BackendVerificationTask[] }>('/verification-tasks', {
        params: { targetType, targetId },
      });
      return data.data.map(mapTask);
    },
    enabled: Boolean(targetId),
    staleTime: 10_000,
  });
}

export function useVerificationTaskQuery(taskId: string | undefined) {
  return useQuery({
    queryKey: ['verification-task', taskId],
    queryFn: async (): Promise<VerificationTask> => {
      const { data } = await api.get<{ data: BackendVerificationTask }>(`/verification-tasks/${taskId}`);
      return mapTask(data.data);
    },
    enabled: Boolean(taskId),
    staleTime: 5_000,
  });
}

export function useStartVerificationTaskMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await api.post<{ data: BackendVerificationTask }>(`/verification-tasks/${taskId}/start`);
      return mapTask(data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verification-tasks'] }),
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
      const { data } = await api.post<{ data: BackendVerificationTask }>(`/verification-tasks/${taskId}/report`, {
        reportText, reportPhotos, confirmedMatch,
      });
      return mapTask(data.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verification-tasks'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ── Verifier profile ─────────────────────────────────────────────────────
export type VerifierApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface VerifierProfile {
  id: string;
  userId: string;
  fullName?: string;
  specialties: string[];
  regions: string[];
  bio: string;
  idDocumentUrl: string;
  applicationStatus: VerifierApplicationStatus;
  isAvailable: boolean;
}

interface BackendVerifierProfile {
  _id: string;
  userId: { _id: string; fullName: string; email?: string } | string;
  specialties: string[];
  regions: string[];
  bio: string;
  idDocumentUrl: string;
  applicationStatus: VerifierApplicationStatus;
  isAvailable: boolean;
}

function mapProfile(doc: BackendVerifierProfile): VerifierProfile {
  return {
    id: doc._id,
    userId: typeof doc.userId === 'object' ? doc.userId._id : doc.userId,
    fullName: typeof doc.userId === 'object' ? doc.userId.fullName : undefined,
    specialties: doc.specialties,
    regions: doc.regions,
    bio: doc.bio,
    idDocumentUrl: doc.idDocumentUrl,
    applicationStatus: doc.applicationStatus,
    isAvailable: doc.isAvailable,
  };
}

/** `null` means no application exists yet — a real, distinct state a
 * caller must handle explicitly (e.g. offer to register), never papered
 * over with placeholder data. */
export function useMyVerifierProfileQuery(enabled = true) {
  return useQuery({
    queryKey: ['verifier-profile', 'me'],
    queryFn: async (): Promise<VerifierProfile | null> => {
      const { data } = await api.get<{ data: BackendVerifierProfile | null }>('/verifier-profiles/me');
      return data.data ? mapProfile(data.data) : null;
    },
    enabled,
    staleTime: 20_000,
  });
}

export interface UpsertVerifierProfileInput {
  specialties: string[];
  regions: string[];
  bio?: string;
  /** Government ID document — real multipart upload to the same
   * POST /verifier-profiles/me (see backend's `upload.single('file')`).
   * Optional so VerifierProfileScreen's credential-edit flow (no re-upload
   * needed on every edit) keeps working unchanged. */
  file?: { uri: string; fileName?: string | null; mimeType?: string | null } | null;
}

export function useUpsertVerifierProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ specialties, regions, bio, file }: UpsertVerifierProfileInput) => {
      let response;
      if (file) {
        const form = new FormData();
        form.append('specialties', JSON.stringify(specialties));
        form.append('regions', JSON.stringify(regions));
        if (bio) form.append('bio', bio);
        form.append('file', {
          uri: file.uri,
          name: file.fileName ?? 'id-document.jpg',
          type: file.mimeType ?? 'image/jpeg',
        } as unknown as Blob);
        response = await api.post<{ data: BackendVerifierProfile }>('/verifier-profiles/me', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.post<{ data: BackendVerifierProfile }>('/verifier-profiles/me', { specialties, regions, bio });
      }
      return mapProfile(response.data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verifier-profile'] }),
  });
}
