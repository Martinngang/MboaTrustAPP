import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface PayoutMethod {
  _id: string;
  label: string;
  provider: 'mtn_momo' | 'orange_money';
  phoneNumber: string;
  isDefault: boolean;
}

export interface AddPayoutMethodPayload {
  label?: string;
  provider: 'mtn_momo' | 'orange_money';
  phoneNumber: string;
}

export function useAddPayoutMethodMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddPayoutMethodPayload) => {
      const { data } = await api.post<{ data: { payoutMethods: PayoutMethod[] } }>('/users/me/payout-methods', payload);
      return data.data.payoutMethods;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useRemovePayoutMethodMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (methodId: string) => {
      const { data } = await api.delete<{ data: { payoutMethods: PayoutMethod[] } }>(`/users/me/payout-methods/${methodId}`);
      return data.data.payoutMethods;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useSetDefaultPayoutMethodMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (methodId: string) => {
      const { data } = await api.patch<{ data: { payoutMethods: PayoutMethod[] } }>(`/users/me/payout-methods/${methodId}/default`);
      return data.data.payoutMethods;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}
