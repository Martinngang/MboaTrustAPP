import { View, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

// Ported from MboaTrustFrontend/src/components/MobileLayout.tsx's Card —
// 'default'/'elevated'/'glass'/'interactive' variants collapse to two real
// looks on native (no backdrop-blur on RN without extra native deps), which
// is a deliberate mobile adaptation, not a missing feature.
export type CardVariant = 'default' | 'elevated' | 'glass' | 'interactive';

export function Card({
  children,
  variant = 'default',
  onPress,
  style,
}: {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const base: ViewStyle = {
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: variant === 'elevated' ? 0 : 1,
    borderColor: colors.parchmentDark,
    ...(variant === 'elevated'
      ? { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 }
      : { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 }),
  };

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [base, { opacity: pressed ? 0.9 : 1 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
