import { VerifierTaskListContent } from '../VerifierTasksScreen';

// Reached via the global quick-action shortcut (see QuickActionModal's
// navigateToStack('VerifierDashboard')) rather than the bottom "Tasks" tab —
// same task list either way, so this renders the one shared implementation
// instead of maintaining a second copy that silently drifts from it (which
// is exactly what had happened here: different filter sets, missing
// pull-to-refresh, before this was unified).
export function VerifierDashboardScreen() {
  return <VerifierTaskListContent showBack />;
}
