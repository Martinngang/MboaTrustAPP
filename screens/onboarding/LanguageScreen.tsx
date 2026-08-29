import { View, Text, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { PillButton } from '../../components/PillButton';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Language'>;

// Ported from MboaTrustFrontend/src/screens/Onboarding.tsx's LanguageScreen —
// en/fr only, cosmetic choice (backend/UI copy stays English either way for
// now, matching web's own "French currently covers this welcome flow only"
// caveat). Continues into Signup, not a role picker — role selection now
// only happens after a real account exists (see navigation/RootNavigator).
export function LanguageScreen({ navigation }: Props) {
  const { colors } = useTheme();

  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 32 }}>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
            Mboa Trust
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 26, textAlign: 'center' }}>
            Choose your language
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center' }}>
            Choisissez votre langue
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          {[
            { code: 'en', label: 'English', native: 'ENGLISH' },
            { code: 'fr', label: 'Français', native: 'FRENCH' },
          ].map((l) => (
            <Pressable
              key={l.code}
              onPress={() => navigation.navigate('Signup')}
              accessibilityRole="button"
              style={{
                borderWidth: 2,
                borderColor: colors.parchmentDark,
                borderRadius: 16,
                padding: 18,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>{l.label}</Text>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, letterSpacing: 1, marginTop: 2 }}>
                {l.native}
              </Text>
            </Pressable>
          ))}
        </View>

        <PillButton onPress={() => navigation.navigate('Signup')} fullWidth>
          Continue
        </PillButton>
      </View>
    </Screen>
  );
}
