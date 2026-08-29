import { useState } from 'react';
import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { TextField } from '../components/TextField';
import { PillButton } from '../components/PillButton';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useToast } from '../components/Toast';
import { api, apiErrorMessage } from '../api/client';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'VerifierRegister'>;

// Ported from MboaTrustFrontend/src/screens/AdditionalScreens.tsx's
// VerifierRegistrationScreen — self-service application from any role's
// Profile screen, exactly like web (verifier isn't in web's initial ROLES
// picker either). POST /verifier-profiles/me creates a real pending
// application; the 'verifier' roleType itself is admin-grant-only (see
// docs/WEB_APP_MAP.md), so this never claims the role was granted.
export function VerifierRegisterScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { show: showToast } = useToast();
  const [specialty, setSpecialty] = useState('');
  const [region, setRegion] = useState('');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!specialty.trim() || !region.trim()) {
      showToast({ title: 'Missing details', description: 'Specialty and region are required.', tone: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/verifier-profiles/me', {
        specialties: [specialty.trim()],
        regions: [region.trim()],
        bio: bio.trim(),
      });
      setDone(true);
    } catch (err) {
      showToast({ title: 'Application failed', description: apiErrorMessage(err, 'Please try again'), tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Screen header={<Header title="Become a Verifier" back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
            <Check size={28} color="#fff" />
          </View>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20, textAlign: 'center' }}>Application submitted</Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            An admin reviews every verifier application before granting access. You'll be notified once approved and start receiving assignments.
          </Text>
          <PillButton onPress={() => navigation.navigate('MainTabs')} fullWidth>
            Back to dashboard
          </PillButton>
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title="Become a Verifier" back />}>
      <View style={{ padding: 20, gap: 14 }}>
        <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, lineHeight: 20 }}>
          Verifiers visit project and land sites in person to confirm submitted evidence matches reality. This starts a real application — an admin
          reviews it before you're granted the verifier role.
        </Text>
        <TextField label="What do you verify?" value={specialty} onChangeText={setSpecialty} placeholder="e.g. Water & Sanitation, Electrical" />
        <TextField label="Region you cover" value={region} onChangeText={setRegion} placeholder="e.g. Littoral" />
        <TextField
          label="Relevant experience (optional)"
          value={bio}
          onChangeText={setBio}
          placeholder="e.g. 5 years as a site engineer"
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
        <PillButton onPress={submit} fullWidth disabled={submitting} loading={submitting}>
          Submit application
        </PillButton>
      </View>
    </Screen>
  );
}
