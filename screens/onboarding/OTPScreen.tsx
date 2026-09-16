import { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingShell } from '../../components/OnboardingShell';
import { PillButton } from '../../components/PillButton';
import { InlineAlert } from '../../components/InlineAlert';
import { PhoneRecaptchaModal } from '../../components/PhoneRecaptchaModal';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { confirmPhoneCode, startPhoneSignIn } from '../../api/firebaseAuth';
import { friendlyAuthError } from '../../api/authErrors';
import { getPendingPhone, getPendingPhoneConfirmation, setPendingPhoneConfirmation } from '../../api/phoneAuthState';
import { useTranslation } from '../../i18n/useTranslation';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'OTP'>;

// Ported from MboaTrustFrontend/src/screens/Onboarding.tsx's OTPScreen — same
// 6-digit code entry, same "no explicit navigation, the shared auth-state
// listener routes on success" behavior as email/Google. Drops web's
// "[Demo: tap to auto-fill]" shortcut (a testing convenience, not real
// functionality) and its static "Resend in 0:45" text in favor of a real
// resend that re-sends a fresh code.
export function OTPScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const phone = getPendingPhone();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const recaptchaRef = useRef<any>(null);

  const handleDigit = (i: number, val: string) => {
    const next = [...code];
    next[i] = val.slice(-1);
    setCode(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleVerify = async () => {
    const joined = code.join('');
    if (joined.length !== 6) return;
    const confirmation = getPendingPhoneConfirmation();
    if (!confirmation) {
      setError(t('otp.expiredSession'));
      return;
    }
    setError('');
    setVerifying(true);
    try {
      await confirmPhoneCode(confirmation, joined);
      setPendingPhoneConfirmation(null);
      // No explicit navigation — AppContext's Firebase auth-state listener
      // resolves destination (role/home/profile) and RootNavigator swaps
      // stacks automatically, same as email and Google sign-in.
    } catch (err) {
      setError(friendlyAuthError(err, t('otp.invalidCode')));
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!phone || !recaptchaRef.current) return;
    setError('');
    setResending(true);
    try {
      const confirmation = await startPhoneSignIn(phone, recaptchaRef.current);
      setPendingPhoneConfirmation(confirmation);
    } catch (err) {
      setError(friendlyAuthError(err, t('otp.resendFailed')));
    } finally {
      setResending(false);
    }
  };

  return (
    <OnboardingShell step={3} title={t('otp.title')} showBack={navigation.canGoBack()}
      subtitle={phone ? `${t('otp.subtitlePrefix')} ${phone}` : t('otp.subtitlePrefix')}
    >
      <PhoneRecaptchaModal ref={recaptchaRef} />

      {error ? <InlineAlert>{error}</InlineAlert> : null}

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 28, marginTop: 8 }}>
        {code.map((digit, i) => (
          <TextInput
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            value={digit}
            onChangeText={(val) => handleDigit(i, val)}
            keyboardType="number-pad"
            maxLength={1}
            style={{
              width: 44,
              height: 56,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: digit ? colors.forest : colors.parchmentDark,
              backgroundColor: digit ? colors.forest + '14' : colors.surface,
              textAlign: 'center',
              fontFamily: FONT.serifBold,
              fontSize: 22,
              color: colors.ink,
            }}
          />
        ))}
      </View>

      <PillButton onPress={handleVerify} fullWidth disabled={verifying} loading={verifying}>
        {t('otp.verifyAndContinue')}
      </PillButton>

      <View style={{ marginTop: 20, alignItems: 'center' }}>
        <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>
          {t('otp.didntReceive')}{' '}
          <Text
            onPress={resending ? undefined : handleResend}
            accessibilityRole="button"
            style={{ color: colors.forest, fontFamily: FONT.sansSemiBold }}
          >
            {resending ? t('otp.resending') : t('otp.resendCode')}
          </Text>
        </Text>
      </View>
    </OnboardingShell>
  );
}
