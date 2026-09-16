import { useQuery } from '@tanstack/react-query';
import {
  Folder, Clipboard, Lock, Camera, CheckCircle2, Flag, Home, Bell,
  type LucideIcon,
} from 'lucide-react-native';
import { api } from './client';

// Ported from MboaTrustFrontend/src/api/activity.ts. The previous version
// invented its own event taxonomy (escrow_funded, milestone_completed,
// order_dispatched, offer_received, verification_passed) that doesn't
// exist anywhere on the backend, and fell back to 4 hardcoded fake events
// (with specific fake names, amounts, and "2 hours ago"/"Yesterday" style
// timestamps that would only ever have been accurate on the day they were
// written) whenever the real feed came back empty or the request failed.
export type ActivityType =
  | 'milestone_approved' | 'milestone_disputed' | 'milestone_submitted'
  | 'project_funded' | 'project_created' | 'project_status_changed'
  | 'bid_placed' | 'listing_created' | 'offer_made';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  icon: LucideIcon;
  title: string;
  detail?: string;
  path?: string;
  time: string;
}

interface BackendActivityEvent {
  type: ActivityType;
  path?: string;
  createdAt: string;
  projectTitle?: string;
  milestoneName?: string;
  amount?: number;
  currency?: string;
  reason?: string;
}

function fmt(n: number, currency = 'XAF') {
  return `${currency} ${n.toLocaleString('fr-FR')}`;
}

function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  return `${weeks} weeks ago`;
}

const TITLES: Record<ActivityType, string> = {
  project_created: 'Project created',
  project_funded: 'Funds secured',
  milestone_submitted: 'Proof submitted',
  milestone_approved: 'Milestone approved',
  milestone_disputed: 'Dispute raised',
  project_status_changed: 'Project updated',
  bid_placed: 'Bid placed',
  listing_created: 'Land listing created',
  offer_made: 'Offer made',
};

function mapEvent(e: BackendActivityEvent, index: number): ActivityEvent {
  const isTenderProject = e.type === 'project_created' && Boolean(e.path?.startsWith('/contractor/'));
  const icon: LucideIcon =
    e.type === 'project_created' ? (isTenderProject ? Clipboard : Folder)
    : e.type === 'project_funded' ? Lock
    : e.type === 'milestone_submitted' ? Camera
    : e.type === 'milestone_approved' ? CheckCircle2
    : e.type === 'milestone_disputed' ? Flag
    : e.type === 'bid_placed' ? Clipboard
    : e.type === 'listing_created' ? Home
    : Bell;

  let detail: string | undefined;
  if (e.type === 'project_funded') detail = e.projectTitle ? `${fmt(e.amount ?? 0, e.currency)} moved into escrow for ${e.projectTitle}` : fmt(e.amount ?? 0, e.currency);
  else if (e.type === 'milestone_approved') detail = e.projectTitle && e.milestoneName ? `${e.milestoneName} — ${e.projectTitle} · ${fmt(e.amount ?? 0, e.currency)} released` : undefined;
  else if (e.type === 'milestone_submitted') detail = e.projectTitle && e.milestoneName ? `${e.milestoneName} — ${e.projectTitle}` : undefined;
  else if (e.type === 'milestone_disputed') detail = e.projectTitle ? `${e.reason} — ${e.projectTitle}` : e.reason;
  else if (e.type === 'bid_placed') detail = e.projectTitle ? `${fmt(e.amount ?? 0, e.currency)} for ${e.projectTitle}` : fmt(e.amount ?? 0, e.currency);
  else detail = e.projectTitle;

  return {
    id: `${e.type}-${e.createdAt}-${index}`,
    type: e.type,
    icon,
    title: e.type === 'project_created' && isTenderProject ? 'Tender posted' : TITLES[e.type],
    detail,
    path: e.path,
    time: formatRelativeTime(e.createdAt),
  };
}

/** Backend's activityService.js emits web route paths (see
 * MboaTrustBackend/src/services/activityService.js), not RN screen names —
 * this maps the small, fixed set of prefixes it actually produces to a real
 * mobile stack screen + params so tapping an event navigates somewhere real,
 * matching web's GlobalActivityScreen/RecentActivityWidget where every event
 * with a `path` is clickable (`disabled={!e.path}`). Web only ever generates
 * these 3 dynamic prefixes plus the static '/home'. */
export function resolveActivityRoute(path: string | undefined): { screen: string; params?: Record<string, string> } | null {
  if (!path) return null;
  if (path === '/home') return { screen: 'MainTabs' };
  const job = path.match(/^\/contractor\/job\/([^/]+)$/);
  if (job) return { screen: 'JobDetail', params: { jobId: job[1] } };
  const project = path.match(/^\/funder\/project\/([^/]+)$/);
  if (project) return { screen: 'ProjectDetail', params: { projectId: project[1] } };
  const listing = path.match(/^\/land\/listing\/([^/]+)$/);
  if (listing) return { screen: 'LandListingDetail', params: { listingId: listing[1] } };
  return null;
}

/** Real, per-user activity feed — every event is derived server-side from
 * this account's own Project/Bid/LandListing/Escrow/Dispute documents. */
export function useMyActivityQuery(enabled = true) {
  return useQuery({
    queryKey: ['activity', 'mine'],
    queryFn: async (): Promise<ActivityEvent[]> => {
      const { data } = await api.get<{ data: BackendActivityEvent[] }>('/activity/mine');
      return data.data.map(mapEvent);
    },
    enabled,
    staleTime: 10_000,
  });
}
