import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface FundProjectInput {
  projectId: string;
  amount: number;
  paymentMethod: 'mtn_momo' | 'orange_money' | 'stripe' | 'card';
  phoneNumber?: string;
}

export function useFundProjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, amount, paymentMethod, phoneNumber }: FundProjectInput) => {
      const { data } = await api.post(`/projects/${projectId}/fund`, {
        amount,
        paymentMethod,
        phoneNumber,
      });
      return data;
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export interface MilestoneApprovalInput {
  projectId: string;
  milestoneId: string;
  decision: 'approve' | 'reject' | 'changes_requested';
  reason?: string;
}

export function useMilestoneApprovalMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, milestoneId, decision, reason }: MilestoneApprovalInput) => {
      const { data } = await api.post(`/projects/${projectId}/milestones/${milestoneId}/approval`, {
        decision,
        reason,
      });
      return data;
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export interface MilestoneDisputeInput {
  projectId: string;
  milestoneId: string;
  reason: string;
  evidenceNotes?: string;
}

export function useMilestoneDisputeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, milestoneId, reason, evidenceNotes }: MilestoneDisputeInput) => {
      const { data } = await api.post(`/projects/${projectId}/milestones/${milestoneId}/dispute`, {
        reason,
        evidenceNotes,
      });
      return data;
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
