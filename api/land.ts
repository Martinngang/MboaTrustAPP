import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { fetchRatingSummary } from './ratings';

// Ported from MboaTrustFrontend/src/api/land.ts — same real field shapes.
// The previous version of this file had its own invented schema
// (neighborhood, pricePerSqm, titleNumber, a boolean `verified`, a
// `photos[]` gallery, `features[]`, `sellerRating`, a `status` enum) with no
// backend counterpart at all, and fell back to 3 hardcoded Unsplash-photo
// listings (and 1 fake offer) whenever a real fetch failed OR returned
// zero results — meaning the fake data showed constantly, not just on
// error. None of that remains.
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=400&h=250&fit=crop&auto=format';

// A brand new seller with zero ratings yet shouldn't display as "0 stars" —
// a neutral 4.5 is a reasonable prior until they earn real ratings, same as
// web. Real ratings come from GET /ratings/summary/:userId (fetchRatingSummary)
// — this used to be the value shown unconditionally for every seller,
// regardless of whether they had real ratings.
const NEW_SELLER_RATING = 4.5;

export interface LandDocument { type: string; verificationStatus: string }

export interface LandListing {
  id: string;
  title: string;
  region: string;
  city: string;
  sizeSqm: number;
  price: number;
  verified: boolean;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'flagged';
  titleType: string;
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  disputeFlag: boolean;
  disputeReason?: string;
  linkedProjectId?: string;
  imageUrl: string;
  description: string;
  documents: LandDocument[];
  createdAt: string;
}

interface BackendLandDocument { type: string; fileUrl: string; verificationStatus: string }
interface BackendLandListing {
  _id: string;
  title: string;
  region: string;
  city: string;
  titleType: string;
  description: string;
  imageUrl: string;
  sizeSqm: number;
  price: number;
  location: { lat: number | null; lng: number | null };
  documents: BackendLandDocument[];
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'flagged';
  disputeFlag: boolean;
  disputeReason: string;
  linkedProjectId: string | null;
  sellerId: { _id: string; fullName: string } | string;
  createdAt: string;
}

function mapListing(doc: BackendLandListing, sellerRating: number = NEW_SELLER_RATING): LandListing {
  return {
    id: doc._id,
    title: doc.title || 'Untitled listing',
    region: doc.region,
    city: doc.city,
    sizeSqm: doc.sizeSqm,
    price: doc.price,
    verified: doc.verificationStatus === 'verified',
    verificationStatus: doc.verificationStatus,
    titleType: doc.titleType || 'Documents under verification',
    sellerId: typeof doc.sellerId === 'object' ? doc.sellerId._id : doc.sellerId,
    sellerName: typeof doc.sellerId === 'object' ? doc.sellerId.fullName : 'Unknown',
    sellerRating,
    disputeFlag: doc.disputeFlag,
    disputeReason: doc.disputeReason || undefined,
    linkedProjectId: doc.linkedProjectId || undefined,
    imageUrl: doc.imageUrl || DEFAULT_IMAGE,
    description: doc.description || '',
    documents: doc.documents.map((d) => ({ type: d.type, verificationStatus: d.verificationStatus })),
    createdAt: doc.createdAt,
  };
}

export function useLandListingsQuery(params?: { region?: string; sellerId?: string }) {
  return useQuery({
    queryKey: ['land-listings', params],
    queryFn: async (): Promise<LandListing[]> => {
      const { data } = await api.get<{ data: BackendLandListing[] }>('/land-listings', { params });
      const ratings = await Promise.all(
        data.data.map((l) => (typeof l.sellerId === 'object' ? fetchRatingSummary(l.sellerId._id) : Promise.resolve({ average: null, count: 0 })))
      );
      return data.data.map((l, i) => mapListing(l, ratings[i].average ?? NEW_SELLER_RATING));
    },
    staleTime: 15_000,
  });
}

export function useLandListingDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['land-listing', id],
    queryFn: async (): Promise<LandListing> => {
      const { data } = await api.get<{ data: BackendLandListing }>(`/land-listings/${id}`);
      const sellerId = typeof data.data.sellerId === 'object' ? data.data.sellerId._id : data.data.sellerId;
      const rating = await fetchRatingSummary(sellerId);
      return mapListing(data.data, rating.average ?? NEW_SELLER_RATING);
    },
    enabled: !!id,
    staleTime: 10_000,
  });
}

export interface CreateLandListingInput {
  title: string;
  region: string;
  city: string;
  sizeSqm: number;
  price: number;
  titleType: string;
  description: string;
}

export function useCreateLandListingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLandListingInput) => {
      const { data } = await api.post<{ data: BackendLandListing }>('/land-listings', input);
      return mapListing(data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['land-listings'] }),
  });
}

/** A picked photo/document asset — the RN equivalent of web's `File` for a
 * verification document upload (title deed, ID, etc). */
export interface PickedDocument {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export function useAddLandDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ listingId, file, type }: { listingId: string; file: PickedDocument; type: string }) => {
      const form = new FormData();
      form.append('type', type);
      form.append('file', { uri: file.uri, name: file.fileName ?? 'document.jpg', type: file.mimeType ?? 'image/jpeg' } as unknown as Blob);
      const { data } = await api.post<{ data: BackendLandListing }>(`/land-listings/${listingId}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return mapListing(data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['land-listings'] }),
  });
}
