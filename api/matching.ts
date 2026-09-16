import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { Bid, MilestoneProposal, NegotiationRound } from './tenders';

/** Mirrors contractorMatchingService.scoreContractor's breakdown exactly —
 * every point traceable to a dimension so the UI can show why, not just how
 * much. */
export interface MatchScoreBreakdown {
  category: number;
  location: number;
  reliability: number;
  rating: number;
  availability: number;
  experience: number;
  certifications: number;
}
export interface MatchScore {
  total: number;
  breakdown: MatchScoreBreakdown;
}
export interface MatchStats {
  completedProjects: number;
  totalBids: number;
  acceptedBids: number;
  completionRate: number;
  avgRating: number | null;
  ratingCount: number;
}

export interface RecommendedContractor {
  contractorId: string;
  fullName: string;
  avatarUrl: string | null;
  score: MatchScore;
  stats: MatchStats;
  /** Short "why this fits" sentence from Gemini — only ever set on the top
   * few candidates, and null whenever AI is unconfigured/disabled/timed out —
   * never a UI error. */
  aiRationale: string | null;
}

interface BackendRecommendedContractor {
  contractorId: string;
  fullName: string;
  avatarUrl?: string | null;
  score: MatchScore;
  stats: MatchStats;
  aiRationale: string | null;
}

/** Ranks the whole contractor pool against a tender — for a funder actively
 * seeking candidates, not just reacting to bids already placed. Ported from
 * MboaTrustFrontend/src/api/matching.ts — same endpoint, owner/admin only,
 * enforced server-side. */
export function useRecommendedContractorsQuery(projectId: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ['recommendedContractors', projectId, limit],
    queryFn: async (): Promise<RecommendedContractor[]> => {
      const { data } = await api.get<{ data: BackendRecommendedContractor[] }>(
        `/projects/${projectId}/recommended-contractors`,
        { params: { limit } }
      );
      return data.data.map((r) => ({ ...r, avatarUrl: r.avatarUrl ?? null }));
    },
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });
}

export interface BidWithScore extends Bid {
  score: MatchScore;
  stats: MatchStats;
}

interface BackendMilestoneProposal {
  title: string;
  description: string;
  amount: number;
}
interface BackendNegotiationRound {
  proposedBy: 'funder' | 'contractor';
  price: number;
  timelineDays: number;
  milestones: BackendMilestoneProposal[];
  message: string;
  createdAt: string;
}
interface BackendBidWithScore {
  _id: string;
  projectId: string;
  contractorId: { _id: string; fullName: string } | string;
  price: number;
  timelineDays: number;
  materialsPlan: string;
  notes: string;
  status: string;
  createdAt: string;
  score: MatchScore;
  stats: MatchStats;
  milestones?: BackendMilestoneProposal[];
  rounds?: BackendNegotiationRound[];
  lastProposedBy?: 'funder' | 'contractor';
}

function mapRound(r: BackendNegotiationRound): NegotiationRound {
  return { proposedBy: r.proposedBy, price: r.price, timelineDays: r.timelineDays, milestones: r.milestones ?? [], message: r.message ?? '', createdAt: r.createdAt };
}
function mapMilestones(ms: BackendMilestoneProposal[] | undefined): MilestoneProposal[] {
  return (ms ?? []).map((m) => ({ title: m.title, description: m.description ?? '', amount: m.amount }));
}

/** Same scoring function as recommendations, applied to the contractors who
 * actually bid — lets a funder compare "who fits best" alongside "who bid
 * what" on one screen. Owner/admin only, enforced server-side. */
export function useBidsWithScoresQuery(projectId: string | undefined) {
  return useQuery({
    queryKey: ['bidsWithScores', projectId],
    queryFn: async (): Promise<BidWithScore[]> => {
      const { data } = await api.get<{ data: BackendBidWithScore[] }>(`/projects/${projectId}/bids-with-scores`);
      return data.data.map((b) => ({
        id: b._id,
        jobId: b.projectId,
        jobTitle: '',
        contractorName: typeof b.contractorId === 'object' ? b.contractorId.fullName : 'Contractor',
        contractorId: typeof b.contractorId === 'object' ? b.contractorId._id : b.contractorId,
        price: b.price,
        timelineDays: b.timelineDays,
        materials: b.materialsPlan,
        notes: b.notes,
        status: b.status === 'submitted' ? 'pending' : b.status,
        submitted: new Date(b.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        milestones: mapMilestones(b.milestones),
        rounds: (b.rounds ?? []).map(mapRound),
        lastProposedBy: b.lastProposedBy ?? 'contractor',
        score: b.score,
        stats: b.stats,
      }));
    },
    enabled: Boolean(projectId),
    staleTime: 10_000,
  });
}
