import { Pressable, Text, ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
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
  const styles: Record<PillButtonVariant, { background: string; color: string; borderColor?: string }> = {
    primary: { background: colors.forest, color: '#fff' },
    secondary: { background: colors.parchment, color: colors.forest, borderColor: colors.parchmentDark },
    ghost: { background: 'transparent', color: colors.forest, borderColor: colors.forest },
    danger: { background: statusTones.error.bg, color: statusTones.error.text, borderColor: statusTones.error.bg },
  };
  const s = styles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        {
          backgroundColor: s.background,
          borderColor: s.borderColor,
          borderWidth: s.borderColor ? 1 : 0,
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
      {loading ? (
        <ActivityIndicator color={s.color} size="small" />
      ) : (
        <Text style={{ color: s.color, fontFamily: FONT.sansSemiBold, fontSize: 14 }}>{children}</Text>
      )}
    </Pressable>
  );
}
