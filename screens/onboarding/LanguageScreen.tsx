import { View, Text, Pressable } from 'react-native';
import { Languages, ChevronRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingShell } from '../../components/OnboardingShell';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/useTranslation';
import { translations } from '../../i18n/translations';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Language'>;

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'ENGLISH' },
  { code: 'fr', name: 'Français', native: 'FRENCH' },
] as const;

// Ported 1:1 from MboaTrustFrontend/src/screens/Onboarding.tsx's
// LanguageScreen — step 1 of the same wizard (via OnboardingShell, same as
// every other onboarding screen), same copy, same behavior: tapping a
// language card navigates straight into Signup, there's no separate
// "Continue" button on web either. `showBack={false}` matches web exactly
// (this is the first step, nothing to go back to). Now also sets
// AppContext's `language` immediately — there's no backend user yet at this
// point in the flow to persist preferredLanguage onto, but every later
// onboarding screen (Login/Signup/ForgotPassword/Role/ProfileSetup) reads
// the same live `language` via useTranslation(), so the choice made here
// takes effect right away rather than only after the account exists.
export function LanguageScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { setLanguage } = useApp();
  const { t } = useTranslation();

  const pick = (code: 'en' | 'fr') => {
    setLanguage(code);
    navigation.navigate('Signup');
  };

  // Title/subtitle deliberately show both languages side by side, always —
  // there's no "current language" to translate into yet on the very first
  // screen of the app, so this stays fixed regardless of `language` state
  // (title in English, subtitle in French), matching web's identical choice.
  return (
    <OnboardingShell step={1} showBack={false} title={translations['language.title'].en} subtitle={translations['language.title'].fr}>
      <View style={{ gap: 14 }}>
        {LANGUAGES.map((l) => (
          <Pressable
            key={l.code}
            onPress={() => pick(l.code)}
            accessibilityRole="button"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              borderWidth: 2,
              borderColor: colors.parchmentDark,
              borderRadius: 18,
              padding: 18,
              backgroundColor: colors.surface,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center' }}>
              <Languages size={20} color={colors.forest} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 17 }}>{l.name}</Text>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' }}>
                {l.native}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.inkSubtle} />
          </Pressable>
        ))}

        <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 8 }}>
          {t('language.disclosure')}
        </Text>
      </View>
    </OnboardingShell>
  );
}
