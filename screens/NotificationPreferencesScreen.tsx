import { View, Text, Switch, Pressable } from 'react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { useToast } from '../components/Toast';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import {
  useNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  type NotificationChannelPrefs,
} from '../api/notificationPreferences';
import { apiErrorMessage } from '../api/client';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translations';

interface PrefRow {
  key: string;
  labelKey: TranslationKey;
  subKey: TranslationKey;
  defaults: NotificationChannelPrefs;
}

// Same six categories the backend defines (utils/notificationCategories.js)
// — kept in sync deliberately so every category here is real and settable.
const ROWS: PrefRow[] = [
  { key: 'milestones', labelKey: 'notifPrefs.milestonesLabel', subKey: 'notifPrefs.milestonesSub', defaults: { push: true, email: true } },
  { key: 'bids', labelKey: 'notifPrefs.bidsLabel', subKey: 'notifPrefs.bidsSub', defaults: { push: true, email: false } },
  { key: 'disputes', labelKey: 'notifPrefs.disputesLabel', subKey: 'notifPrefs.disputesSub', defaults: { push: true, email: true } },
  { key: 'messages', labelKey: 'notifPrefs.messagesLabel', subKey: 'notifPrefs.messagesSub', defaults: { push: true, email: false } },
  { key: 'land', labelKey: 'notifPrefs.landLabel', subKey: 'notifPrefs.landSub', defaults: { push: true, email: false } },
  { key: 'marketing', labelKey: 'notifPrefs.marketingLabel', subKey: 'notifPrefs.marketingSub', defaults: { push: false, email: false } },
];

/** Granular per-type, per-channel notification control, backed by the real
 * NotificationPreference document — replaces the previous local-state-only
 * screen, whose 4 switches (SMS/WhatsApp alerts) didn't correspond to any
 * real backend category and whose "Save" never persisted anything. */
export function NotificationPreferencesScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { show: showToast } = useToast();
  const { data: prefs } = useNotificationPreferencesQuery();
  const updatePrefs = useUpdateNotificationPreferencesMutation();

  const toggle = async (key: string, channel: 'push' | 'email') => {
    const current = prefs?.[key] ?? ROWS.find((r) => r.key === key)!.defaults;
    try {
      await updatePrefs.mutateAsync({ [key]: { ...current, [channel]: !current[channel] } });
    } catch (err) {
      showToast({ title: t('notifPrefs.failedToUpdate'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  const disableAllEmail = async () => {
    const patch = Object.fromEntries(ROWS.map((r) => [r.key, { ...(prefs?.[r.key] ?? r.defaults), email: false }]));
    try {
      await updatePrefs.mutateAsync(patch);
      showToast({ title: t('notifPrefs.emailDisabled'), tone: 'success' });
    } catch (err) {
      showToast({ title: t('notifPrefs.failedToUpdatePlural'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  return (
    <Screen header={<Header title={t('notifPrefs.title')} subtitle={t('notifPrefs.subtitle')} back />}>
      <View style={{ padding: 16, gap: 14 }}>
        <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
          {t('notifPrefs.intro')}
        </Text>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.parchmentDark }}>
            <View style={{ flex: 1 }} />
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, width: 50, textAlign: 'center' }}>
              {t('notifPrefs.push')}
            </Text>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, width: 55, textAlign: 'center' }}>
              {t('notifPrefs.email')}
            </Text>
          </View>
          {ROWS.map((r, i) => {
            const p = prefs?.[r.key] ?? r.defaults;
            return (
              <View
                key={r.key}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderBottomWidth: i < ROWS.length - 1 ? 1 : 0,
                  borderBottomColor: colors.parchmentDark,
                }}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>{t(r.labelKey)}</Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11, marginTop: 1 }}>{t(r.subKey)}</Text>
                </View>
                <View style={{ width: 50, alignItems: 'center' }}>
                  <Switch value={p.push} onValueChange={() => toggle(r.key, 'push')} trackColor={{ false: colors.parchmentDark, true: colors.forest }} />
                </View>
                <View style={{ width: 55, alignItems: 'center' }}>
                  <Switch value={p.email} onValueChange={() => toggle(r.key, 'email')} trackColor={{ false: colors.parchmentDark, true: colors.forest }} />
                </View>
              </View>
            );
          })}
        </Card>

        <Pressable onPress={disableAllEmail} style={{ alignSelf: 'flex-start' }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.inkMuted, fontSize: 12 }}>
            {t('notifPrefs.turnOffAllEmail')}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
