import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { TextField } from '../components/TextField';
import { PillButton } from '../components/PillButton';
import { useToast } from '../components/Toast';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import { useMySubscriptionsQuery, useCreateSubscriptionMutation, useCancelSubscriptionMutation, PLAN_PRICES, type PlanType } from '../api/subscriptions';
import { apiErrorMessage } from '../api/client';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translations';

const PLAN_META: Record<PlanType, { nameKey: TranslationKey; benefitKey: TranslationKey }> = {
  pro_contractor: { nameKey: 'subscription.proContractorName', benefitKey: 'subscription.proContractorBenefit' },
  power_funder: { nameKey: 'subscription.powerFunderName', benefitKey: 'subscription.powerFunderBenefit' },
};

export function SubscriptionScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { activeRole } = useApp();
  const { show: showToast } = useToast();

  const { data: subscriptions, isLoading } = useMySubscriptionsQuery();
  const createSubscription = useCreateSubscriptionMutation();
  const cancelSubscription = useCancelSubscriptionMutation();

  const [method, setMethod] = useState<'mtn_momo' | 'orange_money'>('mtn_momo');
  const [phoneNumber, setPhoneNumber] = useState('');

  const planType: PlanType = activeRole === 'contractor' ? 'pro_contractor' : 'power_funder';
  const meta = PLAN_META[planType];
  const price = PLAN_PRICES[planType];
  const active = (subscriptions || []).find((s) => s.planType === planType && s.status === 'active');
  const history = (subscriptions || []).filter((s) => s.status !== 'active');

  const subscribe = async () => {
    if (!phoneNumber.trim()) {
      showToast({ title: t('subscription.phoneRequired'), description: t('subscription.phoneRequiredDesc'), tone: 'error' });
      return;
    }
    try {
      await createSubscription.mutateAsync({ planType, paymentProvider: method, payerPhoneNumber: phoneNumber.trim() });
      showToast({ title: `${t(meta.nameKey)} ${t('subscription.activated')}`, tone: 'success' });
    } catch (err) {
      showToast({ title: t('subscription.subscriptionFailed'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  const cancel = async () => {
    if (!active) return;
    try {
      await cancelSubscription.mutateAsync(active.id);
      showToast({ title: t('subscription.cancelled'), tone: 'neutral' });
    } catch (err) {
      showToast({ title: t('subscription.failedToCancel'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  return (
    <Screen header={<Header title={t('subscription.title')} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {isLoading ? (
          <ActivityIndicator color={colors.forest} style={{ marginTop: 20 }} />
        ) : (
          <>
            <Card style={{ padding: 18, backgroundColor: colors.forestDark, gap: 8 }}>
              <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {t(meta.nameKey)}
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 22 }}>
                {price.toLocaleString('en-US')} XAF
                <Text style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: '400' }}>{t('subscription.perMonth')}</Text>
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 17 }}>
                {t(meta.benefitKey)}
              </Text>
              {active && (
                <View style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                  <StatusBadge status="active" />
                </View>
              )}
            </Card>

            {active ? (
              <View style={{ gap: 12 }}>
                <Card style={{ padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{t('subscription.renews')}</Text>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 2 }}>
                      {active.renewalDate
                        ? new Date(active.renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </Text>
                  </View>
                </Card>
                <PillButton variant="secondary" onPress={cancel} loading={cancelSubscription.isPending} disabled={cancelSubscription.isPending} fullWidth>
                  {t('subscription.cancelSubscription')}
                </PillButton>
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                <Card style={{ padding: 16, gap: 12 }}>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {t('subscription.paymentMethod')}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['mtn_momo', 'orange_money'] as const).map((m) => {
                      const active2 = method === m;
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
                            borderColor: active2 ? colors.forest : colors.parchmentDark,
                            backgroundColor: active2 ? colors.forest + '15' : colors.surface,
                          }}
                        >
                          <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 12, color: active2 ? colors.forest : colors.inkMuted }}>
                            {m === 'mtn_momo' ? t('payout.momoLabel') : t('payout.omLabel')}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <TextField
                    label={t('subscription.phoneLabel')}
                    placeholder="677123456"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    returnKeyType="done"
                    onSubmitEditing={subscribe}
                  />
                </Card>
                <PillButton variant="primary" onPress={subscribe} loading={createSubscription.isPending} disabled={createSubscription.isPending} fullWidth>
                  {`${t('subscription.subscribePrefix')} ${price.toLocaleString('en-US')} XAF${t('subscription.perMonth')}`}
                </PillButton>
              </View>
            )}

            {history.length > 0 && (
              <View style={{ gap: 10 }}>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  {t('subscription.history')}
                </Text>
                {history.map((s) => (
                  <Card key={s.id} style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 13 }}>{t(PLAN_META[s.planType].nameKey)}</Text>
                    <StatusBadge status={s.status} />
                  </Card>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}
