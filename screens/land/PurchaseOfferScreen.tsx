import { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ShieldCheck,
  Check,
  DollarSign,
  Calendar,
  FileCheck,
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
import { useCreateLandOfferMutation } from '../../api/land';
import type { MainStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<MainStackParamList, 'PurchaseOffer'>;

const PAYMENT_TERMS = [
  {
    id: 'notary_escrow',
    title: '100% Escrow on Notary Title Transfer',
    description: 'Full purchase sum is reserved in MboaTrust Escrow and released only upon sworn notary deed handover.',
  },
  {
    id: 'two_tranches',
    title: '2-Tranche Phased Release (30% / 70%)',
    description: '30% upon cadastral boundary demarcation report, 70% upon official title registration.',
  },
] as const;

export function PurchaseOfferScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const offerMutation = useCreateLandOfferMutation();

  const { listingId, title = 'Land Plot', askingPrice = 18000000 } = route.params;

  const [proposedPrice, setProposedPrice] = useState(String(askingPrice));
  const [paymentTerms, setPaymentTerms] = useState<'notary_escrow' | 'two_tranches'>('notary_escrow');
  const [notes, setNotes] = useState('Purchase conditional upon cadastral boundary verification and clear title status.');

  const numPrice = Number(proposedPrice) || 0;
  const discountDiff = askingPrice - numPrice;

  const handleSubmitOffer = async () => {
    if (numPrice <= 0) {
      showToast({ title: 'Invalid Offer', description: 'Please enter a valid offer price in XAF.', tone: 'error' });
      return;
    }

    try {
      await offerMutation.mutateAsync({
        listingId,
        proposedPrice: numPrice,
        paymentTerms,
        notes: notes.trim(),
      });

      showToast({
        title: 'Offer Submitted!',
        description: 'Seller has been notified of your escrow-backed purchase proposal.',
        tone: 'success',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({ title: 'Submission Error', description: err?.message || 'Could not submit offer.', tone: 'error' });
    }
  };

  return (
    <Screen header={<Header title="Submit Purchase Offer" subtitle={title} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Asking Price Comparison Card */}
        <Card style={{ padding: 16, gap: 6, backgroundColor: colors.seal + '15', borderColor: colors.seal + '35' }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.seal, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
            Target Property
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
            {title}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13 }}>
            Official Asking Price: <Text style={{ fontFamily: FONT.serifBold, color: colors.ink }}>{fmt(askingPrice)}</Text>
          </Text>
        </Card>

        {/* Offer Price Input */}
        <Card style={{ padding: 16, gap: 14 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
            Your Proposed Purchase Price (XAF)
          </Text>

          <TextField
            label="Offer Amount (XAF)"
            placeholder={String(askingPrice)}
            value={proposedPrice}
            onChangeText={(v) => setProposedPrice(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />

          {/* Quick Price Buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: '90% (-10%)', val: Math.round(askingPrice * 0.9) },
              { label: '95% (-5%)', val: Math.round(askingPrice * 0.95) },
              { label: '100% Full', val: askingPrice },
            ].map((btn, i) => (
              <Pressable
                key={i}
                onPress={() => setProposedPrice(String(btn.val))}
                style={{
                  flex: 1,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: numPrice === btn.val ? colors.seal : colors.parchment,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: FONT.mono, fontSize: 10, fontWeight: '700', color: numPrice === btn.val ? '#fff' : colors.ink }}>
                  {btn.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {discountDiff !== 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 }}>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                {discountDiff > 0 ? 'Discount requested:' : 'Premium offered:'}
              </Text>
              <Text style={{ fontFamily: FONT.mono, color: discountDiff > 0 ? colors.amber : colors.forest, fontSize: 12, fontWeight: '700' }}>
                {discountDiff > 0 ? `-${fmt(discountDiff)}` : `+${fmt(Math.abs(discountDiff))}`}
              </Text>
            </View>
          )}
        </Card>

        {/* Escrow Settlement Terms */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
            Select Escrow Settlement Protocol
          </Text>

          <View style={{ gap: 10 }}>
            {PAYMENT_TERMS.map((t) => {
              const active = paymentTerms === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setPaymentTerms(t.id)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: active ? colors.seal : colors.parchmentDark,
                    backgroundColor: active ? colors.seal + '12' : colors.surface,
                    gap: 4,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                      {t.title}
                    </Text>
                    {active && (
                      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: colors.seal, alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11, lineHeight: 15 }}>
                    {t.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Notes & Conditions */}
        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
            Buyer Conditions & Observations
          </Text>
          <TextInput
            placeholder="Specify any surveyor, notary, or boundary timeline requirements..."
            placeholderTextColor={colors.inkSubtle}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={{
              backgroundColor: colors.parchment,
              borderRadius: 12,
              padding: 12,
              fontFamily: FONT.sans,
              color: colors.ink,
              fontSize: 13,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
          />
        </Card>

        {/* Escrow Protection Badge */}
        <Card style={{ padding: 14, backgroundColor: colors.forest + '12', borderColor: colors.forest + '30', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={22} color={colors.forest} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
              Safe & Guaranteed Escrow
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, marginTop: 1 }}>
              Your offer is non-binding until accepted. Once accepted, funds are escrowed safely until notary title signoff.
            </Text>
          </View>
        </Card>

        {/* Submit Offer Button */}
        <PillButton
          variant="primary"
          onPress={handleSubmitOffer}
          loading={offerMutation.isPending}
          disabled={offerMutation.isPending || numPrice <= 0}
          fullWidth
        >
          {`Submit Escrow Offer (${fmt(numPrice)})`}
        </PillButton>
      </View>
    </Screen>
  );
}
