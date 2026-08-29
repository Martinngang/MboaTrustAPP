import { useState } from 'react';
import { View, Text, Pressable, TextInput, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Search,
  X,
  MapPin,
  Plus,
  ShieldCheck,
  ArrowRight,
  Maximize2,
  CheckCircle2,
  FileCheck,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useLandListingsQuery, type LandListing } from '../../api/land';
import type { MainStackParamList } from '../../navigation/types';

const REGIONS = ['All', 'Centre', 'Littoral', 'Sud', 'Ouest', 'Sud-Ouest', 'Nord-Ouest'];

export function BrowseLandScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const [selectedRegion, setSelectedRegion] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: listings, isLoading } = useLandListingsQuery();

  const filteredListings = (listings || []).filter((l) => {
    const matchesRegion = selectedRegion === 'All' || l.region.toLowerCase() === selectedRegion.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const matchesQ =
      !q ||
      l.title.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q) ||
      l.neighborhood.toLowerCase().includes(q) ||
      l.titleNumber.toLowerCase().includes(q);
    return matchesRegion && matchesQ;
  });

  return (
    <Screen
      header={
        <Header
          title="Land & Properties"
          subtitle={`${filteredListings.length} verified plots`}
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
                New Listing
              </Text>
            </Pressable>
          }
        />
      }
    >
      <View style={{ padding: 16, gap: 16 }}>
        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.parchmentDark,
            paddingHorizontal: 12,
            paddingVertical: 8,
            gap: 8,
          }}
        >
          <Search size={18} color={colors.inkSubtle} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by city, title deed number..."
            placeholderTextColor={colors.inkSubtle}
            style={{
              flex: 1,
              fontFamily: FONT.sans,
              color: colors.ink,
              fontSize: 13,
              padding: 0,
            }}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
              <X size={16} color={colors.inkSubtle} />
            </Pressable>
          ) : null}
        </View>

        {/* Region Filter Chips */}
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
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? colors.seal : colors.parchmentDark,
                  backgroundColor: active ? colors.seal + '15' : colors.surface,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT.sansMedium,
                    fontSize: 12,
                    color: active ? colors.seal : colors.inkMuted,
                  }}
                >
                  {r === 'All' ? 'All Regions' : `${r} Region`}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Land Listings Grid */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.seal} />
          </View>
        ) : filteredListings.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No plots found"
            description="Try selecting a different region or clearing your search."
          />
        ) : (
          filteredListings.map((land) => (
            <Pressable
              key={land.id}
              onPress={() => navigation.navigate('LandListingDetail', { listingId: land.id })}
              accessibilityRole="button"
            >
              <Card style={{ overflow: 'hidden' }}>
                {/* Land Image Banner */}
                <View style={{ height: 160, backgroundColor: colors.parchment, position: 'relative' }}>
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

                {/* Details Body */}
                <View style={{ padding: 14, gap: 10 }}>
                  <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }} numberOfLines={2}>
                    {land.title}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} color={colors.inkSubtle} />
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                        {land.neighborhood ? `${land.neighborhood}, ` : ''}{land.city} ({land.region})
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Maximize2 size={12} color={colors.seal} />
                      <Text style={{ fontFamily: FONT.mono, color: colors.seal, fontSize: 12, fontWeight: '700' }}>
                        {land.sizeSqm} m²
                      </Text>
                    </View>
                  </View>

                  {/* Price & Notary Guarantee */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: colors.parchmentDark,
                    }}
                  >
                    <View>
                      <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                        Asking Price ({fmt(land.pricePerSqm)}/m²)
                      </Text>
                      <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 17, marginTop: 1 }}>
                        {fmt(land.price)}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>
                        View Dossier
                      </Text>
                      <ArrowRight size={14} color={colors.seal} />
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
