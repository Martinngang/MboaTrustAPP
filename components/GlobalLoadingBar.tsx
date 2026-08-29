import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

// A thin top progress bar that appears whenever any React Query
// query/mutation is in flight — the mobile equivalent of a browser's native
// loading spinner, which RN has no built-in substitute for. Global (mounted
// once in App.tsx) rather than per-screen so a background refetch on any
// screen gives the same, consistent feedback without every screen wiring
// its own isLoading indicator for network activity that isn't really "this
// screen's" loading state.
export function GlobalLoadingBar() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const active = isFetching > 0 || isMutating > 0;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      progress.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(progress, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    } else {
      progress.stopAnimation();
      progress.setValue(0);
    }
  }, [active, progress]);

  if (!active) return null;

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-200, 400] });

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: insets.top, left: 0, right: 0, height: 3, overflow: 'hidden', backgroundColor: 'transparent', zIndex: 999 }}
    >
      <Animated.View style={{ width: 160, height: 3, backgroundColor: colors.forest, transform: [{ translateX }] }} />
    </View>
  );
}
