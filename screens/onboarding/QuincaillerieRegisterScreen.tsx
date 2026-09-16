import { useRef, useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingShell } from '../../components/OnboardingShell';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { apiErrorMessage } from '../../api/client';
import { useUpsertSupplierProfileMutation } from '../../api/supplierProfiles';
import type { OnboardingStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'QuincaillerieRegister'>;

// Ported from MboaTrustFrontend/src/screens/QuincaillerieScreens.tsx's
// QuincaillerieRegistrationScreen — POST /supplier-profiles/me (backend
// renamed the Quincaillerie model/route to Supplier; the mobile-facing
// concept and field names are unchanged: businessName, address, region,
// registeredCategories, phone, paymentProvider, payoutPhoneNumber,
// verificationDocUploaded — see supplierProfileValidators.js). This creates
// a real pending application; it does NOT grant the 'supplier' roleType —
// that's an admin-approval-only action (see supplierProfileController.approve),
// so this screen's "done" state says "pending review", not "you're now a
// supplier". `route.params.wantsVerifier` carries forward when someone
// checked both the Quincaillerie and Verifier boxes on RoleScreen — "done"
// chains into VerifierRegister next instead of finishing onboarding, so
// neither application is silently dropped.
const CATEGORY_OPTIONS = ['Cement', 'Roofing', 'Plumbing', 'Electrical', 'Timber'];

export function QuincaillerieRegisterScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { show: showToast } = useToast();
  const { refresh } = useApp();
  const wantsVerifier = route.params?.wantsVerifier ?? false;
  const upsertProfile = useUpsertSupplierProfileMutation();
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('');
  const [phone, setPhone] = useState('');
  const [payoutPhoneNumber, setPayoutPhoneNumber] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const addressRef = useRef<TextInput>(null);
  const regionRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const payoutPhoneRef = useRef<TextInput>(null);

  const toggleCategory = (c: string) => setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const submit = async () => {
    if (!businessName.trim() || !region.trim()) {
      showToast({ title: t('quincaillerieRegister.missingDetails'), description: t('quincaillerieRegister.missingDetailsDesc'), tone: 'error' });
      return;
    }
    try {
      await upsertProfile.mutateAsync({
        businessName: businessName.trim(),
        address: address.trim(),
        region: region.trim(),
        categories,
        phone: phone.trim(),
        paymentProvider: 'mtn_momo',
        payoutPhoneNumber: payoutPhoneNumber.trim(),
        docUploaded: false,
      });
      setDone(true);
    } catch (err) {
      showToast({ title: t('quincaillerieRegister.registrationFailed'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  if (done) {
    return (
      <OnboardingShell title={t('quincaillerieRegister.applicationSubmitted')} showBack={false}>
        <View style={{ alignItems: 'center', gap: 16 }}>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
            {t('quincaillerieRegister.submittedDesc')}
          </Text>
          <PillButton onPress={() => (wantsVerifier ? navigation.navigate('VerifierRegister') : refresh())} fullWidth>
            {t('quincaillerieRegister.continueToDashboard')}
          </PillButton>
        </View>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell title={t('quincaillerieRegister.title')} subtitle={t('quincaillerieRegister.subtitle')}>
      <View style={{ gap: 14 }}>
        <TextField
          label={t('quincaillerieRegister.businessNameLabel')}
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="e.g. Douala Quincaillerie Centrale"
          autoCapitalize="words"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => addressRef.current?.focus()}
        />
        <TextField
          ref={addressRef}
          label={t('quincaillerieRegister.addressLabel')}
          value={address}
          onChangeText={setAddress}
          placeholder="Street, quarter"
          autoCapitalize="words"
          autoComplete="street-address"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => regionRef.current?.focus()}
        />
        <TextField
          ref={regionRef}
          label={t('quincaillerieRegister.regionLabel')}
          value={region}
          onChangeText={setRegion}
          placeholder="e.g. Littoral"
          autoCapitalize="words"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => phoneRef.current?.focus()}
        />
        <TextField
          ref={phoneRef}
          label={t('quincaillerieRegister.businessPhoneLabel')}
          value={phone}
          onChangeText={setPhone}
          placeholder="+237 6XX XXX XXX"
          keyboardType="phone-pad"
          autoComplete="tel"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => payoutPhoneRef.current?.focus()}
        />
        <TextField
          ref={payoutPhoneRef}
          label={t('quincaillerieRegister.payoutPhoneLabel')}
          value={payoutPhoneNumber}
          onChangeText={setPayoutPhoneNumber}
          placeholder="+237 6XX XXX XXX"
          keyboardType="phone-pad"
          autoComplete="tel"
          returnKeyType="done"
        />

        <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('quincaillerieRegister.categories')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORY_OPTIONS.map((c) => {
            const active = categories.includes(c);
            return (
              <Pressable
                key={c}
                onPress={() => toggleCategory(c)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: active ? colors.forest : colors.parchmentDark,
                  backgroundColor: active ? colors.forest + '14' : colors.surface,
                }}
              >
                <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? colors.forest : colors.inkMuted }}>{c}</Text>
              </Pressable>
            );
          })}
        </View>

        <PillButton onPress={submit} fullWidth disabled={upsertProfile.isPending} loading={upsertProfile.isPending} style={{ marginTop: 8 }}>
          {t('quincaillerieRegister.submitApplication')}
        </PillButton>
      </View>
    </OnboardingShell>
  );
}
