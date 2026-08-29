import { useState } from 'react';
import { View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingShell } from '../../components/OnboardingShell';
import { TextField } from '../../components/TextField';
import { PasswordField } from '../../components/PasswordField';
import { InlineAlert } from '../../components/InlineAlert';
import { PillButton } from '../../components/PillButton';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { signInWithEmail } from '../../api/firebaseAuth';
import { friendlyAuthError } from '../../api/authErrors';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

// Ported from MboaTrustFrontend/src/screens/Onboarding.tsx's
// LoginScreen/EmailLoginForm. No explicit post-success navigation here — the
// same AppContext auth-state listener that reacts to a fresh signup also
// reacts to sign-in, resolving the returning user straight to whatever
// destination resolveAuthDestination computes (home/role/profile), so a
// fully onboarded user lands on their dashboard immediately, never
// re-runs onboarding.
export function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const submit = async () => {
    setFormError('');
    if (!email || !password) return setFormError('Enter your email and password.');
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
    <OnboardingShell title="Welcome back" subtitle="Sign in with your email and password." showBack={navigation.canGoBack()}>
      <View style={{ gap: 14 }}>
        {formError && <InlineAlert>{formError}</InlineAlert>}
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <View>
          <PasswordField label="Password" value={password} onChangeText={setPassword} placeholder="Your password" autoComplete="current-password" />
          <Text
            onPress={() => navigation.navigate('ForgotPassword')}
            accessibilityRole="button"
            style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12, marginTop: 8 }}
          >
            Forgot password?
          </Text>
        </View>

        <PillButton onPress={submit} fullWidth disabled={signingIn} loading={signingIn}>
          Sign in
        </PillButton>

        <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, textAlign: 'center' }}>
          New to Mboa Trust?{' '}
          <Text style={{ color: colors.forest, fontFamily: FONT.sansSemiBold }} accessibilityRole="button" onPress={() => navigation.navigate('Language')}>
            Create account
          </Text>
        </Text>
      </View>
    </OnboardingShell>
  );
}
