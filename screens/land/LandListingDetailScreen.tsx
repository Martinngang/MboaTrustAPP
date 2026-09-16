import { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, ScrollView, Alert, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MapPin, ShieldCheck, FileCheck } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { PillButton } from '../../components/PillButton';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useLandListingDetailQuery } from '../../api/land';
import {
  useLandOffersQuery,
  useAcceptOfferMutation,
  useCounterOfferMutation,
  useDeclineOfferMutation,
  useWithdrawOfferMutation,
} from '../../api/landOffers';
import { apiErrorMessage } from '../../api/client';
import { useApp } from '../../context/AppContext';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'LandListingDetail'>;

export function LandListingDetailScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user } = useApp();
  const { show: showToast } = useToast();
  const { listingId } = route.params;

  const { data: land, isLoading } = useLandListingDetailQuery(listingId);
  const { data: offers } = useLandOffersQuery({ listingId });
  const acceptOffer = useAcceptOfferMutation();
  const counterOffer = useCounterOfferMutation();
  const declineOffer = useDeclineOfferMutation();
  const withdrawOffer = useWithdrawOfferMutation();
  const [counteringId, setCounteringId] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [actingOn, setActingOn] = useState<string | null>(null);

  if (isLoading || !land) {
    return (
      <Screen header={<Header title={t('landDetail.dossierLoading')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.seal} />
        </View>
      </Screen>
    );
  }

  const isSeller = Boolean(user?._id) && land.sellerId === user?._id;
  const listingOffers = offers || [];

  const handleAccept = async (offerId: string) => {
    setActingOn(offerId);
    try {
      await acceptOffer.mutateAsync(offerId);
      showToast({ title: t('landDetail.offerAccepted'), tone: 'success' });
    } catch (err) {
      showToast({ title: t('landDetail.error'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    } finally {
      setActingOn(null);
    }
  };

  const handleDecline = async (offerId: string) => {
    setActingOn(offerId);
    try {
      await declineOffer.mutateAsync(offerId);
      showToast({ title: t('landDetail.offerDeclined'), tone: 'neutral' });
    } catch (err) {
      showToast({ title: t('landDetail.error'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    } finally {
      setActingOn(null);
    }
  };

  const handleWithdraw = async (offerId: string) => {
    setActingOn(offerId);
    try {
      await withdrawOffer.mutateAsync(offerId);
      showToast({ title: t('landDetail.offerWithdrawn'), tone: 'neutral' });
    } catch (err) {
      showToast({ title: t('landDetail.error'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    } finally {
      setActingOn(null);
    }
  };

  const submitCounter = async (offerId: string) => {
    const amount = Number(counterAmount);
    if (!amount || amount <= 0) return;
    setActingOn(offerId);
    try {
      await counterOffer.mutateAsync({ offerId, counterAmount: amount });
      showToast({ title: t('landDetail.counterSent'), tone: 'success' });
      setCounteringId(null);
      setCounterAmount('');
    } catch (err) {
      showToast({ title: t('landDetail.error'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    } finally {
      setActingOn(null);
    }
  };

  return (
    <Screen header={<Header title={t('landDetail.title')} subtitle={`${land.city}, ${land.region}`} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Land Banner */}
        <Card style={{ overflow: 'hidden' }}>
          <View style={{ height: 210, backgroundColor: colors.parchment, position: 'relative' }}>
            <Image source={{ uri: land.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <View
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                backgroundColor: colors.forest,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <ShieldCheck size={14} color="#fff" />
              <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 11, fontWeight: '700' }}>
                {land.titleType}
              </Text>
            </View>
            <View style={{ position: 'absolute', top: 12, right: 12 }}>
              <StatusBadge status={land.verificationStatus} />
            </View>
          </View>

          {/* Details Body */}
          <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 19 }}>
              {land.title}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MapPin size={14} color={colors.inkSubtle} />
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>
                {land.city}, {land.region}
              </Text>
            </View>

            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, lineHeight: 19 }}>
              {land.description}
            </Text>
          </View>
        </Card>

        {/* Pricing & Dimensions Card */}
        <Card style={{ padding: 16, gap: 14 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('landDetail.pricingAndArea')}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                {t('landDetail.totalAskingPrice')}
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 22, marginTop: 2 }}>
                {fmt(land.price)}
              </Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                {t('landDetail.surfaceArea')}
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.seal, fontSize: 18, marginTop: 2 }}>
                {land.sizeSqm} m²
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                {t('landDetail.pricePerSqm')}
              </Text>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14, marginTop: 2 }}>
                {fmt(Math.round(land.price / Math.max(land.sizeSqm, 1)))}/m²
              </Text>
            </View>
          </View>
        </Card>

        {land.documents.length > 0 && (
          <Card style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              {t('landDetail.titleDocuments')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {land.documents.map((doc, idx) => (
                <View
                  key={idx}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.parchment, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}
                >
                  <FileCheck size={13} color={doc.verificationStatus === 'verified' ? colors.forest : colors.inkSubtle} />
                  <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 12 }}>
                    {doc.type} · {doc.verificationStatus}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Offers & Negotiation — visible to the seller (offers received) and
            to a buyer viewing their own offer(s) on this listing. Ported
            from MboaTrustFrontend/src/screens/LandScreens.tsx's
            LandListingDetailScreen — same Accept/Counter/Decline/Withdraw/
            Fund state machine; mobile previously had none of this beyond a
            flat Accept/Decline in MyLandListingsScreen. */}
        {listingOffers.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              {isSeller ? t('landDetail.offersReceived') : t('landDetail.yourOffers')}
            </Text>
            {listingOffers.map((o) => {
              const isBuyerOfOffer = Boolean(user?._id) && user?._id === o.buyerId;
              const canRespondToPending = o.status === 'pending' && isSeller;
              const canRespondToCounter = o.status === 'countered' && isBuyerOfOffer;
              const canWithdraw = ['pending', 'countered'].includes(o.status) && isBuyerOfOffer;
              const busy = actingOn === o.id;
              return (
                <Card key={o.id} style={{ padding: 14, gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                      {fmt(o.amount)}{isSeller ? ` ${t('landDetail.fromBuyer')} ${o.buyerName}` : ''}
                    </Text>
                    <StatusBadge status={o.status} />
                  </View>
                  {o.counterAmount != null && (
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
                      {t('landDetail.counteredAt')} {fmt(o.counterAmount)}
                    </Text>
                  )}
                  {o.message ? (
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>{o.message}</Text>
                  ) : null}

                  {counteringId === o.id ? (
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
                      <TextInput
                        value={counterAmount}
                        onChangeText={(v) => setCounterAmount(v.replace(/[^0-9]/g, ''))}
                        placeholder={t('landDetail.counterAmountPlaceholder')}
                        placeholderTextColor={colors.inkSubtle}
                        keyboardType="numeric"
                        style={{
                          flex: 1,
                          backgroundColor: colors.parchment,
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          fontFamily: FONT.sans,
                          color: colors.ink,
                          fontSize: 13,
                        }}
                      />
                      <PillButton onPress={() => submitCounter(o.id)} disabled={busy || !counterAmount || Number(counterAmount) <= 0} loading={busy}>
                        {t('landDetail.send')}
                      </PillButton>
                      <PillButton variant="ghost" onPress={() => setCounteringId(null)}>
                        {t('landDetail.cancel')}
                      </PillButton>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                      {canRespondToPending && (
                        <>
                          <PillButton onPress={() => handleAccept(o.id)} disabled={busy} loading={busy}>
                            {t('landDetail.accept')}
                          </PillButton>
                          <PillButton
                            variant="secondary"
                            onPress={() => {
                              setCounteringId(o.id);
                              setCounterAmount(String(o.amount));
                            }}
                            disabled={busy}
                          >
                            {t('landDetail.counter')}
                          </PillButton>
                          <PillButton variant="ghost" onPress={() => handleDecline(o.id)} disabled={busy}>
                            {t('landDetail.decline')}
                          </PillButton>
                        </>
                      )}
                      {canRespondToCounter && (
                        <>
                          <PillButton onPress={() => handleAccept(o.id)} disabled={busy} loading={busy}>
                            {t('landDetail.acceptCounter')}
                          </PillButton>
                          <PillButton variant="ghost" onPress={() => handleDecline(o.id)} disabled={busy}>
                            {t('landDetail.decline')}
                          </PillButton>
                        </>
                      )}
                      {canWithdraw && !canRespondToCounter && (
                        <PillButton variant="ghost" onPress={() => handleWithdraw(o.id)} disabled={busy} loading={busy}>
                          {t('landDetail.withdraw')}
                        </PillButton>
                      )}
                      {o.status === 'accepted' && isBuyerOfOffer && land.linkedProjectId && (
                        <PillButton
                          onPress={() =>
                            navigation.navigate('FundProject', {
                              projectId: land.linkedProjectId!,
                              title: land.title,
                              remainingAmount: o.counterAmount ?? o.amount,
                            })
                          }
                        >
                          {t('landDetail.fundThisPurchase')}
                        </PillButton>
                      )}
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        )}

        {/* Notary Escrow Guarantee Box */}
        <Card style={{ padding: 16, backgroundColor: colors.forest + '12', borderColor: colors.forest + '30', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={22} color={colors.forest} />
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
              {t('landDetail.notaryProtocolTitle')}
            </Text>
          </View>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
            {t('landDetail.notaryProtocolDesc')}
          </Text>
        </Card>

        {/* Action Buttons — a seller viewing their own listing manages visit
            requests instead of buying/offering/messaging themselves about
            it; an unverified listing can't receive purchase offers. */}
        <View style={{ gap: 10, marginTop: 4 }}>
          {isSeller ? (
            <PillButton
              variant="secondary"
              onPress={() => navigation.navigate('ScheduleVisit', { listingId: land.id, title: land.title })}
              fullWidth
            >
              {t('landDetail.manageVisitRequests')}
            </PillButton>
          ) : (
            <>
              {land.verified && (
                <PillButton
                  variant="primary"
                  onPress={() =>
                    navigation.navigate('PurchaseOffer', {
                      listingId: land.id,
                      title: land.title,
                      askingPrice: land.price,
                    })
                  }
                  fullWidth
                >
                  {t('landDetail.makePurchaseOffer')}
                </PillButton>
              )}

              <PillButton
                variant="secondary"
                onPress={() =>
                  navigation.navigate('ScheduleVisit', {
                    listingId: land.id,
                    title: land.title,
                  })
                }
                fullWidth
              >
                {t('landDetail.scheduleVisit')}
              </PillButton>

              <PillButton
                variant="ghost"
                onPress={() => navigation.navigate('ContactSeller', { listingId: land.id })}
                fullWidth
              >
                {t('landDetail.contactSeller')}
              </PillButton>
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}
