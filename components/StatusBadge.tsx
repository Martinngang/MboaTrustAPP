import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import type { StatusTone } from '../theme/tokens';

// Ported 1:1 from MboaTrustFrontend/src/components/MobileLayout.tsx's
// STATUS_MAP/StatusBadge — same statuses, same tone mapping, so a "released"
// milestone reads identically on web and mobile.
const STATUS_MAP: Record<string, { tone: StatusTone; label: string }> = {
  released: { tone: 'success', label: 'Released' },
  under_review: { tone: 'warning', label: 'Under review' },
  pending: { tone: 'neutral', label: 'Pending' },
  disputed: { tone: 'error', label: 'Disputed' },
  active: { tone: 'success', label: 'Active' },
  completed: { tone: 'info', label: 'Completed' },
  accepted: { tone: 'success', label: 'Accepted' },
  rejected: { tone: 'error', label: 'Rejected' },
  verified: { tone: 'success', label: 'Verified' },
  unverified: { tone: 'warning', label: 'Pending verification' },
  in_progress: { tone: 'warning', label: 'In progress' },
  submitted: { tone: 'success', label: 'Submitted' },
  flagged: { tone: 'error', label: 'Flagged' },
  approved: { tone: 'success', label: 'Approved' },
  open: { tone: 'success', label: 'Open' },
  awarded: { tone: 'info', label: 'Awarded' },
  closed: { tone: 'neutral', label: 'Closed' },
  resolved: { tone: 'success', label: 'Resolved' },
  requested: { tone: 'warning', label: 'Requested' },
  confirmed: { tone: 'info', label: 'Confirmed' },
  out_for_delivery: { tone: 'info', label: 'Out for delivery' },
  delivered: { tone: 'success', label: 'Delivered' },
  cancelled: { tone: 'neutral', label: 'Cancelled' },
  archived: { tone: 'neutral', label: 'Archived' },
  countered: { tone: 'warning', label: 'Countered' },
  declined: { tone: 'error', label: 'Declined' },
  withdrawn: { tone: 'neutral', label: 'Withdrawn' },
};

export function StatusBadge({ status }: { status: string }) {
  const { statusTones } = useTheme();
  const s = STATUS_MAP[status] ?? { tone: 'neutral' as const, label: status };
  const { bg, text } = statusTones[s.tone];
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' }}>
      <Text style={{ color: text, fontFamily: FONT.mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</Text>
    </View>
  );
}
