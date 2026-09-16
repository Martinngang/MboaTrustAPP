import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from './client';
import { getNextPageParam, type PageMeta } from './pagination';

// Ported from MboaTrustFrontend/src/api/contractors.ts — same field shapes,
// same query keys. RN has no `File`; new portfolio images arrive as
// expo-image-picker assets (see PickedImage, same convention as
// api/inventoryItems.ts's upload body).
export interface PortfolioImage {
  _id?: string;
  url: string;
  caption: string;
}

interface BackendContractorProfile {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  categories: string[];
  regions: string[];
  bio: string;
  headline: string;
  services: string[];
  portfolioImages: PortfolioImage[];
  yearsExperience: number;
  isAvailable: boolean;
  kycStatus?: string;
  stats: { completedProjects: number; totalBids: number; acceptedBids: number; completionRate: number; avgRating: number | null; ratingCount: number };
}

export interface ContractorPortfolio {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  categories: string[];
  regions: string[];
  bio: string;
  headline: string;
  services: string[];
  portfolioImages: PortfolioImage[];
  yearsExperience: number;
  isAvailable: boolean;
  kycStatus?: string;
  stats: BackendContractorProfile['stats'];
}

function mapPortfolio(doc: BackendContractorProfile): ContractorPortfolio {
  return {
    userId: doc.userId,
    fullName: doc.fullName,
    avatarUrl: doc.avatarUrl,
    categories: doc.categories ?? [],
    regions: doc.regions ?? [],
    bio: doc.bio,
    headline: doc.headline ?? '',
    services: doc.services ?? [],
    portfolioImages: doc.portfolioImages ?? [],
    yearsExperience: doc.yearsExperience,
    isAvailable: doc.isAvailable,
    kycStatus: doc.kycStatus,
    stats: doc.stats,
  };
}

export function useContractorPortfolioQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['contractorProfiles', 'portfolio', userId],
    queryFn: async (): Promise<ContractorPortfolio> => {
      const { data } = await api.get<{ data: BackendContractorProfile }>(`/contractor-profiles/${userId}`);
      return mapPortfolio(data.data);
    },
    enabled: Boolean(userId),
    staleTime: 10_000,
  });
}

export interface CompletedWorkItem {
  id: string;
  projectTitle: string;
  category: string;
  location: string;
  completedAt: string;
}

export function useContractorCompletedWorkQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['contractorCompletedWork', userId],
    queryFn: async (): Promise<CompletedWorkItem[]> => {
      const { data } = await api.get<{ data: CompletedWorkItem[] }>(`/contractor-profiles/${userId}/completed-work`);
      return data.data;
    },
    enabled: Boolean(userId),
    staleTime: 10_000,
  });
}

// ── Public leaderboard ──────────────────────────────────────────────────
export interface LeaderboardRow {
  rank: number;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  kycStatus?: string;
  categories: string[];
  regions: string[];
  yearsExperience: number;
  stats: BackendContractorProfile['stats'];
  score: { total: number; breakdown: Record<string, number> };
}

export function useContractorLeaderboardQuery(filter: { search?: string; category?: string; region?: string; verified?: boolean; page?: number; limit?: number; enabled?: boolean } = {}) {
  const { enabled = true, ...params } = filter;
  return useQuery({
    queryKey: ['contractorLeaderboard', params],
    queryFn: async (): Promise<{ rows: LeaderboardRow[]; total: number }> => {
      const { data } = await api.get<{ data: LeaderboardRow[]; meta: { total: number } }>('/contractor-profiles/leaderboard', { params });
      return { rows: data.data, total: data.meta.total };
    },
    enabled,
    staleTime: 15_000,
  });
}

export interface ContractorCard {
  id: string;
  name: string;
  trade: string;
  location: string;
  rating: number;
  jobs: number;
  initials: string;
  verified: boolean;
}

// A brand new contractor with zero ratings yet shouldn't display as "0
// stars" — a neutral 4.5 is a reasonable prior until they earn real ratings.
const NEW_CONTRACTOR_RATING = 4.5;

