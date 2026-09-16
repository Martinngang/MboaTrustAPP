import { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
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
import { signInWithEmail, startPhoneSignIn } from '../../api/firebaseAuth';
import { friendlyAuthError } from '../../api/authErrors';
import { setPendingPhone, setPendingPhoneConfirmation, toE164 } from '../../api/phoneAuthState';
import { useTranslation } from '../../i18n/useTranslation';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

function PhoneLoginForm({ navigation }: { navigation: Props['navigation'] }) {
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
      setError(friendlyAuthError(err, t('login.otpSendFailed')));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <PhoneRecaptchaModal ref={recaptchaRef} />
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      <TextField
        label={t('login.phoneNumber')}
        value={value}
        onChangeText={setValue}
        placeholder="+237 6XX XXX XXX"
        keyboardType="phone-pad"
        returnKeyType="go"
        onSubmitEditing={sendOtp}
      />
      <PillButton onPress={sendOtp} fullWidth disabled={sending} loading={sending}>
        {t('login.sendOtp')}
      </PillButton>
    </View>
  );
}

function EmailLoginForm({ navigation }: { navigation: Props['navigation'] }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const submit = async () => {
    setFormError('');
    if (!email || !password) return setFormError(t('login.missingFields'));
    setSigningIn(true);
    try {
      await signInWithEmail(email.trim(), password);
    } catch (err) {
      setFormError(friendlyAuthError(err));
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      {formError && <InlineAlert>{formError}</InlineAlert>}
      <TextField
        label={t('login.email')}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <View>
        <PasswordField
          ref={passwordRef}
          label={t('login.password')}
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          autoComplete="current-password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <Text
          onPress={() => navigation.navigate('ForgotPassword')}
          accessibilityRole="button"
          style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12, marginTop: 8 }}
        >
          {t('login.forgotPassword')}
        </Text>
      </View>

      <PillButton onPress={submit} fullWidth disabled={signingIn} loading={signingIn}>
        {t('login.signIn')}
      </PillButton>
    </View>
  );
}

// Ported from MboaTrustFrontend/src/screens/Onboarding.tsx's
// LoginScreen/EmailLoginForm/PhoneLoginForm, now with the same Phone+OTP and
// Google methods too (see SignupScreen.tsx's header comment for why RN needs
// different underlying mechanics than web's DOM popup/reCAPTCHA for these).
// No explicit post-success navigation on any of the three — the same
// AppContext auth-state listener that reacts to a fresh signup also reacts
// to sign-in, resolving the returning user straight to whatever destination
// resolveAuthDestination computes (home/role/profile).
export function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [googleError, setGoogleError] = useState('');

  return (
    <OnboardingShell
      title={t('login.title')}
      subtitle={method === 'phone' ? t('login.phoneSubtitle') : t('login.subtitle')}
      showBack={navigation.canGoBack()}
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
                  {m === 'phone' ? t('login.methodPhone') : t('login.methodEmail')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {method === 'phone' ? <PhoneLoginForm navigation={navigation} /> : <EmailLoginForm navigation={navigation} />}

        <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, textAlign: 'center' }}>
          {t('login.newToApp')}{' '}
          <Text style={{ color: colors.forest, fontFamily: FONT.sansSemiBold }} accessibilityRole="button" onPress={() => navigation.navigate('Language')}>
            {t('login.createAccount')}
          </Text>
        </Text>
      </View>
    </OnboardingShell>
  );
}
