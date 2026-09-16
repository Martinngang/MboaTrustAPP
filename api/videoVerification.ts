import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// Ported from MboaTrustFrontend/src/api/videoVerification.ts — same real
// /video-verifications backend, same shape.
export interface VideoSession {
  id: string;
  projectId: string;
  milestoneId: string;
  status: 'requested' | 'scheduled' | 'completed' | 'cancelled';
  scheduledFor: string | null;
  meetingUrl: string;
  notes: string;
}

interface BackendVideoSession {
  _id: string;
  projectId: string;
  milestoneId: string;
  status: 'requested' | 'scheduled' | 'completed' | 'cancelled';
  scheduledFor: string | null;
  meetingUrl: string;
  notes: string;
}

function mapSession(doc: BackendVideoSession): VideoSession {
  return {
    id: doc._id,
    projectId: doc.projectId,
    milestoneId: doc.milestoneId,
    status: doc.status,
    scheduledFor: doc.scheduledFor,
    meetingUrl: doc.meetingUrl,
    notes: doc.notes,
  };
}

/** The most recent (or only) real session for a milestone — only ever
 * requestable on a milestone the funder actually flagged requiresVideo at
 * creation time (see the Milestone type's `requiresVideo`). */
export function useVideoSessionsQuery(projectId?: string, milestoneId?: string) {
  return useQuery({
    queryKey: ['videoSessions', projectId, milestoneId],
    queryFn: async (): Promise<VideoSession[]> => {
      const { data } = await api.get<{ data: BackendVideoSession[] }>('/video-verifications', { params: { projectId, milestoneId } });
      return data.data.map(mapSession);
    },
    enabled: Boolean(projectId && milestoneId),
    staleTime: 10_000,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['videoSessions'] });
}

export function useRequestVideoSessionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, milestoneId, notes }: { projectId: string; milestoneId: string; notes?: string }) => {
      const { data } = await api.post<{ data: BackendVideoSession }>('/video-verifications', { projectId, milestoneId, notes });
      return mapSession(data.data);
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useScheduleVideoSessionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, scheduledFor, meetingUrl }: { sessionId: string; scheduledFor: string; meetingUrl: string }) => {
      const { data } = await api.post<{ data: BackendVideoSession }>(`/video-verifications/${sessionId}/schedule`, { scheduledFor, meetingUrl });
      return mapSession(data.data);
    },
    onSuccess: () => invalidate(qc),
  });
}
