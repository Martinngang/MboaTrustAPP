import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Store,
  Package,
  MapPin,
  Truck,
  CheckCircle2,
  CreditCard,
  Plus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { fmt } from '../components/fmt';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useMyQuincaillerieProfileQuery, useMaterialOrdersQuery, type MaterialOrder } from '../api/materials';
import type { MainStackParamList } from '../navigation/types';

export function MaterialsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [filter, setFilter] = useState<'all' | 'requested' | 'confirmed' | 'dispatched'>('all');

  const { data: profile } = useMyQuincaillerieProfileQuery();
  const { data: orders, isLoading } = useMaterialOrdersQuery();

  const filtered = (orders || []).filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'requested') return o.status === 'requested';
    if (filter === 'confirmed') return o.status === 'confirmed';
    if (filter === 'dispatched') return o.status === 'dispatched';
    return true;
  });

  return (
    <Screen>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Title Bar */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20 }}>
              Supplier Workspace
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
              Fulfill material orders with direct escrow protection
            </Text>
          </View>
        </View>

        {/* Quick Action Shortcuts */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={() => navigation.navigate('InventoryCatalog')}
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
              <Package size={16} color={colors.forest} />
              <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, fontWeight: '700' }}>
                CATALOG →
              </Text>
            </View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16 }}>
              6 Categories
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 10 }}>
              Pricing & Warehouse Stock
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('QuincailleriePayouts')}
            style={{
              flex: 1,
              backgroundColor: colors.amber + '15',
              borderWidth: 1,
              borderColor: colors.amber + '35',
              borderRadius: 16,
              padding: 12,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <CreditCard size={16} color={colors.amber} />
              <Text style={{ fontFamily: FONT.mono, color: colors.amber, fontSize: 10, fontWeight: '700' }}>
                PAYOUTS →
              </Text>
            </View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.amber, fontSize: 16 }}>
              {fmt(profile?.availablePayout || 2753500)}
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 10 }}>
              Available Store Settlement
            </Text>
          </Pressable>
        </View>

        {/* Filter Chips */}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${orders?.length || 2})` },
            { id: 'requested', label: 'Requested' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'dispatched', label: 'Dispatched' },
          ].map((tab) => {
            const active = filter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setFilter(tab.id as any)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? colors.amber : colors.parchmentDark,
                  backgroundColor: active ? colors.amber + '18' : colors.surface,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT.sansMedium,
                    fontSize: 12,
                    color: active ? colors.amber : colors.inkMuted,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Order Cards */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.amber} />
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No orders found"
            description="Material requests from construction sites will appear here."
          />
        ) : (
          filtered.map((ord) => (
            <Pressable
              key={ord.id}
              onPress={() => navigation.navigate('MaterialOrderDetail', { orderId: ord.id })}
              accessibilityRole="button"
            >
              <Card style={{ padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.mono, color: colors.amber, fontSize: 11, fontWeight: '700' }}>
                      {ord.orderNumber}
                    </Text>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16, marginTop: 2 }}>
                      {ord.projectTitle}
                    </Text>
                  </View>
                  <StatusBadge status={ord.status} />
                </View>

                {/* Items Summary */}
                <View style={{ backgroundColor: colors.parchment, borderRadius: 10, padding: 10, gap: 4 }}>
                  {ord.items.map((it) => (
                    <View key={it.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12 }}>
                        {it.quantity}x {it.name}
                      </Text>
                      <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11 }}>
                        {fmt(it.totalPrice)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13} color={colors.inkSubtle} />
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                    {ord.deliveryAddress}
                  </Text>
                </View>

                {/* Footer */}
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
                      Total Escrow Value
                    </Text>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 15, marginTop: 2 }}>
                      {fmt(ord.totalAmount)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.amber, fontSize: 12 }}>
                      Manage Order
                    </Text>
                    <ArrowRight size={14} color={colors.amber} />
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
