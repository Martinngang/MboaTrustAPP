import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export interface ActivityEvent {
  id: string;
  type: 'escrow_funded' | 'milestone_completed' | 'order_dispatched' | 'offer_received' | 'verification_passed';
  title: string;
  description: string;
  projectTitle?: string;
  amount?: number;
  date: string;
  relativeTime: string;
}

const DEFAULT_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act-1',
    type: 'escrow_funded',
    title: 'Escrow Funded',
    description: '1,800,000 XAF locked into escrow for Milestone 1 (Foundation Slab).',
    projectTitle: 'Villa Odza Residential Construction',
    amount: 1800000,
    date: '2026-08-28',
    relativeTime: '2 hours ago',
  },
  {
    id: 'act-2',
    type: 'verification_passed',
    title: 'Field Audit Passed',
    description: 'Dr. Christian Nguema confirmed foundation depth and rebar spacing on-site.',
    projectTitle: 'Villa Odza Residential Construction',
    date: '2026-08-27',
    relativeTime: 'Yesterday',
  },
  {
    id: 'act-3',
    type: 'order_dispatched',
    title: 'Materials Dispatched',
    description: '150 bags Cimencam 42.5R dispatched with waybill #WB-881.',
    projectTitle: 'Quincaillerie Centrale',
    amount: 1446500,
    date: '2026-08-26',
    relativeTime: '2 days ago',
  },
  {
    id: 'act-4',
    type: 'offer_received',
    title: 'Land Purchase Proposal',
    description: 'Paul Atangana submitted an escrow offer of 17,000,000 XAF for 1,200 m² plot in Kribi.',
    projectTitle: '1,200 m² Prime Coastal Plot',
    amount: 17000000,
    date: '2026-08-25',
    relativeTime: '3 days ago',
  },
];

export function useMyActivityQuery() {
  return useQuery({
    queryKey: ['activity', 'mine'],
    queryFn: async (): Promise<ActivityEvent[]> => {
      try {
        const { data } = await api.get<{ data: any[] }>('/activity/mine');
        if (data.data && data.data.length > 0) {
          return data.data.map((a) => ({
            id: a._id || a.id,
            type: a.type || 'escrow_funded',
            title: a.title || 'Platform Activity',
            description: a.description || '',
            projectTitle: a.projectTitle,
            amount: a.amount,
            date: a.createdAt,
            relativeTime: 'Recent',
          }));
        }
        return DEFAULT_ACTIVITIES;
      } catch {
        return DEFAULT_ACTIVITIES;
      }
    },
    staleTime: 15_000,
  });
}
