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
import {
  useLandListingsQuery,
  useLandOffersQuery,
  useAcceptLandOfferMutation,
  type LandOffer,
} from '../../api/land';
import type { MainStackParamList } from '../../navigation/types';

export function MyLandListingsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'listings' | 'offers'>('listings');

  const { data: listings, isLoading: isLoadingListings } = useLandListingsQuery();
  const { data: offers, isLoading: isLoadingOffers } = useLandOffersQuery();
  const acceptOfferMutation = useAcceptLandOfferMutation();

  const handleAcceptOffer = async (offerId: string, buyerName: string, amount: number) => {
    try {
      await acceptOfferMutation.mutateAsync(offerId);
      showToast({
        title: 'Offer Accepted!',
        description: `Accepted ${fmt(amount)} from ${buyerName}. Notary escrow protocol initiated.`,
        tone: 'success',
      });
    } catch (err: any) {
      showToast({ title: 'Error', description: err?.message || 'Could not accept offer.', tone: 'error' });
    }
  };

  return (
    <Screen
      header={
        <Header
          title="Land Seller Workspace"
          subtitle="Manage listings & purchase offers"
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
                List Land
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
            { id: 'listings', label: `My Plots (${listings?.length || 3})` },
            { id: 'offers', label: `Incoming Offers (${offers?.length || 1})` },
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
                title="No plots listed yet"
                description="Publish your land with verified Titre Foncier to receive diaspora purchase offers."
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
                          {land.titleNumber}
                        </Text>
                        <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14, marginTop: 2 }}>
                          {land.title}
                        </Text>
                      </View>
                      <StatusBadge status={land.status} />
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
                          Manage
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
            ) : (offers || []).length === 0 ? (
              <EmptyState
                icon={Tag}
                title="No purchase offers yet"
                description="Buyer escrow proposals will appear here."
              />
            ) : (
              (offers || []).map((offer) => (
                <Card key={offer.id} style={{ padding: 16, gap: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
                        {offer.buyerName}
                      </Text>
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                        Target: {offer.listingTitle}
                      </Text>
                    </View>
                    <StatusBadge status={offer.status} />
                  </View>

                  <View style={{ backgroundColor: colors.parchment, borderRadius: 10, padding: 10, gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>Offered Price:</Text>
                      <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 15 }}>
                        {fmt(offer.proposedPrice)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11 }}>Asking Price:</Text>
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11 }}>
                        {fmt(offer.askingPrice)}
                      </Text>
                    </View>
                  </View>

                  {offer.notes && (
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
                      "{offer.notes}"
                    </Text>
                  )}

                  {offer.status === 'pending' && (
                    <View style={{ flexDirection: 'row', gap: 8, paddingTop: 4 }}>
                      <Pressable
                        onPress={() => handleAcceptOffer(offer.id, offer.buyerName, offer.proposedPrice)}
                        style={{
                          flex: 1,
                          backgroundColor: colors.forest,
                          paddingVertical: 8,
                          borderRadius: 10,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>
                          Accept & Escrow
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => showToast({ title: 'Offer Declined', description: 'Buyer has been informed.', tone: 'neutral' })}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: colors.parchment,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.inkMuted, fontSize: 12 }}>
                          Decline
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </Card>
              ))
            )}
          </View>
        )}
      </View>
    </Screen>
  );
}
