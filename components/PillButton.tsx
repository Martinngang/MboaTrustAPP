import { Pressable, View, Text, ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';

// Ported from MboaTrustFrontend/src/components/MobileLayout.tsx's PillButton —
// same 4 variants, same forest-green primary identity.
export type PillButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function PillButton({
  children,
  onPress,
  variant = 'primary',
  fullWidth,
  disabled,
  loading,
  style,
}: {
  children: string;
  onPress?: () => void;
  variant?: PillButtonVariant;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, statusTones } = useTheme();
  const styles: Record<PillButtonVariant, { background: string; color: string; borderColor: string; borderWidth: number }> = {
    primary: { background: colors.forest, color: '#fff', borderColor: colors.forest, borderWidth: 0 },
    secondary: { background: colors.parchment, color: colors.forest, borderColor: colors.parchmentDark, borderWidth: 1 },
    ghost: { background: 'transparent', color: colors.forest, borderColor: colors.forest, borderWidth: 1 },
    danger: { background: statusTones.error.bg, color: statusTones.error.text, borderColor: statusTones.error.bg, borderWidth: 1 },
  };
  const s = styles[variant];
  const isDisabled = disabled || loading;

  // All visual styling (background/border/padding/radius) lives on this
  // plain inner View, not on the Pressable itself. Pressable's `style` as a
  // `({pressed}) => [...]` function is known to be unreliable about which
  // style properties actually land in the native view on some RN/Android
  // combinations — a real, reported case of this was a solid backgroundColor
  // silently failing to render while everything else (text, borders) painted
  // fine, which is exactly what this looked like. A plain View's style prop
  // doesn't go through that codepath at all, so it can't hit the same bug.
  return (
    <Pressable onPress={onPress} disabled={isDisabled} accessibilityRole="button" accessibilityState={{ disabled: isDisabled }}>
      {({ pressed }) => (
        <View
          style={[
            {
              backgroundColor: s.background,
              borderColor: s.borderColor,
              borderWidth: s.borderWidth,
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: fullWidth ? 'stretch' : 'flex-start',
              opacity: isDisabled ? 0.4 : pressed ? 0.85 : 1,
              transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
            },
            style,
          ]}
        >
          {loading ? <ActivityIndicator color={s.color} size="small" /> : <Text style={{ color: s.color, fontFamily: FONT.sansSemiBold, fontSize: 14 }}>{children}</Text>}
        </View>
      )}
    </Pressable>
  );
}
