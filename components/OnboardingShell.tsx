import { View, Text, Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from './Screen';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';

// Mobile adaptation of MboaTrustFrontend/src/components/OnboardingShell.tsx —
// same step-progress-bar + title/subtitle pattern, but as a single focused
// column (web's desktop split-rail brand panel doesn't translate to a phone
// screen, so it's dropped rather than squeezed in).
export const ONBOARDING_STEPS = ['Language', 'Account', 'Role', 'Profile'] as const;

export function OnboardingShell({
  step,
  title,
  subtitle,
  showBack = true,
  onBack,
  children,
}: {
  step?: number;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();

  return (
    <Screen>
      <View style={{ padding: 20, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', height: 32 }}>
          {showBack && canGoBack && (
            <Pressable
              onPress={onBack ?? (() => navigation.goBack())}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={12}
              style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronLeft size={22} color={colors.inkSubtle} />
            </Pressable>
          )}
        </View>

        {step !== undefined && (
          <View style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {ONBOARDING_STEPS.map((_, i) => (
                <View key={i} style={{ flex: 1, height: 4, borderRadius: 999, backgroundColor: colors.parchmentDark, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: i < step ? '100%' : '0%', backgroundColor: colors.forest }} />
                </View>
              ))}
            </View>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>
              Step {step} of {ONBOARDING_STEPS.length} — {ONBOARDING_STEPS[step - 1]}
            </Text>
          </View>
        )}

        <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 26, marginTop: 8 }}>{title}</Text>
        {subtitle && <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 14, marginTop: 8, lineHeight: 20 }}>{subtitle}</Text>}

        <View style={{ marginTop: 24 }}>{children}</View>
      </View>
    </Screen>
  );
}
