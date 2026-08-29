import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingShell } from '../../components/OnboardingShell';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { api, apiErrorMessage } from '../../api/client';
import type { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'QuincaillerieRegister'>;

// Ported from MboaTrustFrontend/src/screens/QuincaillerieScreens.tsx's
// QuincaillerieRegistrationScreen — POST /quincaillerie-profiles/me with the
// exact field names its validator expects (businessName, address, region,
// registeredCategories, phone, paymentProvider, payoutPhoneNumber,
// verificationDocUploaded — see quincaillerieProfileValidators.js). This
// creates a real pending application; it does NOT grant the 'quincaillerie'
// roleType — that's an admin-approval-only action (see
// quincaillerieProfileController.approve), so this screen's "done" state
// says "pending review", not "you're now a quincaillerie".
const CATEGORY_OPTIONS = ['Cement', 'Roofing', 'Plumbing', 'Electrical', 'Timber'];

export function QuincaillerieRegisterScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { show: showToast } = useToast();
  const { refresh } = useApp();
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('');
  const [phone, setPhone] = useState('');
  const [payoutPhoneNumber, setPayoutPhoneNumber] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const toggleCategory = (c: string) => setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const submit = async () => {
    if (!businessName.trim() || !region.trim()) {
      showToast({ title: 'Missing details', description: 'Business name and region are required.', tone: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/quincaillerie-profiles/me', {
        businessName: businessName.trim(),
        address: address.trim(),
        region: region.trim(),
        registeredCategories: categories,
        phone: phone.trim(),
        paymentProvider: 'mtn_momo',
        payoutPhoneNumber: payoutPhoneNumber.trim(),
        verificationDocUploaded: false,
      });
      setDone(true);
    } catch (err) {
      showToast({ title: 'Registration failed', description: apiErrorMessage(err, 'Please try again'), tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <OnboardingShell title="Application submitted" showBack={false}>
        <View style={{ alignItems: 'center', gap: 16 }}>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
            Your Quincaillerie registration is pending admin review. You'll be notified once it's approved and can start receiving material orders.
          </Text>
          <PillButton onPress={() => refresh()} fullWidth>
            Continue to dashboard
          </PillButton>
        </View>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell title="Register a Quincaillerie" subtitle="So funders can pay you directly for materials on a milestone.">
      <View style={{ gap: 14 }}>
        <TextField label="Business name" value={businessName} onChangeText={setBusinessName} placeholder="e.g. Douala Quincaillerie Centrale" />
        <TextField label="Address" value={address} onChangeText={setAddress} placeholder="Street, quarter" />
        <TextField label="Region" value={region} onChangeText={setRegion} placeholder="e.g. Littoral" />
        <TextField label="Business phone" value={phone} onChangeText={setPhone} placeholder="+237 6XX XXX XXX" keyboardType="phone-pad" />
        <TextField label="Payout phone (MoMo)" value={payoutPhoneNumber} onChangeText={setPayoutPhoneNumber} placeholder="+237 6XX XXX XXX" keyboardType="phone-pad" />

        <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Categories</Text>
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

        <PillButton onPress={submit} fullWidth disabled={submitting} loading={submitting} style={{ marginTop: 8 }}>
          Submit application
        </PillButton>
      </View>
    </OnboardingShell>
  );
}
