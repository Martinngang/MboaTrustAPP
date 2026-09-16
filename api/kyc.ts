import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

/** Transactions above this amount are blocked pending identity verification.
 * Client-side gate only — the backend has no matching server-side threshold
 * to sync to. */
export const KYC_LARGE_TXN_THRESHOLD = 1000000;

/** Real account state (User.kycStatus) — no separate KYC-case model on the
 * backend, and no admin review step: verification runs synchronously
 * against Smile Identity inside POST /kyc/verify and the result is written
 * straight onto the user. */
export function useMyKycStatusQuery() {
  return useQuery({
    queryKey: ['me', 'kycStatus'],
    queryFn: async (): Promise<KycStatus> => {
      const { data } = await api.get<{ data: { kycStatus: KycStatus } }>('/users/me');
      return data.data.kycStatus;
    },
    staleTime: 10_000,
  });
}

export function useUploadKycDocumentMutation() {
  return useMutation({
    mutationFn: async (file: { uri: string; fileName?: string | null; mimeType?: string | null }): Promise<string> => {
      const form = new FormData();
      form.append('file', {
        uri: file.uri,
        name: file.fileName ?? 'document.jpg',
        type: file.mimeType ?? 'image/jpeg',
      } as unknown as Blob);
      const { data } = await api.post<{ data: { url: string } }>('/users/me/documents', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data.url;
    },
  });
}

export interface KycResult {
  verified: boolean;
  resultText: string | null;
  confidenceValue: string | null;
}

/** Two real steps, not three — the backend's Smile Identity Basic KYC job
 * verifies an ID number against the issuing authority's records; it has no
 * selfie/facial-match capability, so that step doesn't correspond to
 * anything the backend can actually check. */
export function useSubmitKycMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { idType: string; idNumber: string; country?: string; documentUrl?: string }): Promise<KycResult> => {
      const { data } = await api.post<{ data: { user: unknown; kycResult: KycResult } }>('/kyc/verify', input);
      return data.data.kycResult;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me', 'kycStatus'] }),
  });
}
