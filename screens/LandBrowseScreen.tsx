import { useState } from 'react';
import { View, Text, Pressable, TextInput, Image, ActivityIndicator, ScrollView, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MapPin, ShieldCheck, Plus, Maximize2, Tag, ArrowRight, Search, X } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { fmt } from '../components/fmt';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useListBottomPadding } from '../hooks/useListBottomPadding';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useLandListingsQuery } from '../api/land';
import { useLandOffersQuery } from '../api/landOffers';
import type { MainStackParamList } from '../navigation/types';
import { useTranslation } from '../i18n/useTranslation';

// This screen used to be a duplicate of screens/land/BrowseLandScreen.tsx —
// same query, same card layout, both reachable (one as this tab, one as an
// orphaned stack route nothing ever navigated to), with hardcoded fallback
// counts on this one ("All Plots (3)", "OFFERS (1)") that showed even when
// real data was empty. Consolidated into this one, reachable screen, taking
// the better search+region-filter UX from the dead duplicate; the duplicate
// file and its unreachable `BrowseLand` route are removed.
const REGIONS = ['All', 'Centre', 'Littoral', 'Sud', 'Ouest', 'Sud-Ouest', 'Nord-Ouest'];

// `route` is only ever populated when this screen is pushed onto MainStack
// as 'LandMarketplace' (see the Menu's "Browse land for sale" link, reachable
// by every role — mirrors web's Menu, which surfaces this to everyone except
// sellers). As the 'LandBrowse' tab (seller's own tab bar), no route params
// exist, so `fromMenu` is simply undefined there and the header is unchanged.
export function LandBrowseScreen({ route }: { route?: { params?: { fromMenu?: boolean } } } = {}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const fromMenu = route?.params?.fromMenu;
  const pullToRefresh = usePullToRefresh();
  const bottomPadding = useListBottomPadding();

  const { data: listings, isLoading: isLoadingListings } = useLandListingsQuery();
  const { data: offers } = useLandOffersQuery();

  const filtered = (listings || []).filter((l) => {
    const matchesRegion = selectedRegion === 'All' || l.region.toLowerCase() === selectedRegion.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const matchesQ = !q || l.title.toLowerCase().includes(q) || l.city.toLowerCase().includes(q);
    return matchesRegion && matchesQ;
  });

  return (
    <Screen
      scroll={false}
      contentContainerStyle={{ paddingBottom: 0 }}
      header={fromMenu ? <Header title={t('landBrowse.title')} back /> : undefined}
    >
      <FlatList
        data={filtered}
        keyExtractor={(land) => land.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
        refreshing={pullToRefresh.refreshing}
        onRefresh={pullToRefresh.onRefresh}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20 }}>{t('landBrowse.heading')}</Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                  {listings?.length ?? 0} {t('landBrowse.listingsCount')}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => navigation.navigate('CreateListing')}
                style={{ flex: 1, backgroundColor: colors.seal + '15', borderWidth: 1, borderColor: colors.seal + '35', borderRadius: 16, padding: 12, gap: 4 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Plus size={16} color={colors.seal} />
                  <Text style={{ fontFamily: FONT.mono, color: colors.seal, fontSize: 10, fontWeight: '700' }}>{t('landBrowse.publish')}</Text>
                </View>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.seal, fontSize: 16 }}>{t('landBrowse.listLand')}</Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 10 }}>{t('landBrowse.sellWithTitleDocs')}</Text>
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('MyLandListings')}
                style={{ flex: 1, backgroundColor: colors.forest + '15', borderWidth: 1, borderColor: colors.forest + '35', borderRadius: 16, padding: 12, gap: 4 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Tag size={16} color={colors.forest} />
                  <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, fontWeight: '700' }}>
                    {t('landBrowse.offers')}{offers && offers.length > 0 ? ` (${offers.length})` : ''} →
                  </Text>
                </View>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16 }}>{t('landBrowse.myWorkspace')}</Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 10 }}>{t('landBrowse.buyerProposals')}</Text>
              </Pressable>
            </View>

            <View
              style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14,
                borderWidth: 1, borderColor: colors.parchmentDark, paddingHorizontal: 12, paddingVertical: 8, gap: 8,
              }}
            >
              <Search size={18} color={colors.inkSubtle} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('landBrowse.searchPlaceholder')}
                placeholderTextColor={colors.inkSubtle}
                style={{ flex: 1, fontFamily: FONT.sans, color: colors.ink, fontSize: 13, padding: 0 }}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                  <X size={16} color={colors.inkSubtle} />
                </Pressable>
              ) : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {REGIONS.map((r) => {
                const active = selectedRegion === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setSelectedRegion(r)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1,
                      borderColor: active ? colors.seal : colors.parchmentDark,
                      backgroundColor: active ? colors.seal + '15' : colors.surface,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? colors.seal : colors.inkMuted }}>
                      {r === 'All' ? t('landBrowse.allRegions') : r}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          isLoadingListings ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color={colors.seal} />
            </View>
          ) : (
            <EmptyState icon={MapPin} title={t('landBrowse.noListingsFound')} description={t('landBrowse.noListingsDesc')} />
          )
        }
        renderItem={({ item: land }) => (
          <Pressable onPress={() => navigation.navigate('LandListingDetail', { listingId: land.id })} accessibilityRole="button">
            <Card style={{ overflow: 'hidden' }}>
              <View style={{ height: 150, backgroundColor: colors.parchment, position: 'relative' }}>
                <Image source={{ uri: land.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                {land.verified && (
                  <View
                    style={{
                      position: 'absolute', top: 10, left: 10, backgroundColor: colors.forest,
                      flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                    }}
                  >
                    <ShieldCheck size={12} color="#fff" />
                    <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 10, fontWeight: '700' }}>{t('landBrowse.verified')}</Text>
                  </View>
                )}
              </View>

              <View style={{ padding: 14, gap: 10 }}>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15 }} numberOfLines={2}>{land.title}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} color={colors.inkSubtle} />
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>{land.city} ({land.region})</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Maximize2 size={12} color={colors.seal} />
                    <Text style={{ fontFamily: FONT.mono, color: colors.seal, fontSize: 11, fontWeight: '700' }}>{land.sizeSqm} m²</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.parchmentDark }}>
                  <View>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>{t('landBrowse.askingPrice')}</Text>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16, marginTop: 1 }}>{fmt(land.price)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>{t('landBrowse.inspectPlot')}</Text>
                    <ArrowRight size={13} color={colors.seal} />
                  </View>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
