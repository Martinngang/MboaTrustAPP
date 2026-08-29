import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { StatusTone } from '../theme/tokens';

export type NotifCategory = 'funding' | 'milestones' | 'marketplace' | 'verification' | 'messages';

export interface AppNotification {
  id: string;
  category: NotifCategory;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  stat?: { label: string; tone: StatusTone };
  path?: string;
}

interface BackendNotification {
  _id: string;
  type: string;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

function fmt(n: number): string {
  return 'XAF ' + n.toLocaleString('fr-FR');
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const STATUS_LABEL: Record<string, string> = {
  released: 'Released',
  approved: 'Approved',
  disputed: 'Disputed',
  under_review: 'Under review',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const STATUS_TONE: Record<string, StatusTone> = {
  released: 'success',
  approved: 'success',
  accepted: 'success',
  disputed: 'error',
  rejected: 'error',
  under_review: 'warning',
  withdrawn: 'neutral',
};

function describe(n: BackendNotification): {
  category: NotifCategory;
  title: string;
  body: string;
  stat?: { label: string; tone: StatusTone };
  path?: string;
} {
  const p = n.payload || {};
  const statusLabel = (s: unknown) => STATUS_LABEL[String(s)] ?? String(s);
  const statusTone = (s: unknown): StatusTone => STATUS_TONE[String(s)] ?? 'neutral';

  switch (n.type) {
    case 'project_funded':
      return {
        category: 'funding',
        title: 'Funds secured',
        body: 'Your contribution moved into escrow for this project.',
        stat: { label: fmt(Number(p.amount) || 0), tone: 'success' },
        path: p.projectId ? `ProjectDetail` : undefined,
      };
    case 'milestone_evidence_submitted':
      return {
        category: 'milestones',
        title: 'Proof submitted',
        body: 'Milestone evidence was submitted and is ready for your review.',
        path: p.projectId ? `MilestoneReview` : undefined,
      };
    case 'milestone_decision':
      return {
        category: 'milestones',
        title: 'Milestone update',
        body: `Milestone status changed to "${statusLabel(p.status).toLowerCase()}".`,
        stat: { label: statusLabel(p.status), tone: statusTone(p.status) },
        path: p.projectId ? `ProjectDetail` : undefined,
      };
    case 'bid_received':
      return {
        category: 'marketplace',
        title: 'New bid received',
        body: 'A contractor placed a bid on your tender.',
        path: p.projectId ? `TenderBids` : undefined,
      };
    case 'bid_status_changed':
      return {
        category: 'marketplace',
        title: 'Bid update',
        body: `Your bid was ${statusLabel(p.status).toLowerCase()}.`,
        stat: { label: statusLabel(p.status), tone: statusTone(p.status) },
        path: 'MyBids',
      };
    case 'bid_countered':
      return {
        category: 'marketplace',
        title: 'Counter-offer received',
        body: 'The other side proposed new terms on a bid negotiation — your turn to respond.',
        path: 'Negotiation',
      };
    case 'milestone_changes_requested':
      return {
        category: 'milestones',
        title: 'Corrections requested',
        body: typeof p.reason === 'string' ? `"${p.reason}"` : 'The funder asked for corrections before this milestone can be approved.',
        path: 'MilestoneSubmit',
      };
    case 'land_purchase_started':
      return {
        category: 'marketplace',
        title: 'Purchase started',
        body: 'A buyer started a purchase on your land listing.',
        path: 'LandDetail',
      };
    case 'verification_assigned':
      return {
        category: 'verification',
        title: 'New verification assignment',
        body: 'You have been assigned a new on-site verification task.',
        path: 'VerifierTasks',
      };
    case 'new_message':
      return {
        category: 'messages',
        title: 'New message',
        body: 'You have a new message.',
        path: 'Messages',
      };
    case 'dispute_raised':
      return {
        category: 'milestones',
        title: 'Dispute raised',
        body: 'A dispute was raised on one of your projects.',
        stat: { label: 'Disputed', tone: 'error' },
        path: 'Dispute',
      };
    case 'dispute_resolved':
      return {
        category: 'milestones',
        title: 'Dispute resolved',
        body: `Your dispute was marked "${statusLabel(p.status).toLowerCase()}".`,
        stat: { label: statusLabel(p.status), tone: statusTone(p.status) },
        path: 'Dispute',
      };
    default:
      return {
        category: 'messages',
        title: n.type.replace(/_/g, ' '),
        body: 'You have a new notification update.',
      };
  }
}

function mapNotification(n: BackendNotification): AppNotification {
  const { category, title, body, stat, path } = describe(n);
  return {
    id: n._id,
    category,
    title,
    body,
    stat,
    path,
    time: timeAgo(n.createdAt),
    unread: !n.read,
  };
}

export function useNotificationsQuery(enabled = true) {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<{ items: AppNotification[]; unreadCount: number }> => {
      try {
        const { data } = await api.get<{ data: BackendNotification[]; meta?: { unreadCount: number } }>('/notifications');
        const items = (data.data || []).map(mapNotification);
        const unreadCount = data.meta?.unreadCount ?? items.filter((i) => i.unread).length;
        return { items, unreadCount };
      } catch {
        return { items: [], unreadCount: 0 };
      }
    },
    enabled,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/notifications/read-all');
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
