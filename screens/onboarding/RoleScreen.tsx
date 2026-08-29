import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Globe, Wrench, Home as HomeIcon, Check, Store } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingShell } from '../../components/OnboardingShell';
import { PillButton } from '../../components/PillButton';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useToast } from '../../components/Toast';
import { api, apiErrorMessage } from '../../api/client';
import type { Role } from '../../context/AppContext';
import type { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Role'>;

// Ported from MboaTrustFrontend/src/screens/Onboarding.tsx's RoleScreen —
// same multi-select behavior, same "default to funder only if truly nothing
// picked" safety net, same funder/contractor/seller→land_seller backend
// mapping. Recipient is dropped from the selectable list entirely (see the
// user's explicit instruction — the actor is being retired from the
// product), and Quincaillerie's checkbox mirrors web exactly: it is NOT one
// of the roles POSTed to /users/me/roles (that endpoint's validator doesn't
// accept 'quincaillerie' — see docs/WEB_APP_MAP.md's Auth model section),
// it only decides whether Profile setup chains into the Quincaillerie
// registration application afterward.
const ROLES: { id: NonNullable<Role>; icon: LucideIcon; title: string; sub: string; accent: string }[] = [
  { id: 'funder', icon: Globe, title: 'Diaspora Funder', sub: 'Fund projects, hire contractors, invest in land from abroad', accent: '#34A873' },
  { id: 'contractor', icon: Wrench, title: 'Local Contractor', sub: 'Bid on projects and get paid securely via escrow', accent: '#3F6EA8' },
  { id: 'seller', icon: HomeIcon, title: 'Land / Property Seller', sub: 'List land or property with verified documentation', accent: '#A8492F' },
];

const ROLE_TYPE: Record<NonNullable<Role>, string> = {
  funder: 'funder',
  contractor: 'contractor',
  seller: 'land_seller',
  quincaillerie: 'quincaillerie',
  verifier: 'verifier',
};

export function RoleScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { show: showToast } = useToast();
  const [multi, setMulti] = useState<NonNullable<Role>[]>([]);
  const [wantsQuincaillerie, setWantsQuincaillerie] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleRole = (r: NonNullable<Role>) => {
    setMulti((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  const proceed = async () => {
    // Someone who explicitly chose Quincaillerie-only must not be silently
    // registered as a funder just because they didn't also tick one of the
    // three core roles — the exact bug web's own comment documents fixing.
    const chosen = multi.length > 0 ? multi : wantsQuincaillerie ? [] : (['funder'] as NonNullable<Role>[]);
    setSaving(true);
    try {
      await Promise.all(chosen.map((r) => api.post('/users/me/roles', { roleType: ROLE_TYPE[r] })));
    } catch (err) {
      showToast({ title: 'Failed to save role', description: apiErrorMessage(err, 'Please try again'), tone: 'error' });
      setSaving(false);
      return;
    }
    setSaving(false);
    navigation.navigate('Profile', { wantsQuincaillerie });
  };

  return (
    <OnboardingShell step={3} title="How will you use Mboa Trust?" subtitle="You can hold multiple roles — select as many as apply.">
      <View style={{ gap: 12 }}>
        {ROLES.map((r) => {
          const Icon = r.icon;
          const active = multi.includes(r.id);
          return (
            <Pressable
              key={r.id}
              onPress={() => toggleRole(r.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 14,
                borderRadius: 18,
                padding: 16,
                backgroundColor: active ? r.accent + '14' : colors.surface,
                borderWidth: 2,
                borderColor: active ? colors.forest : colors.parchmentDark,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: r.accent + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={r.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{r.title}</Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, marginTop: 2 }}>{r.sub}</Text>
              </View>
              <Checkbox active={active} color={colors.forest} borderColor={colors.parchmentDark} />
            </Pressable>
          );
        })}

        <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>
          Also run a hardware or building-materials store?
        </Text>
        <Pressable
          onPress={() => setWantsQuincaillerie((w) => !w)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: wantsQuincaillerie }}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 14,
            borderRadius: 18,
            padding: 16,
            backgroundColor: wantsQuincaillerie ? '#7B4B2A14' : colors.surface,
            borderWidth: 2,
            borderColor: wantsQuincaillerie ? colors.forest : colors.parchmentDark,
          }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#7B4B2A22', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={20} color="#7B4B2A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>Quincaillerie / Materials Supplier</Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, marginTop: 2 }}>
              Get paid directly for materials on a funded milestone. Registration and admin verification happen after this step.
            </Text>
          </View>
          <Checkbox active={wantsQuincaillerie} color={colors.forest} borderColor={colors.parchmentDark} />
        </Pressable>

        <PillButton onPress={proceed} fullWidth disabled={saving} loading={saving} style={{ marginTop: 12 }}>
          Continue
        </PillButton>
      </View>
    </OnboardingShell>
  );
}

function Checkbox({ active, color, borderColor }: { active: boolean; color: string; borderColor: string }) {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: active ? color : borderColor,
        backgroundColor: active ? color : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {active && <Check size={12} color="#fff" strokeWidth={3} />}
    </View>
  );
}
