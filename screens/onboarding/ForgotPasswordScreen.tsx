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
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

// Ported from MboaTrustFrontend/src/screens/Onboarding.tsx's
// ForgotPasswordForm — sends Firebase's own hosted reset-password email,
// same as web.
export function ForgotPasswordScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.');
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
      <OnboardingShell title="Check your inbox">
        <View style={{ alignItems: 'center', gap: 16 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.forest + '1F', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={24} color={colors.forest} />
          </View>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            We sent a password reset link to <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink }}>{email}</Text>. Follow it to choose a
            new password, then come back and sign in.
          </Text>
          <PillButton onPress={() => navigation.navigate('Login')} variant="secondary" fullWidth>
            Back to sign in
          </PillButton>
        </View>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell title="Reset your password" subtitle="Enter the email you signed up with and we'll send you a reset link.">
      <View style={{ gap: 14 }}>
        {error && <InlineAlert>{error}</InlineAlert>}
        <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" autoComplete="email" autoCapitalize="none" keyboardType="email-address" />
        <PillButton onPress={submit} fullWidth disabled={sending} loading={sending}>
          Send reset link
        </PillButton>
        <Text
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="button"
          style={{ fontFamily: FONT.sansSemiBold, color: colors.inkSubtle, fontSize: 12, textAlign: 'center' }}
        >
          Back to sign in
        </Text>
      </View>
    </OnboardingShell>
  );
}
