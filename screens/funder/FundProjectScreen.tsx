import { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { useFundProjectMutation } from '../../api/escrow';
import type { MainStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<MainStackParamList, 'FundProject'>;

const PAYMENT_METHODS = [
  { id: 'mtn_momo', name: 'MTN Mobile Money', sub: 'Instant prompt on phone (+237)', color: '#FFCC00', textColor: '#111' },
  { id: 'orange_money', name: 'Orange Money', sub: 'Instant prompt on phone (+237)', color: '#FF6600', textColor: '#fff' },
  { id: 'stripe', name: 'Visa / Mastercard', sub: 'International credit / debit card', color: '#1E3A5F', textColor: '#fff' },
] as const;

export function FundProjectScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const fundMutation = useFundProjectMutation();

  const { projectId, title, remainingAmount } = route.params;

  const [amount, setAmount] = useState(String(remainingAmount || 500000));
  const [method, setMethod] = useState<'mtn_momo' | 'orange_money' | 'stripe'>('mtn_momo');
  const [phoneNumber, setPhoneNumber] = useState('677123456');

  const numAmount = Number(amount) || 0;
  const processingFee = Math.round(numAmount * 0.025);
  const totalCharge = numAmount + processingFee;

  const quickAmounts = [100000, 250000, 500000, remainingAmount].filter(Boolean);

  const handleFund = async () => {
    if (numAmount <= 0) {
      showToast({ title: 'Invalid Amount', description: 'Please enter a valid funding amount.', tone: 'error' });
      return;
    }
    if ((method === 'mtn_momo' || method === 'orange_money') && !phoneNumber.trim()) {
      showToast({ title: 'Missing Phone Number', description: 'Please enter your Mobile Money phone number.', tone: 'error' });
      return;
    }

    try {
      await fundMutation.mutateAsync({
        projectId,
        amount: numAmount,
        paymentMethod: method,
        phoneNumber: phoneNumber.trim(),
      });

      showToast({
        title: 'Escrow Funded Successfully!',
        description: `${fmt(numAmount)} locked in escrow for ${title}.`,
        tone: 'success',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({
        title: 'Funding Failed',
        description: err?.message || 'Could not process escrow deposit. Please try again.',
        tone: 'error',
      });
    }
  };

  return (
    <Screen header={<Header title="Fund Project Escrow" back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Project Target Box */}
        <Card style={{ padding: 16, backgroundColor: colors.forest + '15', borderColor: colors.forest + '40', gap: 6 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
            Funding Destination
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 17 }} numberOfLines={2}>
            {title}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
            Remaining to target: <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest }}>{fmt(remainingAmount)}</Text>
          </Text>
        </Card>

        {/* Contribution Amount */}
        <Card style={{ padding: 16, gap: 14 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
            Contribution Amount (XAF)
          </Text>

          <TextField
            placeholder="e.g. 500000"
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
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
                  {qa === remainingAmount ? 'Full Remaining' : fmt(qa)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Payment Method Selector */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
            Select Payment Channel
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
                    {pm.name}
                  </Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11 }}>
                    {pm.sub}
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
                label="Mobile Money Phone Number (+237)"
                placeholder="677123456"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          )}
        </Card>

        {/* Fee & Escrow Breakdown */}
        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Transaction Overview
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>Escrow Principal</Text>
            <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>{fmt(numAmount)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>Payment Processing (2.5%)</Text>
            <Text style={{ fontFamily: FONT.sansMedium, color: colors.inkSubtle, fontSize: 13 }}>{fmt(processingFee)}</Text>
          </View>
          <View style={{ height: 1, backgroundColor: colors.parchmentDark, marginVertical: 2 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>Total Billed</Text>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 17 }}>{fmt(totalCharge)}</Text>
          </View>
        </Card>

        {/* Escrow Guarantee Pledge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
          <ShieldCheck size={20} color={colors.forest} />
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, flex: 1, lineHeight: 17 }}>
            Your deposit will be locked safely in MboaTrust Escrow. Funds are never paid out until you inspect and approve completed milestones.
          </Text>
        </View>

        {/* Submit Action */}
        <PillButton
          variant="primary"
          onPress={handleFund}
          loading={fundMutation.isPending}
          disabled={fundMutation.isPending || numAmount <= 0}
          fullWidth
        >
          {`Lock ${fmt(totalCharge)} in Escrow`}
        </PillButton>
      </View>
    </Screen>
  );
}
