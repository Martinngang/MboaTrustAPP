import { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Wallet,
  ArrowDownLeft,
  Smartphone,
  Check,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useWithdrawableBalanceQuery, useWithdrawMutation } from '../../api/contracts';
import type { MainStackParamList } from '../../navigation/types';

const WITHDRAW_CHANNELS = [
  { id: 'mtn_momo', name: 'MTN Mobile Money', sub: 'Instant payout to (+237)', color: '#FFCC00', textColor: '#111' },
  { id: 'orange_money', name: 'Orange Money', sub: 'Instant payout to (+237)', color: '#FF6600', textColor: '#fff' },
] as const;

export function EarningsWithdrawScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { data: balance, isLoading } = useWithdrawableBalanceQuery();
  const withdrawMutation = useWithdrawMutation();

  const availableAmount = balance?.withdrawableAmount || 4300000;
  const [withdrawAmount, setWithdrawAmount] = useState(String(availableAmount));
  const [channel, setChannel] = useState<'mtn_momo' | 'orange_money'>('mtn_momo');
  const [phoneNumber, setPhoneNumber] = useState('677123456');

  const numWithdraw = Number(withdrawAmount) || 0;
  const payoutFee = Math.round(numWithdraw * 0.015); // 1.5% Mobile Money transfer fee
  const netTransfer = Math.max(0, numWithdraw - payoutFee);

  const handleWithdraw = async () => {
    if (numWithdraw <= 0 || numWithdraw > availableAmount) {
      showToast({ title: 'Invalid Amount', description: `Amount must be between 1 and ${fmt(availableAmount)}.`, tone: 'error' });
      return;
    }
    if (!phoneNumber.trim()) {
      showToast({ title: 'Phone Required', description: 'Please enter your Mobile Money destination phone number.', tone: 'error' });
      return;
    }

    try {
      await withdrawMutation.mutateAsync({
        amount: numWithdraw,
        paymentMethod: channel,
        phoneNumber: phoneNumber.trim(),
      });

      showToast({
        title: 'Payout Initiated!',
        description: `${fmt(netTransfer)} sent to ${phoneNumber.trim()}.`,
        tone: 'success',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({
        title: 'Payout Error',
        description: err?.message || 'Could not process withdrawal. Please try again.',
        tone: 'error',
      });
    }
  };

  const samplePayouts = [
    {
      id: 'tx-1',
      title: 'Foundation Slab Release',
      project: 'Odza Residential Villa',
      amount: 1800000,
      date: 'Aug 24, 2026',
      status: 'completed',
    },
    {
      id: 'tx-2',
      title: 'Borehole Drilling Handover',
      project: 'Mbalmayo Community Well',
      amount: 2500000,
      date: 'Aug 18, 2026',
      status: 'completed',
    },
  ];

  return (
    <Screen header={<Header title="Earnings & Payouts" back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Balance Hero Overview */}
        <Card style={{ padding: 18, backgroundColor: colors.forestDark, gap: 16 }}>
          <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Available Withdrawable Balance
          </Text>

          <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 28 }}>
            {fmt(availableAmount)}
          </Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 }}>
              <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 9, textTransform: 'uppercase' }}>
                Total Earned
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 13, marginTop: 2 }}>
                {fmt(balance?.totalEarned || 6800000)}
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 }}>
              <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 9, textTransform: 'uppercase' }}>
                Pending Escrow
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 13, marginTop: 2 }}>
                {fmt(balance?.escrowPendingRelease || 2500000)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Withdrawal Form */}
        <Card style={{ padding: 16, gap: 14 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
            Request Payout
          </Text>

          <TextField
            label="Withdrawal Amount (XAF)"
            placeholder="e.g. 1000000"
            value={withdrawAmount}
            onChangeText={(v) => setWithdrawAmount(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />

          {/* Quick Amounts */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[Math.round(availableAmount * 0.25), Math.round(availableAmount * 0.5), availableAmount].map((amt, i) => (
              <Pressable
                key={i}
                onPress={() => setWithdrawAmount(String(amt))}
                style={{
                  flex: 1,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: numWithdraw === amt ? colors.forest : colors.parchment,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: FONT.mono, fontSize: 10, fontWeight: '700', color: numWithdraw === amt ? '#fff' : colors.ink }}>
                  {i === 2 ? '100% Max' : fmt(amt)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Destination Channel */}
          <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13, marginTop: 4 }}>
            Payout Destination
          </Text>

          {WITHDRAW_CHANNELS.map((ch) => {
            const active = channel === ch.id;
            return (
              <Pressable
                key={ch.id}
                onPress={() => setChannel(ch.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: active ? colors.forest : colors.parchmentDark,
                  backgroundColor: active ? colors.forest + '12' : colors.surface,
                }}
              >
                <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: ch.color, alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={18} color={ch.textColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                    {ch.name}
                  </Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11 }}>
                    {ch.sub}
                  </Text>
                </View>
                {active && (
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={12} color="#fff" strokeWidth={3} />
                  </View>
                )}
              </Pressable>
            );
          })}

          <TextField
            label="Mobile Money Phone (+237)"
            placeholder="677123456"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />

          {/* Breakdown */}
          <View style={{ gap: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.parchmentDark }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>Operator Transfer Fee (1.5%)</Text>
              <Text style={{ fontFamily: FONT.sansMedium, color: colors.inkSubtle, fontSize: 12 }}>{fmt(payoutFee)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 2 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>Net You Receive</Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16 }}>{fmt(netTransfer)}</Text>
            </View>
          </View>

          <PillButton
            variant="primary"
            onPress={handleWithdraw}
            loading={withdrawMutation.isPending}
            disabled={withdrawMutation.isPending || numWithdraw <= 0}
            fullWidth
          >
            {`Withdraw ${fmt(netTransfer)} to MoMo`}
          </PillButton>
        </Card>

        {/* Payout History */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Recent Escrow Payouts
          </Text>

          {samplePayouts.map((tx) => (
            <Card key={tx.id} style={{ padding: 14, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                  {tx.title}
                </Text>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 14 }}>
                  +{fmt(tx.amount)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11 }}>
                  {tx.project} · {tx.date}
                </Text>
                <StatusBadge status={tx.status} />
              </View>
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}
