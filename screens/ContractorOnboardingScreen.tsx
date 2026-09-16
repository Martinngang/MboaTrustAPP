import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { PillButton } from '../components/PillButton';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useToast } from '../components/Toast';
import { api, apiErrorMessage } from '../api/client';
import { PROJECT_CATEGORIES } from '../inventoryTaxonomy';
import type { MainStackParamList } from '../navigation/types';
import { useTranslation } from '../i18n/useTranslation';

type Props = NativeStackScreenProps<MainStackParamList, 'ContractorOnboarding'>;

// Ported from MboaTrustFrontend/src/screens/AdditionalScreens.tsx's
// ContractorOnboardingScreen — self-service, reachable any time after
// signup (a funder/seller can become a contractor later too, exactly like
// web's comment on this flow notes), not part of the initial signup wizard.
// Same two real backend calls web makes: grant the role (idempotent —
// POST /users/me/roles is safe to call again if already held) then upsert
// the contractor profile itself. Categories unified onto the same sector
// taxonomy tender categories use (PROJECT_CATEGORIES) — this used to be a
// separate trade-skill list that could never match a tender's category in
// contractorMatchingService's scoring (30 of 100 points).
const TRADES = PROJECT_CATEGORIES;

export function ContractorOnboardingScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { show: showToast } = useToast();
  const [skills, setSkills] = useState<string[]>([]);
  const [region, setRegion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const toggleSkill = (s: string) => setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const finish = async () => {
    setSubmitting(true);
    try {
      // A funder/seller picked at signup can still become a contractor
      // later — make sure the role is actually on their account before the
      // profile upsert (contractor-only) would otherwise 403.
      await api.post('/users/me/roles', { roleType: 'contractor' });
      await api.put('/contractor-profiles/me', { categories: skills, regions: region ? [region] : [] });
      setDone(true);
    } catch (err) {
      showToast({ title: t('contractorOnboarding.failedToSave'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Screen header={<Header title={t('contractorOnboarding.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
            <Check size={28} color="#fff" />
          </View>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20, textAlign: 'center' }}>{t('contractorOnboarding.profileReady')}</Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            {t('contractorOnboarding.readyDesc')}
          </Text>
          <PillButton onPress={() => navigation.navigate('MainTabs')} fullWidth>
            {t('contractorOnboarding.goToDashboard')}
          </PillButton>
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title={t('contractorOnboarding.title')} back />}>
      <View style={{ padding: 20, gap: 16 }}>
        <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13 }}>{t('contractorOnboarding.whichTrades')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TRADES.map((t) => {
            const active = skills.includes(t);
            return (
              <Pressable
                key={t}
                onPress={() => toggleSkill(t)}
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
                <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? colors.forest : colors.inkMuted }}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('contractorOnboarding.regionYouWorkIn')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['Littoral', 'Centre', 'Ouest', 'Nord-Ouest', 'Sud-Ouest'].map((r) => (
            <Pressable
              key={r}
              onPress={() => setRegion(r)}
              accessibilityRole="radio"
              accessibilityState={{ checked: region === r }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: region === r ? colors.forest : colors.parchmentDark,
                backgroundColor: region === r ? colors.forest + '14' : colors.surface,
              }}
            >
              <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: region === r ? colors.forest : colors.inkMuted }}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <PillButton onPress={finish} fullWidth disabled={submitting} loading={submitting} style={{ marginTop: 8 }}>
          {t('contractorOnboarding.saveProfile')}
        </PillButton>
      </View>
    </Screen>
  );
}
