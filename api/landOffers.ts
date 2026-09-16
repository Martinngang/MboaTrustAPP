import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// Ported from MboaTrustFrontend/src/api/landOffers.ts.
export type LandOfferStatus = 'pending' | 'countered' | 'accepted' | 'declined' | 'withdrawn';

export interface LandOffer {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  amount: number;
  counterAmount?: number;
  message: string;
  status: LandOfferStatus;
  createdAt: string;
}

interface BackendLandOffer {
  _id: string;
  listingId: string;
  buyerId: { _id: string; fullName: string } | string;
  offerAmount: number;
  message: string;
  status: LandOfferStatus;
  counterAmount: number | null;
  createdAt: string;
}

function mapOffer(doc: BackendLandOffer): LandOffer {
  return {
    id: doc._id,
    listingId: doc.listingId,
    buyerId: typeof doc.buyerId === 'object' ? doc.buyerId._id : doc.buyerId,
    buyerName: typeof doc.buyerId === 'object' ? doc.buyerId.fullName : 'Buyer',
    amount: doc.offerAmount,
    counterAmount: doc.counterAmount ?? undefined,
    message: doc.message,
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

/** No filter = every real offer the caller is a party to — as buyer, or as
 * the seller of the listing (server-scoped, see landOfferController.getAll). */
export function useLandOffersQuery(filter: { listingId?: string } = {}, enabled = true) {
  return useQuery({
    queryKey: ['landOffers', filter],
    queryFn: async (): Promise<LandOffer[]> => {
      const { data } = await api.get<{ data: BackendLandOffer[] }>('/land-offers', { params: filter });
      return data.data.map(mapOffer);
    },
    enabled,
    staleTime: 10_000,
  });
}

function invalidateOffers(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['landOffers'] });
  qc.invalidateQueries({ queryKey: ['land-listings'] });
}

export function useCreateLandOfferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ listingId, offerAmount, message }: { listingId: string; offerAmount: number; message?: string }) => {
      const { data } = await api.post<{ data: BackendLandOffer }>('/land-offers', { listingId, offerAmount, message });
      return mapOffer(data.data);
    },
    onSuccess: () => invalidateOffers(qc),
  });
}

export function useCounterOfferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ offerId, counterAmount }: { offerId: string; counterAmount: number }) => {
      const { data } = await api.post<{ data: BackendLandOffer }>(`/land-offers/${offerId}/counter`, { counterAmount });
      return mapOffer(data.data);
    },
    onSuccess: () => invalidateOffers(qc),
  });
}

/** Accepting creates a real Project (a land_purchase) at the agreed amount —
 * the buyer's next step is to fund it, same as web. */
export function useAcceptOfferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (offerId: string) => {
      const { data } = await api.post<{ data: { offer: BackendLandOffer; project: { _id: string; totalAmount: number } } }>(
        `/land-offers/${offerId}/accept`
      );
      return { offer: mapOffer(data.data.offer), projectId: data.data.project._id, agreedAmount: data.data.project.totalAmount };
    },
    onSuccess: () => {
      invalidateOffers(qc);
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeclineOfferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (offerId: string) => {
      const { data } = await api.post<{ data: BackendLandOffer }>(`/land-offers/${offerId}/decline`);
      return mapOffer(data.data);
    },
    onSuccess: () => invalidateOffers(qc),
  });
}

export function useWithdrawOfferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (offerId: string) => {
      const { data } = await api.post<{ data: BackendLandOffer }>(`/land-offers/${offerId}/withdraw`);
      return mapOffer(data.data);
    },
    onSuccess: () => invalidateOffers(qc),
  });
}
