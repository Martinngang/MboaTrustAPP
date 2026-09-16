import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../components/Screen';

/** Bottom padding for a FlatList's contentContainerStyle on a screen that
 * passes `scroll={false}` to `Screen` — mirrors the padding Screen.tsx itself
 * computes for its ScrollView, so list content still isn't hidden behind the
 * fixed bottom tab bar. */
export function useListBottomPadding() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + insets.bottom + 20;
}
