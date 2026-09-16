import { useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StripeCardField, useStripeCardConfirm, type StripeCardDetails } from '../../components/payment/StripeCardCheckout';
import {
  ShieldCheck,
  CreditCard,
  Lock,
  Smartphone,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useFundProjectMutation, useRefreshEscrowStatusMutation } from '../../api/escrow';
import { useFeeCalculation } from '../../context/FeeConfigContext';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';
import type { TranslationKey } from '../../i18n/translations';

type RouteProps = RouteProp<MainStackParamList, 'FundProject'>;

const PAYMENT_METHODS: { id: 'mtn_momo' | 'orange_money' | 'stripe'; nameKey: TranslationKey; subKey: TranslationKey; color: string; textColor: string }[] = [
  { id: 'mtn_momo', nameKey: 'fundProject.momoName', subKey: 'fundProject.momoSub', color: '#FFCC00', textColor: '#111' },
  { id: 'orange_money', nameKey: 'fundProject.omName', subKey: 'fundProject.momoSub', color: '#FF6600', textColor: '#fff' },
  { id: 'stripe', nameKey: 'fundProject.stripeName', subKey: 'fundProject.stripeSub', color: '#1E3A5F', textColor: '#fff' },
];

export function FundProjectScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const fundMutation = useFundProjectMutation();
  const refreshEscrowStatus = useRefreshEscrowStatusMutation();
  const confirmStripeCard = useStripeCardConfirm();
  const feeCalc = useFeeCalculation();

  const { projectId, title, remainingAmount } = route.params;

  const [amount, setAmount] = useState(remainingAmount ? String(remainingAmount) : '');
  const [method, setMethod] = useState<'mtn_momo' | 'orange_money' | 'stripe'>('mtn_momo');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'select' | 'stripe_card'>('select');
  const [cardDetails, setCardDetails] = useState<StripeCardDetails | null>(null);
  const [cardSubmitting, setCardSubmitting] = useState(false);
  // Real Stripe PaymentIntent secret, captured once the pending escrow is
  // created — mirrors web's FundProjectScreen exactly: the escrow (and real
  // PaymentIntent) must exist *before* the card form renders, since there's
  // nothing for CardField to confirm against otherwise.
  const [stripeClientSecret, setStripeClientSecret] = useState<string | undefined>(undefined);
  // Guards against creating a second escrow/PaymentIntent if the funder
  // backs out of the card form and taps "Proceed" again.
  const [stripeEscrowStarted, setStripeEscrowStarted] = useState(false);
  const [stripeEscrowId, setStripeEscrowId] = useState<string | undefined>(undefined);
  const phoneRef = useRef<TextInput>(null);

  const numAmount = Number(amount) || 0;
  // The backend charges the funder exactly `amount` and deducts the real,
  // live-synced platform fee before the remainder reaches escrow (see
  // projectController.fundProject + feeService.calculateFee) — this used to
  // show a fabricated 2.5% charged *on top* of the amount, which matched
  // neither the real rate nor the real "deduct" model.
  const funding = feeCalc.projectFunding(numAmount);
  const processingFee = funding.feeAmount;
  const netToEscrow = funding.resultAmount;

  const quickAmounts = [100000, 250000, 500000, remainingAmount].filter(Boolean);

  // Stripe's own PaymentIntent already carries the exact amount charged —
  // this never re-runs fundMutation, so the same escrow/charge created by
  // initiateStripePayment is confirmed, never a second one.
  const initiateStripePayment = async () => {
    if (stripeEscrowStarted) {
      setStep('stripe_card');
      return;
    }
    if (numAmount <= 0) {
      showToast({ title: t('fundProject.invalidAmount'), description: t('fundProject.invalidAmountDesc'), tone: 'error' });
      return;
    }
    try {
      const result = await fundMutation.mutateAsync({
        projectId,
        amount: numAmount,
        paymentProvider: 'stripe',
      });
      setStripeClientSecret(result.clientSecret);
      setStripeEscrowId(result._id);
      setStripeEscrowStarted(true);
      setStep('stripe_card');
    } catch (err: any) {
      showToast({
        title: t('fundProject.couldNotStartCard'),
        description: err?.message || t('menu.pleaseTryAgain'),
        tone: 'error',
      });
    }
  };

  // This backend's Stripe webhook can never reach a localhost dev server, so
  // without this explicit reconcile a genuinely-successful card charge would
  // sit at status 'pending' forever — see [[project_mboatrust_stripe_pending_reconciliation]].
  const handleStripeConfirm = async () => {
    if (!stripeClientSecret || !cardDetails?.complete) return;
    setCardSubmitting(true);
    try {
      const { error, succeeded } = await confirmStripeCard(stripeClientSecret);
      if (error) {
        showToast({ title: t('fundProject.cardDeclined'), description: error.message, tone: 'error' });
        return;
      }
      if (succeeded && stripeEscrowId) {
        try {
          await refreshEscrowStatus.mutateAsync(stripeEscrowId);
        } catch {
          // Best-effort head start — TransactionHistory/ContractSummary's own
          // "check status" affordance (or a real webhook in production)
          // still catches this later if the call itself fails here.
        }
      }
      showToast({
        title: t('fundProject.escrowFundedSuccess'),
        description: `${fmt(numAmount)} ${t('fundProject.lockedInEscrowFor')} ${title}.`,
        tone: 'success',
      });
      navigation.goBack();
    } finally {
      setCardSubmitting(false);
    }
  };

  const handleFund = async () => {
    if (numAmount <= 0) {
      showToast({ title: t('fundProject.invalidAmount'), description: t('fundProject.invalidAmountDesc'), tone: 'error' });
      return;
    }
    if (method === 'stripe') {
      await initiateStripePayment();
      return;
    }
    if (!phoneNumber.trim()) {
      showToast({ title: t('fundProject.missingPhoneNumber'), description: t('fundProject.missingPhoneDesc'), tone: 'error' });
      return;
    }

    try {
      await fundMutation.mutateAsync({
        projectId,
        amount: numAmount,
        paymentProvider: method,
        payerPhoneNumber: phoneNumber.trim(),
      });

      showToast({
        title: t('fundProject.escrowFundedSuccess'),
        description: `${fmt(numAmount)} ${t('fundProject.lockedInEscrowFor')} ${title}.`,
        tone: 'success',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({
        title: t('fundProject.fundingFailed'),
        description: err?.message || t('fundProject.couldNotProcessDeposit'),
        tone: 'error',
      });
    }
  };

  return (
    <Screen header={<Header title={t('fundProject.title')} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Project Target Box */}
        <Card style={{ padding: 16, backgroundColor: colors.forest + '15', borderColor: colors.forest + '40', gap: 6 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
            {t('fundProject.fundingDestination')}
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 17 }} numberOfLines={2}>
            {title}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
            {t('fundProject.remainingToTarget')} <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest }}>{fmt(remainingAmount)}</Text>
          </Text>
        </Card>

        {/* Contribution Amount */}
        <Card style={{ padding: 16, gap: 14 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
            {t('fundProject.contributionAmount')}
          </Text>

          <TextField
            placeholder="e.g. 500000"
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            returnKeyType={method === 'stripe' ? 'done' : 'next'}
            blurOnSubmit={method === 'stripe'}
            onSubmitEditing={() => phoneRef.current?.focus()}
          />

          {/* Quick Amount Chips */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {quickAmounts.map((qa, idx) => (
              <Pressable
                key={idx}
                onPress={() => setAmount(String(qa))}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: numAmount === qa ? colors.forest : colors.parchment,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    color: numAmount === qa ? '#fff' : colors.ink,
                    fontWeight: '600',
                  }}
                >
                  {qa === remainingAmount ? t('fundProject.fullRemaining') : fmt(qa)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Payment Method Selector */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
            {t('fundProject.selectPaymentChannel')}
          </Text>

          {PAYMENT_METHODS.map((pm) => {
            const active = method === pm.id;
            return (
              <Pressable
                key={pm.id}
                onPress={() => setMethod(pm.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: active ? colors.forest : colors.parchmentDark,
                  backgroundColor: active ? colors.forest + '12' : colors.surface,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: pm.color,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {pm.id === 'stripe' ? (
                    <CreditCard size={20} color="#fff" />
                  ) : (
                    <Smartphone size={20} color={pm.textColor} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                    {t(pm.nameKey)}
                  </Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11 }}>
                    {t(pm.subKey)}
                  </Text>
                </View>
                {active ? (
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: colors.forest,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={14} color="#fff" strokeWidth={3} />
                  </View>
                ) : (
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 1.5,
                      borderColor: colors.parchmentDark,
                    }}
                  />
                )}
              </Pressable>
            );
          })}

          {/* MoMo / OM Phone Number */}
          {(method === 'mtn_momo' || method === 'orange_money') && (
            <View style={{ marginTop: 6 }}>
              <TextField
                ref={phoneRef}
                label={t('fundProject.phoneLabel')}
                placeholder="677123456"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoComplete="tel"
                returnKeyType="done"
                onSubmitEditing={handleFund}
              />
            </View>
          )}
        </Card>

        {/* Real Stripe Card Checkout — only rendered once initiateStripePayment
            has created the pending escrow + real PaymentIntent (see stripeClientSecret).
            Uses Stripe's native CardField (@stripe/stripe-react-native), the RN
            equivalent of web's embedded Stripe Elements PaymentElement. */}
        {step === 'stripe_card' && (
          <Card style={{ padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Lock size={16} color={colors.forest} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                {t('fundProject.stripeSecureCheckout')}
              </Text>
            </View>
            <StripeCardField
              backgroundColor={colors.parchment}
              textColor={colors.ink}
              borderColor={colors.parchmentDark}
              placeholderColor={colors.inkSubtle}
              onChange={setCardDetails}
            />
          </Card>
        )}

        {/* Fee & Escrow Breakdown */}
        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('fundProject.transactionOverview')}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>{t('fundProject.youSend')}</Text>
            <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>{fmt(numAmount)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>{funding.feeLabel}</Text>
            <Text style={{ fontFamily: FONT.sansMedium, color: colors.inkSubtle, fontSize: 13 }}>-{fmt(processingFee)}</Text>
          </View>
          <View style={{ height: 1, backgroundColor: colors.parchmentDark, marginVertical: 2 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>{t('fundProject.reachesEscrow')}</Text>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 17 }}>{fmt(netToEscrow)}</Text>
          </View>
        </Card>

        {/* Escrow Guarantee Pledge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
          <ShieldCheck size={20} color={colors.forest} />
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, flex: 1, lineHeight: 17 }}>
            {t('fundProject.escrowGuarantee')}
          </Text>
        </View>

        {/* Submit Action */}
        {step === 'stripe_card' ? (
          <View style={{ gap: 10 }}>
            <PillButton
              variant="primary"
              onPress={handleStripeConfirm}
              loading={cardSubmitting}
              disabled={cardSubmitting || !cardDetails?.complete}
              fullWidth
            >
              {cardSubmitting ? t('fundProject.processingCard') : t('fundProject.confirmCardPayment')}
            </PillButton>
            <PillButton variant="secondary" onPress={() => setStep('select')} disabled={cardSubmitting} fullWidth>
              {t('fundProject.cancel')}
            </PillButton>
          </View>
        ) : (
          <PillButton
            variant="primary"
            onPress={handleFund}
            loading={fundMutation.isPending}
            disabled={fundMutation.isPending || numAmount <= 0}
            fullWidth
          >
            {method === 'stripe' ? t('fundProject.proceedWithCard') : `${t('fundProject.lockInEscrowPrefix')} ${fmt(numAmount)} ${t('fundProject.inEscrowSuffix')}`}
          </PillButton>
        )}
      </View>
    </Screen>
  );
}
