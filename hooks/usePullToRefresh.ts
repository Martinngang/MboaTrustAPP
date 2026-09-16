import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/** Drop-in pull-to-refresh for any screen: `<Screen {...usePullToRefresh()}>`.
 * Refetches every React Query currently active on screen (not the whole
 * cache) — React Query's own documented pattern for this exact gesture —
 * so a screen wiring this in never needs to know which of its own queries
 * exist or hand-collect their `refetch` functions. */
export function usePullToRefresh() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  };

  return { refreshing, onRefresh };
}
