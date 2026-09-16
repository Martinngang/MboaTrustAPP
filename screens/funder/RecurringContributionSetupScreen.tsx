import { useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CheckCircle2 } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useProjectQuery } from '../../api/projects';
import { useContributeMutation } from '../../api/pooledFunding';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

const FREQUENCY_DAYS: Record<'weekly' | 'monthly' | 'quarterly', number> = { weekly: 7, monthly: 30, quarterly: 90 };

type RouteProps = RouteProp<MainStackParamList, 'RecurringContributionSetup'>;

/** Setting this up charges the first contribution immediately (real money,
 * same as a one-off deposit) and schedules the rest — the backend has no
 * "ends on a date / after N contributions" concept, only ongoing-until-
 * cancelled, so that's the only option. */
export function RecurringContributionSetupScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { projectId } = route.params;
  const { data: project, isLoading } = useProjectQuery(projectId);
  const contribute = useContributeMutation();

  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [method, setMethod] = useState<'mtn_momo' | 'orange_money'>('mtn_momo');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [created, setCreated] = useState(false);
  const phoneRef = useRef<TextInput>(null);

  const canSubmit = Number(amount) > 0 && phoneNumber.trim().length > 0;

  const submit = async () => {
    if (!canSubmit || !project) return;
    try {
      await contribute.mutateAsync({
        projectId: project.id,
        amount: Number(amount),
        isRecurring: true,
        recurrenceIntervalDays: FREQUENCY_DAYS[frequency],
        paymentProvider: method,
        payerPhoneNumber: phoneNumber.trim(),
      });
      setCreated(true);
    } catch (err) {
      showToast({ title: t('recurringSetup.failedToSetUp'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  if (isLoading) {
    return (
      <Screen header={<Header title={t('recurringSetup.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  if (!project) {
    return (
      <Screen header={<Header title={t('recurringSetup.title')} back />}>
        <View style={{ padding: 16 }}>
          <EmptyState icon={CheckCircle2} title={t('recurringSetup.projectNotFound')} description={t('recurringSetup.projectNotFoundDesc')} />
        </View>
      </Screen>
    );
  }

  if (created) {
    return (
      <Screen header={<Header title={t('recurringSetup.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={32} color="#fff" />
          </View>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20, textAlign: 'center' }}>
            {t('recurringSetup.setUpTitle')}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
            {`${fmt(Number(amount))} ${t('recurringSetup.chargedNowPart1')} ${frequency === 'monthly' ? t('recurringSetup.month') : frequency === 'weekly' ? t('recurringSetup.week') : t('recurringSetup.quarter')} ${t('recurringSetup.chargedNowPart2')} ${project.title}, ${t('recurringSetup.chargedNowPart3')}`}
          </Text>
          <PillButton onPress={() => navigation.navigate('ManageRecurring')} fullWidth>
            {t('recurringSetup.manageRecurring')}
          </PillButton>
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title={t('recurringSetup.title')} subtitle={project.title} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <TextField
          label={t('recurringSetup.amountPerContribution')}
          placeholder="e.g. 50000"
          value={amount}
          onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => phoneRef.current?.focus()}
        />

        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('recurringSetup.frequency')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['weekly', 'monthly', 'quarterly'] as const).map((f) => {
              const active = frequency === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setFrequency(f)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    alignItems: 'center',
                    borderColor: active ? colors.forest : colors.parchmentDark,
                    backgroundColor: active ? colors.forest + '15' : colors.surface,
                  }}
                >
                  <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 12, color: active ? colors.forest : colors.inkMuted, textTransform: 'capitalize' }}>
                    {f === 'weekly' ? t('recurringSetup.weekly') : f === 'monthly' ? t('recurringSetup.monthly') : t('recurringSetup.quarterly')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('recurringSetup.paymentMethod')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['mtn_momo', 'orange_money'] as const).map((m) => {
              const active = method === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMethod(m)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    alignItems: 'center',
                    borderColor: active ? colors.forest : colors.parchmentDark,
                    backgroundColor: active ? colors.forest + '15' : colors.surface,
                  }}
                >
                  <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 12, color: active ? colors.forest : colors.inkMuted }}>
                    {m === 'mtn_momo' ? t('payout.momoLabel') : t('payout.omLabel')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextField
            ref={phoneRef}
            label={t('recurringSetup.phoneNumberLabel')}
            placeholder="677123456"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoComplete="tel"
            returnKeyType="done"
            onSubmitEditing={submit}
          />
        </Card>

        <Card style={{ padding: 14, backgroundColor: colors.forest + '12', borderColor: colors.forest + '30' }}>
          <Text style={{ fontFamily: FONT.sans, color: colors.forestDark, fontSize: 12, lineHeight: 17 }}>
            {t('recurringSetup.firstChargedNow')}
          </Text>
        </Card>

        <PillButton variant="primary" onPress={submit} loading={contribute.isPending} disabled={!canSubmit || contribute.isPending} fullWidth>
          {t('recurringSetup.setUpButton')}
        </PillButton>
      </View>
    </Screen>
  );
}
