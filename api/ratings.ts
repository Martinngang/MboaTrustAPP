import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// Ported from web's real api/reputation.ts (ratings subset only).
export interface RatingSummary {
  average: number | null;
  count: number;
}

/** Plain (non-hook) fetch — for call sites that need this outside a
 * component's render, e.g. mapping a list of listings each to their real
 * seller rating. Mirrors MboaTrustFrontend/src/api/reputation.ts's
 * fetchRatingSummary. */
export async function fetchRatingSummary(userId: string): Promise<RatingSummary> {
  const { data } = await api.get<{ data: RatingSummary }>(`/ratings/summary/${userId}`);
  return { average: data.data.average, count: data.data.count };
}

export function useRatingSummaryQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['ratingSummary', userId],
    queryFn: () => fetchRatingSummary(userId!),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}

export interface RatingEntry {
  id: string;
  fromName: string;
  score: number;
  comment: string;
  date: string;
}

interface BackendRating {
  _id: string;
  fromUserId: { _id: string; fullName: string } | string;
  toUserId: string;
  projectId: string;
  score: number;
  comment: string;
  roleContext: string;
  createdAt: string;
}

export function useRatingsQuery(filter: { toUserId?: string; projectId?: string; roleContext?: string } = {}) {
  return useQuery({
    queryKey: ['ratings', filter],
    queryFn: async (): Promise<RatingEntry[]> => {
      const { data } = await api.get<{ data: BackendRating[] }>('/ratings', { params: filter });
      return data.data.map((r) => ({
        id: r._id,
        fromName: typeof r.fromUserId === 'object' ? r.fromUserId.fullName : 'Anonymous',
        score: r.score,
        comment: r.comment,
        date: new Date(r.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      }));
    },
    enabled: Boolean(filter.toUserId || filter.projectId),
    staleTime: 10_000,
  });
}

export interface CreateRatingInput {
  toUserId: string;
  projectId: string;
  score: number;
  comment?: string;
  roleContext: 'contractor' | 'verifier' | 'land_seller' | 'supplier';
}

export function useCreateRatingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRatingInput) => {
      const { data } = await api.post('/ratings', input);
      return data.data;
    },
    onSuccess: (_result, vars) => {
      qc.invalidateQueries({ queryKey: ['ratings'] });
      qc.invalidateQueries({ queryKey: ['ratingSummary', vars.toUserId] });
    },
  });
}
