import { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  MapPin,
  ShieldCheck,
  Plus,
  Maximize2,
  Tag,
  ArrowRight,
  Compass,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { fmt } from '../components/fmt';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useLandListingsQuery, useLandOffersQuery, type LandListing } from '../api/land';
import type { MainStackParamList } from '../navigation/types';

export function LandBrowseScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [filter, setFilter] = useState<'all' | 'verified' | 'offers'>('all');

  const { data: listings, isLoading: isLoadingListings } = useLandListingsQuery();
  const { data: offers, isLoading: isLoadingOffers } = useLandOffersQuery();

  const filtered = (listings || []).filter((l) => {
    if (filter === 'all') return true;
    if (filter === 'verified') return l.verified;
    return true;
  });

  return (
    <Screen>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Title Bar */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20 }}>
              Land & Real Estate
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
              Verified plots protected by notary escrow
            </Text>
          </View>
        </View>

        {/* Quick Action Shortcuts */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={() => navigation.navigate('CreateListing')}
            style={{
              flex: 1,
              backgroundColor: colors.seal + '15',
              borderWidth: 1,
              borderColor: colors.seal + '35',
              borderRadius: 16,
              padding: 12,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Plus size={16} color={colors.seal} />
              <Text style={{ fontFamily: FONT.mono, color: colors.seal, fontSize: 10, fontWeight: '700' }}>
                PUBLISH →
              </Text>
            </View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.seal, fontSize: 16 }}>
              List Land
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 10 }}>
              Sell with Titre Foncier
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('MyLandListings')}
            style={{
              flex: 1,
              backgroundColor: colors.forest + '15',
              borderWidth: 1,
              borderColor: colors.forest + '35',
              borderRadius: 16,
              padding: 12,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Tag size={16} color={colors.forest} />
              <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, fontWeight: '700' }}>
                OFFERS ({offers?.length || 1}) →
              </Text>
            </View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16 }}>
              My Workspace
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 10 }}>
              Buyer Purchase Proposals
            </Text>
          </Pressable>
        </View>

        {/* Filter Chips */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { id: 'all', label: `All Plots (${listings?.length || 3})` },
            { id: 'verified', label: 'Titre Foncier Vérifié' },
          ].map((tab) => {
            const active = filter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setFilter(tab.id as any)}
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

        {/* Plots List */}
        {isLoadingListings ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.seal} />
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No land listings found"
            description="Plots for sale with verified cadastral deeds will appear here."
          />
        ) : (
          filtered.map((land) => (
            <Pressable
              key={land.id}
              onPress={() => navigation.navigate('LandListingDetail', { listingId: land.id })}
              accessibilityRole="button"
            >
              <Card style={{ overflow: 'hidden' }}>
                <View style={{ height: 150, backgroundColor: colors.parchment, position: 'relative' }}>
                  <Image source={{ uri: land.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <View
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      backgroundColor: colors.forest,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                    }}
                  >
                    <ShieldCheck size={12} color="#fff" />
                    <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 10, fontWeight: '700' }}>
                      {land.titleNumber}
                    </Text>
                  </View>
                  <View style={{ position: 'absolute', top: 10, right: 10 }}>
                    <StatusBadge status={land.status} />
                  </View>
                </View>

                <View style={{ padding: 14, gap: 10 }}>
                  <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15 }} numberOfLines={2}>
                    {land.title}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} color={colors.inkSubtle} />
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                        {land.city} ({land.region})
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Maximize2 size={12} color={colors.seal} />
                      <Text style={{ fontFamily: FONT.mono, color: colors.seal, fontSize: 11, fontWeight: '700' }}>
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
                    <View>
                      <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                        Asking Price
                      </Text>
                      <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16, marginTop: 1 }}>
                        {fmt(land.price)}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>
                        Inspect Plot
                      </Text>
                      <ArrowRight size={13} color={colors.seal} />
                    </View>
                  </View>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}
