import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// Ported from MboaTrustFrontend/src/api/landVisits.ts. Previously, mobile's
// `useScheduleVisitMutation` (in the old api/land.ts) posted
// { listingId, date, timeSlot, visitorPhone, notes } to /visit-requests —
// none of those fields match the real validator, which requires
// `proposedDates: Date[]` (a buyer proposes one or more candidate dates,
// the seller picks/confirms one) and has no concept of a time slot or a
// separate visitor phone at all. That mutation would have 400'd every time.
export type VisitRequestStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';

export interface VisitRequest {
  id: string;
  listingId: string;
  requestedBy: string;
  requestedByName: string;
  proposedDates: string[];
  confirmedDate: string | null;
  status: VisitRequestStatus;
  notes: string;
}

interface BackendVisitRequest {
  _id: string;
  listingId: string;
  requestedBy: { _id: string; fullName: string } | string;
  proposedDates: string[];
  confirmedDate: string | null;
  status: VisitRequestStatus;
  notes: string;
}

function mapVisitRequest(doc: BackendVisitRequest): VisitRequest {
  return {
    id: doc._id,
    listingId: doc.listingId,
    requestedBy: typeof doc.requestedBy === 'object' ? doc.requestedBy._id : doc.requestedBy,
    requestedByName: typeof doc.requestedBy === 'object' ? doc.requestedBy.fullName : 'Buyer',
    proposedDates: doc.proposedDates,
    confirmedDate: doc.confirmedDate,
    status: doc.status,
    notes: doc.notes,
  };
}

/** No filter = every real visit request the caller is a party to — as the
 * buyer who asked, or the seller of the listing (server-scoped). */
export function useVisitRequestsQuery(filter: { listingId?: string } = {}) {
  return useQuery({
    queryKey: ['visitRequests', filter],
    queryFn: async (): Promise<VisitRequest[]> => {
      const { data } = await api.get<{ data: BackendVisitRequest[] }>('/visit-requests', { params: filter });
      return data.data.map(mapVisitRequest);
    },
    staleTime: 10_000,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['visitRequests'] });
}

export function useRequestVisitMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ listingId, proposedDates, notes }: { listingId: string; proposedDates: string[]; notes?: string }) => {
      const { data } = await api.post<{ data: BackendVisitRequest }>('/visit-requests', { listingId, proposedDates, notes });
      return mapVisitRequest(data.data);
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useConfirmVisitMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ visitId, confirmedDate }: { visitId: string; confirmedDate: string }) => {
      const { data } = await api.post<{ data: BackendVisitRequest }>(`/visit-requests/${visitId}/confirm`, { confirmedDate });
      return mapVisitRequest(data.data);
    },
    onSuccess: () => invalidate(qc),
  });
}

function useVisitAction(action: 'complete' | 'cancel') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (visitId: string) => {
      const { data } = await api.post<{ data: BackendVisitRequest }>(`/visit-requests/${visitId}/${action}`);
      return mapVisitRequest(data.data);
    },
    onSuccess: () => invalidate(qc),
  });
}

export const useCompleteVisitMutation = () => useVisitAction('complete');
export const useCancelVisitMutation = () => useVisitAction('cancel');
