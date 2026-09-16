import { useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RefreshCw } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import {
  usePooledContributionsQuery,
  usePauseRecurringMutation,
  useResumeRecurringMutation,
  useCancelRecurringMutation,
} from '../../api/pooledFunding';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';
import type { TranslationKey } from '../../i18n/translations';

function frequencyLabel(days: number | null, t: (k: TranslationKey) => string): string {
  if (days === 7) return t('manageRecurring.week');
  if (days === 30) return t('manageRecurring.month');
  if (days === 90) return t('manageRecurring.quarter');
  return `${days ?? '?'} ${t('manageRecurring.days')}`;
}

export function ManageRecurringScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const { user } = useApp();

  const { data: allContributions, isLoading } = usePooledContributionsQuery({ contributorId: user?._id });
  // A cancelled pledge flips isRecurring back to false server-side —
  // filtering on it alone is enough to drop cancelled ones from this list.
  const recurring = (allContributions || []).filter((c) => c.isRecurring);

  const pauseRecurring = usePauseRecurringMutation();
  const resumeRecurring = useResumeRecurringMutation();
  const cancelRecurring = useCancelRecurringMutation();
  const [actingOn, setActingOn] = useState<string | null>(null);

  const act = async (mutation: typeof pauseRecurring | typeof resumeRecurring | typeof cancelRecurring, id: string, verb: string) => {
    setActingOn(id);
    try {
      await mutation.mutateAsync(id);
    } catch (err) {
      showToast({ title: `${t('manageRecurring.failedTo')} ${verb}`, description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    } finally {
      setActingOn(null);
    }
  };

  const confirmCancel = (id: string, contribution: (typeof recurring)[number]) => {
    Alert.alert(
      t('manageRecurring.cancelConfirmTitle'),
      `${t('manageRecurring.cancelConfirmDescPart1')} ${fmt(contribution.amount)} ${t('manageRecurring.cancelConfirmDescPart2')} ${frequencyLabel(contribution.recurrenceIntervalDays, t)} ${t('manageRecurring.to')} ${contribution.projectTitle}. ${t('manageRecurring.cancelConfirmDescPart3')}`,
      [
        { text: t('manageRecurring.keepIt'), style: 'cancel' },
        { text: t('manageRecurring.cancelContribution'), style: 'destructive', onPress: () => act(cancelRecurring, id, 'cancel') },
      ]
    );
  };

  return (
    <Screen header={<Header title={t('manageRecurring.title')} back />}>
      <View style={{ padding: 16, gap: 14 }}>
        {isLoading ? (
          <ActivityIndicator color={colors.forest} style={{ marginTop: 20 }} />
        ) : recurring.length === 0 ? (
          <EmptyState icon={RefreshCw} title={t('manageRecurring.noContributionsYet')} description={t('manageRecurring.setOneUp')} />
        ) : (
          recurring.map((r) => (
            <Card key={r.id} style={{ padding: 14, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 14, flex: 1 }} numberOfLines={1}>
                  {r.projectTitle}
                </Text>
                <StatusBadge status={r.paused ? 'pending' : 'approved'} />
              </View>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                {fmt(r.amount)} · {t('manageRecurring.every')} {frequencyLabel(r.recurrenceIntervalDays, t)}
              </Text>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkMuted, fontSize: 10 }}>
                {r.paused
                  ? t('manageRecurring.paused')
                  : r.nextChargeAt
                  ? `${t('manageRecurring.nextCharge')} ${new Date(r.nextChargeAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : ''}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.parchmentDark }}>
                {r.paused ? (
                  <Pressable
                    disabled={actingOn === r.id}
                    onPress={() => act(resumeRecurring, r.id, 'resume')}
                    style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.forest, alignItems: 'center', opacity: actingOn === r.id ? 0.5 : 1 }}
                  >
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>{t('manageRecurring.resume')}</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    disabled={actingOn === r.id}
                    onPress={() => act(pauseRecurring, r.id, 'pause')}
                    style={{ flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.parchmentDark, alignItems: 'center', opacity: actingOn === r.id ? 0.5 : 1 }}
                  >
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.inkMuted, fontSize: 12 }}>{t('manageRecurring.pause')}</Text>
                  </Pressable>
                )}
                <Pressable
                  disabled={actingOn === r.id}
                  onPress={() => confirmCancel(r.id, r)}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.seal, alignItems: 'center', opacity: actingOn === r.id ? 0.5 : 1 }}
                >
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>{t('manageRecurring.cancel')}</Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}
