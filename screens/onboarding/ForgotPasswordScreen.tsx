import { useState } from 'react';
import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingShell } from '../../components/OnboardingShell';
import { TextField } from '../../components/TextField';
import { InlineAlert } from '../../components/InlineAlert';
import { PillButton } from '../../components/PillButton';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { sendPasswordReset } from '../../api/firebaseAuth';
import { friendlyAuthError } from '../../api/authErrors';
import { useTranslation } from '../../i18n/useTranslation';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

// Ported from MboaTrustFrontend/src/screens/Onboarding.tsx's
// ForgotPasswordForm — sends Firebase's own hosted reset-password email,
// same as web.
export function ForgotPasswordScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError(t('forgotPassword.errorEmail'));
    setSending(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <OnboardingShell title={t('forgotPassword.checkInbox')}>
        <View style={{ alignItems: 'center', gap: 16 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.forest + '1F', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={24} color={colors.forest} />
          </View>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            {t('forgotPassword.sentTo')} <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink }}>{email}</Text>{t('forgotPassword.sentFollow')}
          </Text>
          <PillButton onPress={() => navigation.navigate('Login')} variant="secondary" fullWidth>
            {t('forgotPassword.backToSignIn')}
          </PillButton>
        </View>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell title={t('forgotPassword.title')} subtitle={t('forgotPassword.subtitle')}>
      <View style={{ gap: 14 }}>
        {error && <InlineAlert>{error}</InlineAlert>}
        <TextField
          label={t('forgotPassword.email')}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="send"
          onSubmitEditing={submit}
        />
        <PillButton onPress={submit} fullWidth disabled={sending} loading={sending}>
          {t('forgotPassword.sendLink')}
        </PillButton>
        <Text
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="button"
          style={{ fontFamily: FONT.sansSemiBold, color: colors.inkSubtle, fontSize: 12, textAlign: 'center' }}
        >
          {t('forgotPassword.backToSignIn')}
        </Text>
      </View>
    </OnboardingShell>
  );
}
