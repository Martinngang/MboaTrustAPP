import { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  MapPin,
  Maximize2,
  ShieldCheck,
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileCheck,
  Tag,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useLandListingsQuery } from '../../api/land';
import { useLandOffersQuery, useAcceptOfferMutation, useDeclineOfferMutation } from '../../api/landOffers';
import { apiErrorMessage } from '../../api/client';
import { useApp } from '../../context/AppContext';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

export function MyLandListingsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const { user } = useApp();

  const [activeTab, setActiveTab] = useState<'listings' | 'offers'>('listings');

  // Scoped to this seller's own plots — the endpoint returns every listing
  // on the platform when called with no filter (it's also the public
  // marketplace's own query, see LandBrowseScreen), so this used to show
  // everyone's land, not just the current user's.
  const { data: listings, isLoading: isLoadingListings } = useLandListingsQuery({ sellerId: user?._id });
  const { data: offers, isLoading: isLoadingOffers } = useLandOffersQuery();
  const acceptOfferMutation = useAcceptOfferMutation();
  const declineOfferMutation = useDeclineOfferMutation();

  // The real LandOffer only carries listingId — its title/asking price are
  // looked up from the listings already loaded on this same screen, rather
  // than inventing display fields the backend doesn't return.
  const listingById = new Map((listings || []).map((l) => [l.id, l]));
  // /land-offers with no filter returns every offer the caller is party to,
  // as buyer OR seller — this screen is "my listings", so "Incoming Offers"
  // means seller-side only. Without this, an offer the current user made as
  // a *buyer* on someone else's plot would show up here too, with
  // Accept/Decline buttons that hit seller-only endpoints.
  const incomingOffers = (offers || []).filter((o) => listingById.has(o.listingId));

  const handleAcceptOffer = async (offerId: string, buyerName: string, amount: number) => {
    try {
      await acceptOfferMutation.mutateAsync(offerId);
      showToast({
        title: t('myLandListings.offerAccepted'),
        description: `${t('myLandListings.acceptedFrom')} ${fmt(amount)} ${t('myLandListings.fromBuyer')} ${buyerName}. ${t('myLandListings.fundingProjectCreated')}`,
        tone: 'success',
      });
    } catch (err) {
      showToast({ title: t('myLandListings.error'), description: apiErrorMessage(err, t('myLandListings.couldNotAccept')), tone: 'error' });
    }
  };

  const handleDeclineOffer = async (offerId: string) => {
    try {
      await declineOfferMutation.mutateAsync(offerId);
      showToast({ title: t('myLandListings.offerDeclined'), description: t('myLandListings.buyerNotified'), tone: 'neutral' });
    } catch (err) {
      showToast({ title: t('myLandListings.error'), description: apiErrorMessage(err, t('myLandListings.couldNotDecline')), tone: 'error' });
    }
  };

  return (
    <Screen
      header={
        <Header
          title={t('myLandListings.title')}
          subtitle={t('myLandListings.subtitle')}
          back
          action={
            <Pressable
              onPress={() => navigation.navigate('CreateListing')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 14,
                backgroundColor: colors.seal,
              }}
            >
              <Plus size={14} color="#fff" strokeWidth={2.5} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>
                {t('myLandListings.listLand')}
              </Text>
            </Pressable>
          }
        />
      }
    >
      <View style={{ padding: 16, gap: 16 }}>
        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { id: 'listings', label: `${t('myLandListings.myPlots')} (${listings?.length ?? 0})` },
            { id: 'offers', label: `${t('myLandListings.incomingOffers')} (${incomingOffers.length})` },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id as any)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? colors.seal : colors.parchmentDark,
                  backgroundColor: active ? colors.seal + '18' : colors.surface,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT.sansMedium,
                    fontSize: 12,
                    color: active ? colors.seal : colors.inkMuted,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* My Plots Tab */}
        {activeTab === 'listings' && (
          <View style={{ gap: 12 }}>
            {isLoadingListings ? (
              <ActivityIndicator color={colors.seal} style={{ marginTop: 20 }} />
            ) : (listings || []).length === 0 ? (
              <EmptyState
                icon={MapPin}
                title={t('myLandListings.noPlotsListed')}
                description={t('myLandListings.noPlotsDesc')}
              />
            ) : (
              (listings || []).map((land) => (
                <Pressable
                  key={land.id}
                  onPress={() => navigation.navigate('LandListingDetail', { listingId: land.id })}
                  accessibilityRole="button"
                >
                  <Card style={{ padding: 14, gap: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, fontWeight: '700' }}>
                          {land.titleType}
                        </Text>
                        <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14, marginTop: 2 }}>
                          {land.title}
                        </Text>
                      </View>
                      <StatusBadge status={land.verificationStatus} />
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} color={colors.inkSubtle} />
                        <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                          {land.city} ({land.region})
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Maximize2 size={12} color={colors.seal} />
                        <Text style={{ fontFamily: FONT.mono, color: colors.seal, fontSize: 12, fontWeight: '700' }}>
                          {land.sizeSqm} m²
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: 8,
                        borderTopWidth: 1,
                        borderTopColor: colors.parchmentDark,
                      }}
                    >
                      <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 15 }}>
                        {fmt(land.price)}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>
                          {t('myLandListings.manage')}
                        </Text>
                        <ArrowRight size={13} color={colors.seal} />
                      </View>
                    </View>
                  </Card>
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* Incoming Offers Tab */}
        {activeTab === 'offers' && (
          <View style={{ gap: 12 }}>
            {isLoadingOffers ? (
              <ActivityIndicator color={colors.seal} style={{ marginTop: 20 }} />
            ) : incomingOffers.length === 0 ? (
              <EmptyState
                icon={Tag}
                title={t('myLandListings.noOffersYet')}
                description={t('myLandListings.noOffersDesc')}
              />
            ) : (
              incomingOffers.map((offer) => {
                const listing = listingById.get(offer.listingId);
                return (
                  <Card key={offer.id} style={{ padding: 16, gap: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
                          {offer.buyerName}
                        </Text>
                        <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                          {t('myLandListings.target')} {listing?.title ?? t('myLandListings.listingFallback')}
                        </Text>
                      </View>
                      <StatusBadge status={offer.status} />
                    </View>

                    <View style={{ backgroundColor: colors.parchment, borderRadius: 10, padding: 10, gap: 4 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>{t('myLandListings.offeredPrice')}</Text>
                        <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 15 }}>
                          {fmt(offer.amount)}
                        </Text>
                      </View>
                      {listing && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11 }}>{t('myLandListings.askingPrice')}</Text>
                          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11 }}>
                            {fmt(listing.price)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {offer.message && (
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
                        "{offer.message}"
                      </Text>
                    )}

                    {offer.status === 'pending' && (
                      <View style={{ flexDirection: 'row', gap: 8, paddingTop: 4 }}>
                        <Pressable
                          onPress={() => handleAcceptOffer(offer.id, offer.buyerName, offer.amount)}
                          disabled={acceptOfferMutation.isPending || declineOfferMutation.isPending}
                          style={{
                            flex: 1,
                            backgroundColor: colors.forest,
                            paddingVertical: 8,
                            borderRadius: 10,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>
                            {t('myLandListings.accept')}
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => handleDeclineOffer(offer.id)}
                          disabled={acceptOfferMutation.isPending || declineOfferMutation.isPending}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 10,
                            backgroundColor: colors.parchment,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.inkMuted, fontSize: 12 }}>
                            {t('myLandListings.decline')}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </Card>
                );
              })
            )}
          </View>
        )}
      </View>
    </Screen>
  );
}
