import { useRef, useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShieldCheck } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useCreateLandOfferMutation } from '../../api/landOffers';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'PurchaseOffer'>;

// The "Escrow Settlement Protocol" picker (100% on notary transfer vs a
// 2-tranche 30/70 split) used to be sent as a `paymentTerms` field — the
// real LandOffer schema has no such concept at all, just `offerAmount` and
// a free-text `message`. Presenting a specific binding-sounding payment
// protocol the backend can't actually enforce would mislead a seller into
// thinking something was agreed that wasn't, so it's gone rather than kept
// as decoration; a buyer can still describe payment preferences in the
// notes, which really is sent.
export function PurchaseOfferScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const offerMutation = useCreateLandOfferMutation();

  const { listingId, title = 'Land Plot', askingPrice = 18000000 } = route.params;

  const [proposedPrice, setProposedPrice] = useState(String(askingPrice));
  const [notes, setNotes] = useState('');
  const notesRef = useRef<TextInput>(null);

  const numPrice = Number(proposedPrice) || 0;
  const discountDiff = askingPrice - numPrice;

  const handleSubmitOffer = async () => {
    if (numPrice <= 0) {
      showToast({ title: t('purchaseOffer.invalidOffer'), description: t('purchaseOffer.invalidOfferDesc'), tone: 'error' });
      return;
    }

    try {
      await offerMutation.mutateAsync({
        listingId,
        offerAmount: numPrice,
        message: notes.trim(),
      });

      showToast({
        title: t('purchaseOffer.offerSubmitted'),
        description: t('purchaseOffer.sellerNotified'),
        tone: 'success',
      });
      navigation.goBack();
    } catch (err) {
      showToast({ title: t('purchaseOffer.submissionError'), description: apiErrorMessage(err, t('purchaseOffer.couldNotSubmit')), tone: 'error' });
    }
  };

  return (
    <Screen header={<Header title={t('purchaseOffer.title')} subtitle={title} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Asking Price Comparison Card */}
        <Card style={{ padding: 16, gap: 6, backgroundColor: colors.seal + '15', borderColor: colors.seal + '35' }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.seal, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
            {t('purchaseOffer.targetProperty')}
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
            {title}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13 }}>
            {t('purchaseOffer.officialAskingPrice')} <Text style={{ fontFamily: FONT.serifBold, color: colors.ink }}>{fmt(askingPrice)}</Text>
          </Text>
        </Card>

        {/* Offer Price Input */}
        <Card style={{ padding: 16, gap: 14 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
            {t('purchaseOffer.proposedPriceTitle')}
          </Text>

          <TextField
            label={t('purchaseOffer.offerAmountLabel')}
            placeholder={String(askingPrice)}
            value={proposedPrice}
            onChangeText={(v) => setProposedPrice(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => notesRef.current?.focus()}
          />

          {/* Quick Price Buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: '90% (-10%)', val: Math.round(askingPrice * 0.9) },
              { label: '95% (-5%)', val: Math.round(askingPrice * 0.95) },
              { label: t('purchaseOffer.full100'), val: askingPrice },
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
                {discountDiff > 0 ? t('purchaseOffer.discountRequested') : t('purchaseOffer.premiumOffered')}
              </Text>
              <Text style={{ fontFamily: FONT.mono, color: discountDiff > 0 ? colors.amber : colors.forest, fontSize: 12, fontWeight: '700' }}>
                {discountDiff > 0 ? `-${fmt(discountDiff)}` : `+${fmt(Math.abs(discountDiff))}`}
              </Text>
            </View>
          )}
        </Card>

        {/* Notes & Conditions */}
        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
            {t('purchaseOffer.buyerConditions')}
          </Text>
          <TextInput
            ref={notesRef}
            placeholder={t('purchaseOffer.notesPlaceholder')}
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
              {t('purchaseOffer.safeEscrowTitle')}
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, marginTop: 1 }}>
              {t('purchaseOffer.safeEscrowDesc')}
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
          {`${t('purchaseOffer.submitEscrowOfferPrefix')} (${fmt(numPrice)})`}
        </PillButton>
      </View>
    </Screen>
  );
}
