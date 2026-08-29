import { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  MapPin,
  Maximize2,
  ShieldCheck,
  Calendar,
  Phone,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Compass,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { PillButton } from '../../components/PillButton';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useLandListingDetailQuery } from '../../api/land';
import type { MainStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<MainStackParamList, 'LandListingDetail'>;

export function LandListingDetailScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { listingId } = route.params;

  const { data: land, isLoading } = useLandListingDetailQuery(listingId);

  if (isLoading || !land) {
    return (
      <Screen header={<Header title="Land Dossier" back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.seal} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title="Plot Dossier" subtitle={`${land.city}, ${land.region}`} back />}>
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
                {land.titleNumber}
              </Text>
            </View>
            <View style={{ position: 'absolute', top: 12, right: 12 }}>
              <StatusBadge status={land.status} />
            </View>
          </View>

          {/* Details Body */}
          <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 19 }}>
              {land.title}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} color={colors.inkSubtle} />
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>
                  {land.neighborhood ? `${land.neighborhood}, ` : ''}{land.city}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Compass size={14} color={colors.seal} />
                <Text style={{ fontFamily: FONT.mono, color: colors.seal, fontSize: 12 }}>
                  {land.coordinates.lat}° N, {land.coordinates.lng}° E
                </Text>
              </View>
            </View>

            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, lineHeight: 19 }}>
              {land.description}
            </Text>
          </View>
        </Card>

        {/* Pricing & Dimensions Card */}
        <Card style={{ padding: 16, gap: 14 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Pricing & Cadastral Area
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                Total Asking Price
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 22, marginTop: 2 }}>
                {fmt(land.price)}
              </Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                Surface Area
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.seal, fontSize: 18, marginTop: 2 }}>
                {land.sizeSqm} m²
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                Price / m²
              </Text>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14, marginTop: 2 }}>
                {fmt(land.pricePerSqm)}/m²
              </Text>
            </View>
          </View>
        </Card>

        {/* Terrain Features & Amenities */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Parcel Features & Accessibility
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {land.features.map((feat, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: colors.parchment,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 10,
                }}
              >
                <CheckCircle2 size={13} color={colors.forest} />
                <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 12 }}>
                  {feat}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Notary Escrow Guarantee Box */}
        <Card style={{ padding: 16, backgroundColor: colors.forest + '12', borderColor: colors.forest + '30', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={22} color={colors.forest} />
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
              Protected Notary Escrow Protocol
            </Text>
          </View>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
            Buyer purchase funds are held securely in MboaTrust Escrow and only disbursed to the seller once the sworn Notary confirms official cadastral title deed transfer.
          </Text>
        </Card>

        {/* Action Buttons */}
        <View style={{ gap: 10, marginTop: 4 }}>
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
            Make a Purchase Offer
          </PillButton>

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
            Schedule On-Site Visit
          </PillButton>
        </View>
      </View>
    </Screen>
  );
}
