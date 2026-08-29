import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';

// Ported from the `InlineAlert` used throughout web's Onboarding.tsx form
// screens — a persistent (not auto-dismissing) error banner for validation
// errors on the field/form itself, distinct from useToast() which is for
// transient action-result feedback.
export function InlineAlert({ children }: { children: string }) {
  const { statusTones } = useTheme();
  const { bg, text } = statusTones.error;
  return (
    <View style={{ backgroundColor: bg, borderRadius: 12, padding: 12 }}>
      <Text style={{ color: text, fontFamily: FONT.sans, fontSize: 13 }}>{children}</Text>
    </View>
  );
}
