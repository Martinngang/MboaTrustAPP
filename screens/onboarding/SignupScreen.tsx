import { useRef, useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingShell } from '../../components/OnboardingShell';
import { TextField } from '../../components/TextField';
import { PasswordField } from '../../components/PasswordField';
import { InlineAlert } from '../../components/InlineAlert';
import { PillButton } from '../../components/PillButton';
import { GoogleAuthButton } from '../../components/GoogleAuthButton';
import { PhoneRecaptchaModal } from '../../components/PhoneRecaptchaModal';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { signUpWithEmail, startPhoneSignIn } from '../../api/firebaseAuth';
import { friendlyAuthError } from '../../api/authErrors';
import { setPendingPhone, setPendingPhoneConfirmation, toE164 } from '../../api/phoneAuthState';
import { api } from '../../api/client';
import { useTranslation } from '../../i18n/useTranslation';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

function PhoneSignupForm({ navigation }: { navigation: Props['navigation'] }) {
  const { t } = useTranslation();
  const [value, setValue] = useState('+237 ');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const recaptchaRef = useRef<any>(null);

  const sendOtp = async () => {
    setError('');
    const e164 = toE164(value);
    setPendingPhone(e164);
    if (!recaptchaRef.current) return;
    setSending(true);
    try {
      const confirmation = await startPhoneSignIn(e164, recaptchaRef.current);
      setPendingPhoneConfirmation(confirmation);
      navigation.navigate('OTP');
    } catch (err) {
      setError(friendlyAuthError(err, t('signup.otpSendFailed')));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <PhoneRecaptchaModal ref={recaptchaRef} />
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      <TextField
        label={t('signup.phoneNumber')}
        value={value}
        onChangeText={setValue}
        placeholder="+237 6XX XXX XXX"
        keyboardType="phone-pad"
        returnKeyType="go"
        onSubmitEditing={sendOtp}
      />
      <PillButton onPress={sendOtp} fullWidth disabled={sending} loading={sending}>
        {t('signup.sendOtp')}
      </PillButton>
    </View>
  );
}

function EmailSignupForm({ navigation }: { navigation: Props['navigation'] }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!fullName.trim()) next.fullName = t('signup.errorFullName');
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = t('signup.errorEmail');
    if (password.length < 6) next.password = t('signup.errorPassword');
    if (confirm !== password) next.confirm = t('signup.errorConfirm');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    setFormError('');
    if (!validate()) return;
    setCreating(true);
    try {
      await signUpWithEmail(email.trim(), password, fullName.trim());
      // Explicit PATCH rather than relying on the ID token to pick up the new
      // displayName claim on its next refresh — see signUpWithEmail.
      await api.patch('/users/me', { fullName: fullName.trim() }).catch(() => {});
      // No explicit navigation: AppContext's Firebase auth-state listener
      // picks up the new session, resolves destination to 'role' (brand new
      // backend user, no roles yet), and RootNavigator swaps to the
      // onboarding stack automatically.
    } catch (err) {
      setFormError(friendlyAuthError(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      {formError && (
        <View>
          <InlineAlert>{formError}</InlineAlert>
          {formError.includes('already exists') && (
            <Pressable onPress={() => navigation.navigate('Login')} accessibilityRole="button" style={{ marginTop: 6 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>{t('signup.signInInstead')}</Text>
            </Pressable>
          )}
        </View>
      )}
      <TextField
        label={t('signup.fullName')}
        value={fullName}
        onChangeText={setFullName}
        placeholder="Marie-Claire Nkemdirim"
        error={errors.fullName}
        autoComplete="name"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <TextField
        ref={emailRef}
        label={t('signup.email')}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        error={errors.email}
        autoComplete="email"
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <PasswordField
        ref={passwordRef}
        label={t('signup.password')}
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
        error={errors.password}
        autoComplete="new-password"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <PasswordField
        ref={confirmRef}
        label={t('signup.confirmPassword')}
        value={confirm}
        onChangeText={setConfirm}
        placeholder={t('signup.confirmPasswordPlaceholder')}
        error={errors.confirm}
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <PillButton onPress={submit} fullWidth disabled={creating} loading={creating}>
        {t('signup.createAccount')}
      </PillButton>
    </View>
  );
}

// Ported from MboaTrustFrontend/src/screens/Onboarding.tsx's
// SignupScreen/EmailSignupForm/PhoneSignupForm — same validation rules, same
// backend sequencing (Firebase account first, then PATCH /users/me for the
// display name), and now the same Phone+OTP and Google methods too (via
// expo-auth-session + expo-firebase-recaptcha, RN's equivalents of web's DOM
// popup and DOM-bound reCAPTCHA — see components/GoogleAuthButton.tsx and
// components/PhoneRecaptchaModal.tsx).
export function SignupScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [googleError, setGoogleError] = useState('');

  return (
    <OnboardingShell
      step={2}
      title={t('signup.title')}
      subtitle={method === 'phone' ? t('signup.phoneSubtitle') : t('signup.subtitle')}
    >
      <View style={{ gap: 14 }}>
        <GoogleAuthButton onError={setGoogleError} />
        {googleError ? <InlineAlert>{googleError}</InlineAlert> : null}

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['phone', 'email'] as const).map((m) => {
            const active = method === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMethod(m)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? colors.forest : colors.parchmentDark,
                  backgroundColor: active ? colors.forest + '18' : colors.surface,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? colors.forest : colors.inkMuted }}>
                  {m === 'phone' ? t('signup.methodPhone') : t('signup.methodEmail')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {method === 'phone' ? <PhoneSignupForm navigation={navigation} /> : <EmailSignupForm navigation={navigation} />}

        <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, textAlign: 'center' }}>
          {t('signup.alreadyHaveAccount')}{' '}
          <Text style={{ color: colors.forest, fontFamily: FONT.sansSemiBold }} accessibilityRole="button" onPress={() => navigation.navigate('Login')}>
            {t('signup.signIn')}
          </Text>
        </Text>
      </View>
    </OnboardingShell>
  );
}
