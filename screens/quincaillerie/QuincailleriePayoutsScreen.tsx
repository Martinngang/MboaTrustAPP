import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Wallet,
  Smartphone,
  Check,
  ShieldCheck,
  ArrowDownLeft,
  Store,
  CreditCard,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useMyQuincaillerieProfileQuery } from '../../api/materials';
import { useWithdrawMutation } from '../../api/contracts';
import type { MainStackParamList } from '../../navigation/types';

export function QuincailleriePayoutsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { data: profile, isLoading } = useMyQuincaillerieProfileQuery();
  const withdrawMutation = useWithdrawMutation();

  const availableAmount = profile?.availablePayout || 2753500;

  const handleInstantPayout = async () => {
    try {
      await withdrawMutation.mutateAsync({
        amount: availableAmount,
        paymentMethod: profile?.paymentProvider || 'mtn_momo',
        phoneNumber: profile?.payoutPhoneNumber || '677001122',
      });
      showToast({
        title: 'Settlement Initiated!',
        description: `${fmt(availableAmount)} sent to store ${profile?.paymentProvider === 'orange_money' ? 'Orange Money' : 'MTN MoMo'}.`,
        tone: 'success',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({ title: 'Payout Error', description: err?.message || 'Could not process payout.', tone: 'error' });
    }
  };

  const sampleDisbursements = [
    {
      id: 'disb-1',
      orderNumber: 'ORD-2026-641',
      project: 'Villa Odza Foundation',
      amount: 1446500,
      date: 'Aug 26, 2026',
      status: 'completed',
    },
    {
      id: 'disb-2',
      orderNumber: 'ORD-2026-420',
      project: 'Mbalmayo Well Pumping Station',
      amount: 1307000,
      date: 'Aug 19, 2026',
      status: 'completed',
    },
  ];

  return (
    <Screen header={<Header title="Store Escrow Payouts" back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Settlement Hero Card */}
        <Card style={{ padding: 18, backgroundColor: colors.forestDark, gap: 14 }}>
          <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Available Store Settlement Balance
          </Text>

          <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 28 }}>
            {fmt(availableAmount)}
          </Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 }}>
              <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 9, textTransform: 'uppercase' }}>
                Pending Delivery
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 13, marginTop: 2 }}>
                {fmt(profile?.pendingEscrow || 1446500)}
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 }}>
              <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 9, textTransform: 'uppercase' }}>
                Lifetime Sales
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 13, marginTop: 2 }}>
                {fmt(profile?.totalRevenue || 4200000)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Payout Channel Configuration */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
            Registered Store Payout Method
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 14,
              backgroundColor: colors.parchment,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: profile?.paymentProvider === 'orange_money' ? '#FF6600' : '#FFCC00',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Smartphone size={20} color={profile?.paymentProvider === 'orange_money' ? '#fff' : '#111'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                {profile?.paymentProvider === 'orange_money' ? 'Orange Money (+237)' : 'MTN Mobile Money (+237)'}
              </Text>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                Account: {profile?.payoutPhoneNumber || '677001122'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={14} color={colors.forest} />
              <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, fontWeight: '700' }}>
                Active
              </Text>
            </View>
          </View>

          <PillButton
            variant="primary"
            onPress={handleInstantPayout}
            loading={withdrawMutation.isPending}
            disabled={withdrawMutation.isPending || availableAmount <= 0}
            fullWidth
          >
            {`Withdraw ${fmt(availableAmount)} to MoMo`}
          </PillButton>
        </Card>

        {/* Disbursement History */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Disbursement Settlements
          </Text>

          {sampleDisbursements.map((d) => (
            <Card key={d.id} style={{ padding: 14, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: FONT.mono, color: colors.amber, fontSize: 11, fontWeight: '700' }}>
                  {d.orderNumber}
                </Text>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 14 }}>
                  +{fmt(d.amount)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                  {d.project} · {d.date}
                </Text>
                <StatusBadge status={d.status} />
              </View>
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}
