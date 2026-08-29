import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingShell } from '../../components/OnboardingShell';
import { TextField } from '../../components/TextField';
import { PasswordField } from '../../components/PasswordField';
import { InlineAlert } from '../../components/InlineAlert';
import { PillButton } from '../../components/PillButton';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { signUpWithEmail } from '../../api/firebaseAuth';
import { friendlyAuthError } from '../../api/authErrors';
import { api } from '../../api/client';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

// Ported from MboaTrustFrontend/src/screens/Onboarding.tsx's
// SignupScreen/EmailSignupForm — same validation rules, same backend
// sequencing (Firebase account first, then PATCH /users/me for the display
// name). Google/Phone tabs are dropped: web offers them too, but Google
// needs a platform-registered OAuth client and Phone needs a DOM-bound
// reCAPTCHA — neither has a real RN equivalent available here (see
// api/firebaseAuth.ts's comment). Email is fully real end-to-end.
export function SignupScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!fullName.trim()) next.fullName = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address.';
    if (password.length < 6) next.password = 'Use at least 6 characters.';
    if (confirm !== password) next.confirm = "Passwords don't match.";
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
    <OnboardingShell step={2} title="Create your account" subtitle="Sign up with an email and password — perfect if you're funding from abroad.">
      <View style={{ gap: 14 }}>
        {formError && (
          <View>
            <InlineAlert>{formError}</InlineAlert>
            {formError.includes('already exists') && (
              <Pressable onPress={() => navigation.navigate('Login')} accessibilityRole="button" style={{ marginTop: 6 }}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>Sign in instead</Text>
              </Pressable>
            )}
          </View>
        )}
        <TextField
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Marie-Claire Nkemdirim"
          error={errors.fullName}
          autoComplete="name"
        />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          error={errors.email}
          autoComplete="email"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <PasswordField label="Password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" error={errors.password} autoComplete="new-password" />
        <PasswordField label="Confirm password" value={confirm} onChangeText={setConfirm} placeholder="Re-enter your password" error={errors.confirm} autoComplete="new-password" />

        <PillButton onPress={submit} fullWidth disabled={creating} loading={creating}>
          Create account
        </PillButton>

        <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, textAlign: 'center' }}>
          Already have an account?{' '}
          <Text style={{ color: colors.forest, fontFamily: FONT.sansSemiBold }} accessibilityRole="button" onPress={() => navigation.navigate('Login')}>
            Sign in
          </Text>
        </Text>
      </View>
    </OnboardingShell>
  );
}
