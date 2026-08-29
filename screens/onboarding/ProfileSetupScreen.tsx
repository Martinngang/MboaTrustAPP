import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { CreditCard, Check } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingShell } from '../../components/OnboardingShell';
import { TextField } from '../../components/TextField';
import { CountrySelect } from '../../components/CountrySelect';
import { PillButton } from '../../components/PillButton';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { getCurrentFirebaseUser } from '../../api/firebaseAuth';
import { api, apiErrorMessage } from '../../api/client';
import type { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Profile'>;

// Ported from MboaTrustFrontend/src/screens/Onboarding.tsx's
// ProfileSetupScreen — same two-step shape (personal info, then ID
// verification) and the same PATCH /users/me payload that sets
// onboardingCompleted: true. ID "upload" is the same UI-only mock web's
// version is today (see that screen's own idUploaded boolean) — the backend
// has no real ID-document endpoint wired to this step yet on either
// platform, so faking a real upload here would be inventing functionality
// that doesn't exist, not preserving it.
export function ProfileSetupScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { show: showToast } = useToast();
  const { refresh } = useApp();
  const wantsQuincaillerie = route.params?.wantsQuincaillerie ?? false;

  const [step, setStep] = useState<'info' | 'id'>('info');
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [city, setCity] = useState('');
  const [idUploaded, setIdUploaded] = useState(false);
  const [errors, setErrors] = useState<{ country?: string; city?: string }>({});
  const [finishing, setFinishing] = useState(false);

  const goToIdStep = () => {
    const next: { country?: string; city?: string } = {};
    if (!countryCode) next.country = 'Select your country of residence';
    else if (!city.trim()) next.city = 'Enter your city';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    setStep('id');
  };

  const finish = async () => {
    const fbUser = getCurrentFirebaseUser();
    const fallbackName = fbUser?.displayName || fbUser?.email?.split('@')[0] || 'New user';
    const fullName = name.trim() || fallbackName;
    setFinishing(true);
    try {
      await api.patch('/users/me', {
        fullName,
        onboardingCompleted: true,
        residenceCountry: countryCode,
        residenceCity: city.trim(),
      });
      if (wantsQuincaillerie) {
        navigation.navigate('QuincaillerieRegister');
      } else {
        await refresh();
      }
    } catch (err) {
      showToast({ title: 'Failed to save profile', description: apiErrorMessage(err, 'Please try again'), tone: 'error' });
    } finally {
      setFinishing(false);
    }
  };

  return (
    <OnboardingShell step={4} title="Set up your profile" showBack={step === 'id'} onBack={() => setStep('info')}>
      <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: colors.parchmentDark, borderRadius: 12, padding: 4, marginBottom: 20, backgroundColor: colors.parchment }}>
        {(['info', 'id'] as const).map((t) => (
          <View
            key={t}
            style={{
              flex: 1,
              borderRadius: 8,
              paddingVertical: 10,
              alignItems: 'center',
              backgroundColor: step === t ? colors.forest : 'transparent',
            }}
          >
            <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 13, color: step === t ? '#fff' : colors.inkMuted }}>
              {t === 'info' ? 'Personal info' : 'ID verification'}
            </Text>
          </View>
        ))}
      </View>

      {step === 'info' ? (
        <View style={{ gap: 14 }}>
          <TextField label="Full name" value={name} onChangeText={setName} placeholder="Marie-Claire Nkemdirim" autoComplete="name" />
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>Where do you live now?</Text>
          <CountrySelect value={countryCode} onChange={setCountryCode} error={errors.country} />
          <TextField label="City" value={city} onChangeText={setCity} placeholder="Douala" error={errors.city} />
          <PillButton onPress={goToIdStep} fullWidth>
            Next: ID verification
          </PillButton>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, lineHeight: 20 }}>
            Upload a government-issued ID (national card, passport, or residence permit). Your ID is reviewed within 24 hours.
          </Text>
          <Pressable
            onPress={() => setIdUploaded(true)}
            accessibilityRole="button"
            style={{
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: idUploaded ? colors.forest : colors.parchmentDark,
              borderRadius: 18,
              paddingVertical: 40,
              alignItems: 'center',
              gap: 10,
              backgroundColor: idUploaded ? colors.forest + '14' : colors.surface,
            }}
          >
            {idUploaded ? (
              <>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={22} color="#fff" />
                </View>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>ID uploaded successfully</Text>
              </>
            ) : (
              <>
                <CreditCard size={32} color={colors.inkSubtle} />
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13 }}>Tap to upload ID document</Text>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                  JPG, PNG or PDF
                </Text>
              </>
            )}
          </Pressable>

          <View style={{ backgroundColor: colors.amber + '14', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.amber + '4D' }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.amber, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Why we verify IDs
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 18 }}>
              ID verification protects all parties. Verified accounts can access escrow payments and contractor hiring.
            </Text>
          </View>

          <PillButton onPress={finish} fullWidth disabled={finishing} loading={finishing}>
            Complete setup
          </PillButton>
        </View>
      )}
    </OnboardingShell>
  );
}
