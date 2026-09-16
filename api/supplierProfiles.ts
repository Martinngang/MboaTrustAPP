import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// Ported 1:1 from MboaTrustFrontend/src/api/supplierProfiles.ts — same
// pending/verified/rejected display name, same field shapes, same query
// keys, so nothing about the caching/mapping behavior diverges from web.
export type SupplierVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface SupplierProfileRecord {
  id: string;
  ownerId: string;
  ownerName?: string;
  businessName: string;
  location: { lat: number; lng: number };
  address: string;
  region: string;
  registeredCategories: string[];
  verificationStatus: SupplierVerificationStatus;
  verificationDocUploaded: boolean;
  averageRating: number;
  completedOrderCount: number;
  phone: string;
  paymentProvider: 'mtn_momo' | 'orange_money';
  payoutPhoneNumber: string;
}

interface BackendSupplierProfile {
  _id: string;
  ownerId: { _id: string; fullName: string; email?: string } | string;
  businessName: string;
  location: { lat: number; lng: number };
  address: string;
  region: string;
  registeredCategories: string[];
  applicationStatus: 'pending' | 'approved' | 'rejected';
  verificationDocUploaded: boolean;
  averageRating: number;
  completedOrderCount: number;
  phone: string;
  paymentProvider: 'mtn_momo' | 'orange_money';
  payoutPhoneNumber: string;
}

const STATUS_MAP: Record<'pending' | 'approved' | 'rejected', SupplierVerificationStatus> = {
  pending: 'pending',
  approved: 'verified',
  rejected: 'rejected',
};

function mapSupplierProfile(doc: BackendSupplierProfile): SupplierProfileRecord {
  return {
    id: doc._id,
    ownerId: typeof doc.ownerId === 'object' ? doc.ownerId._id : doc.ownerId,
    ownerName: typeof doc.ownerId === 'object' ? doc.ownerId.fullName : undefined,
    businessName: doc.businessName,
    location: doc.location,
    address: doc.address,
    region: doc.region,
    registeredCategories: doc.registeredCategories,
    verificationStatus: STATUS_MAP[doc.applicationStatus],
    verificationDocUploaded: doc.verificationDocUploaded,
    averageRating: doc.averageRating,
    completedOrderCount: doc.completedOrderCount,
    phone: doc.phone,
    paymentProvider: doc.paymentProvider,
    payoutPhoneNumber: doc.payoutPhoneNumber,
  };
}

/** `null` means "no application yet" — a real, distinct state from any
 * verificationStatus value. Callers must handle it explicitly (e.g. show a
 * "Register as a supplier" prompt), never substitute placeholder data. */
export function useMySupplierProfileQuery(enabled = true) {
  return useQuery({
    queryKey: ['supplierProfile', 'me'],
    queryFn: async (): Promise<SupplierProfileRecord | null> => {
      const { data } = await api.get<{ data: BackendSupplierProfile | null }>('/supplier-profiles/me');
      return data.data ? mapSupplierProfile(data.data) : null;
    },
    enabled,
    staleTime: 10_000,
  });
}

export function useUpsertSupplierProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      businessName: string; address: string; region: string; categories: string[];
      phone: string; paymentProvider: 'mtn_momo' | 'orange_money'; payoutPhoneNumber: string; docUploaded: boolean;
    }) => {
      const { data } = await api.post<{ data: BackendSupplierProfile }>('/supplier-profiles/me', {
        businessName: input.businessName,
        address: input.address,
        region: input.region,
        registeredCategories: input.categories,
        phone: input.phone,
        paymentProvider: input.paymentProvider,
        payoutPhoneNumber: input.payoutPhoneNumber,
        verificationDocUploaded: input.docUploaded,
      });
      return mapSupplierProfile(data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplierProfile'] }),
  });
}

/** Authenticated, approved-only directory — funders/contractors browse this
 * to pick a store when requesting a materials milestone. */
export function useSupplierDirectoryQuery() {
  return useQuery({
    queryKey: ['supplierDirectory'],
    queryFn: async (): Promise<SupplierProfileRecord[]> => {
      const { data } = await api.get<{ data: BackendSupplierProfile[] }>('/supplier-profiles/directory');
      return data.data.map(mapSupplierProfile);
    },
    staleTime: 10_000,
  });
}