function mapContractorCard(doc: BackendContractorProfile): ContractorCard {
  const initials = doc.fullName.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '—';
  return {
    id: doc.userId,
    name: doc.fullName,
    trade: doc.categories[0] || 'General Contracting',
    location: doc.regions[0] || '',
    rating: doc.stats.avgRating ?? NEW_CONTRACTOR_RATING,
    jobs: doc.stats.completedProjects,
    initials,
    verified: doc.kycStatus === 'verified',
  };
}

/** Paginated feed for the contractor directory (BrowseContractorsScreen). */
export function useContractorProfilesInfiniteQuery(limit = 12) {
  return useInfiniteQuery({
    queryKey: ['contractorProfiles', 'infinite'],
    queryFn: async ({ pageParam }: { pageParam: number }): Promise<{ items: ContractorCard[]; meta: PageMeta }> => {
      const { data } = await api.get<{ data: BackendContractorProfile[]; meta: PageMeta }>('/contractor-profiles', { params: { page: pageParam, limit } });
      return { items: data.data.map(mapContractorCard), meta: data.meta };
    },
    initialPageParam: 1,
    getNextPageParam,
    staleTime: 10_000,
  });
}

/** An expo-image-picker asset — only the fields the upload body needs. */
export interface PickedImage {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export interface UpsertContractorProfileInput {
  categories?: string[];
  regions?: string[];
  bio?: string;
  headline?: string;
  services?: string[];
  yearsExperience?: number;
  isAvailable?: boolean;
  /** Portfolio images to keep (already-uploaded, possibly re-captioned or
   * reordered) — omit entries to remove them. */
  existingPortfolioImages?: PortfolioImage[];
  newPortfolioImages?: PickedImage[];
}

function toRequestBody(input: UpsertContractorProfileInput): FormData | Record<string, unknown> {
  const { newPortfolioImages, ...rest } = input;
  if (!newPortfolioImages || newPortfolioImages.length === 0) {
    return rest;
  }
  const form = new FormData();
  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined) continue;
    form.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }
  newPortfolioImages.forEach((img, i) => {
    const name = img.fileName ?? `image-${i}.jpg`;
    const type = img.mimeType ?? 'image/jpeg';
    form.append('images', { uri: img.uri, name, type } as unknown as Blob);
  });
  return form;
}

export function useUpsertMyContractorProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: UpsertContractorProfileInput) => {
      const body = toRequestBody(p);
      const { data } = await api.put<{ data: BackendContractorProfile }>('/contractor-profiles/me', body, {
        headers: body instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return mapPortfolio(data.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contractorProfiles'] });
      qc.invalidateQueries({ queryKey: ['contractorLeaderboard'] });
    },
  });
}

// ── Availability calendar ───────────────────────────────────────────────────
interface BackendAvailabilityEntry {
  date: string;
  isAvailable: boolean;
}
export type AvailabilityMap = Record<string, 'available' | 'unavailable'>;

function mapAvailability(entries: BackendAvailabilityEntry[]): AvailabilityMap {
  const map: AvailabilityMap = {};
  for (const e of entries) {
    if (!e.isAvailable) map[e.date.slice(0, 10)] = 'unavailable';
  }
  return map;
}

/** No userId = the caller's own calendar (GET /contractor-profiles/me,
 * authenticated); a userId views someone else's real calendar read-only. */
export function useAvailabilityQuery(userId?: string) {
  return useQuery({
    queryKey: ['contractorAvailability', userId ?? 'me'],
    queryFn: async (): Promise<AvailabilityMap> => {
      const { data } = await api.get<{ data: { availability: BackendAvailabilityEntry[] } }>(
        userId ? `/contractor-profiles/${userId}` : '/contractor-profiles/me'
      );
      return mapAvailability(data.data.availability ?? []);
    },
    staleTime: 10_000,
  });
}

export function useSetAvailabilityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, isAvailable }: { date: string; isAvailable: boolean }) => {
      const { data } = await api.put('/contractor-profiles/me/availability', { dates: [{ date, isAvailable }] });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contractorAvailability', 'me'] }),
  });
}
