import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Globe, Wrench, Home as HomeIcon, Check, Store, ShieldCheck } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingShell } from '../../components/OnboardingShell';
import { PillButton } from '../../components/PillButton';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useToast } from '../../components/Toast';
import { api, apiErrorMessage } from '../../api/client';
import { useTranslation } from '../../i18n/useTranslation';
import type { TranslationKey } from '../../i18n/translations';
import type { Role } from '../../context/AppContext';
import type { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Role'>;

// Ported from MboaTrustFrontend/src/screens/Onboarding.tsx's RoleScreen —
// same multi-select behavior, same "default to funder only if truly nothing
// picked" safety net, same funder/contractor/seller→land_seller backend
// mapping. Recipient is dropped from the selectable list entirely (see the
// user's explicit instruction — the actor is being retired from the
// product), and Quincaillerie's and Verifier's checkboxes mirror web
// exactly: neither is one of the roles POSTed to /users/me/roles (that
// endpoint's validator doesn't accept 'quincaillerie'/'verifier' — see
// docs/WEB_APP_MAP.md's Auth model section, both are trust-elevating,
// admin-approval-only actors), they only decide whether Profile setup
// chains into that actor's own registration application afterward. Neither
// one ever gets attached to, or falls back onto, the funder identity —
// AppContext's activeRole resolution treats a pending Quincaillerie/
// Verifier application as its own standalone state, never 'funder'.
const ROLES: { id: NonNullable<Role>; icon: LucideIcon; titleKey: TranslationKey; subKey: TranslationKey; accent: string }[] = [
  { id: 'funder', icon: Globe, titleKey: 'role.funder.title', subKey: 'role.funder.sub', accent: '#34A873' },
  { id: 'contractor', icon: Wrench, titleKey: 'role.contractor.title', subKey: 'role.contractor.sub', accent: '#3F6EA8' },
  { id: 'seller', icon: HomeIcon, titleKey: 'role.seller.title', subKey: 'role.seller.sub', accent: '#A8492F' },
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
  const { t } = useTranslation();
  const { show: showToast } = useToast();
  const [multi, setMulti] = useState<NonNullable<Role>[]>([]);
  const [wantsQuincaillerie, setWantsQuincaillerie] = useState(false);
  const [wantsVerifier, setWantsVerifier] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleRole = (r: NonNullable<Role>) => {
    setMulti((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  const proceed = async () => {
    // Someone who explicitly chose Quincaillerie-only or Verifier-only must
    // not be silently registered as a funder just because they didn't also
    // tick one of the three core roles — the exact bug web's own comment
    // documents fixing, now applying to both standalone applications.
    const chosen = multi.length > 0 ? multi : (wantsQuincaillerie || wantsVerifier) ? [] : (['funder'] as NonNullable<Role>[]);
    setSaving(true);
    try {
      await Promise.all(chosen.map((r) => api.post('/users/me/roles', { roleType: ROLE_TYPE[r] })));
    } catch (err) {
      showToast({ title: t('role.saveFailed'), description: apiErrorMessage(err, 'Please try again'), tone: 'error' });
      setSaving(false);
      return;
    }
    setSaving(false);
    navigation.navigate('Profile', { wantsQuincaillerie, wantsVerifier });
  };

  return (
    <OnboardingShell step={3} title={t('role.title')} subtitle={t('role.subtitle')}>
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
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{t(r.titleKey)}</Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, marginTop: 2 }}>{t(r.subKey)}</Text>
              </View>
              <Checkbox active={active} color={colors.forest} borderColor={colors.parchmentDark} />
            </Pressable>
          );
        })}

        <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>
          {t('role.otherBusiness')}
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
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{t('role.quincaillerie.title')}</Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, marginTop: 2 }}>
              {t('role.quincaillerie.sub')}
            </Text>
          </View>
          <Checkbox active={wantsQuincaillerie} color={colors.forest} borderColor={colors.parchmentDark} />
        </Pressable>

        <Pressable
          onPress={() => setWantsVerifier((w) => !w)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: wantsVerifier }}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 14,
            borderRadius: 18,
            padding: 16,
            backgroundColor: wantsVerifier ? '#2D4A2D14' : colors.surface,
            borderWidth: 2,
            borderColor: wantsVerifier ? colors.forest : colors.parchmentDark,
          }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#2D4A2D22', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} color="#2D4A2D" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{t('role.verifier.title')}</Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, marginTop: 2 }}>
              {t('role.verifier.sub')}
            </Text>
          </View>
          <Checkbox active={wantsVerifier} color={colors.forest} borderColor={colors.parchmentDark} />
        </Pressable>

        <PillButton onPress={proceed} fullWidth disabled={saving} loading={saving} style={{ marginTop: 12 }}>
          {t('role.continue')}
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
