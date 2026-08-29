import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  ShieldCheck,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useMaterialOrdersQuery, type MaterialOrder } from '../../api/materials';
import type { MainStackParamList } from '../../navigation/types';

const FILTER_TABS = ['All', 'Requested', 'Dispatched', 'Delivered'] as const;

export function MaterialOrdersScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [activeTab, setActiveTab] = useState<(typeof FILTER_TABS)[number]>('All');

  const { data: orders, isLoading } = useMaterialOrdersQuery();

  const filteredOrders = (orders || []).filter((o) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Requested') return o.status === 'requested' || o.status === 'confirmed';
    if (activeTab === 'Dispatched') return o.status === 'dispatched';
    if (activeTab === 'Delivered') return o.status === 'delivered';
    return true;
  });

  return (
    <Screen header={<Header title="Supply Orders" subtitle={`${filteredOrders.length} orders`} back />}>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {FILTER_TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? colors.amber : colors.parchmentDark,
                  backgroundColor: active ? colors.amber + '18' : colors.surface,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT.sansMedium,
                    fontSize: 12,
                    color: active ? colors.amber : colors.inkMuted,
                  }}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Orders List */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.amber} />
          </View>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No orders found"
            description="Material orders requested by construction site contractors will appear here."
          />
        ) : (
          filteredOrders.map((order) => (
            <Pressable
              key={order.id}
              onPress={() => navigation.navigate('MaterialOrderDetail', { orderId: order.id })}
              accessibilityRole="button"
            >
              <Card style={{ padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.mono, color: colors.amber, fontSize: 10, fontWeight: '700' }}>
                      {order.orderNumber}
                    </Text>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16, marginTop: 2 }}>
                      {order.projectTitle}
                    </Text>
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                      Milestone: {order.milestoneTitle}
                    </Text>
                  </View>
                  <StatusBadge status={order.status} />
                </View>

                {/* Items preview */}
                <View style={{ backgroundColor: colors.parchment, borderRadius: 10, padding: 10, gap: 4 }}>
                  {order.items.map((it) => (
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

                {/* Location */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} color={colors.inkSubtle} />
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                    {order.deliveryAddress}
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
                      Escrow Guaranteed Total
                    </Text>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16, marginTop: 1 }}>
                      {fmt(order.totalAmount)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.amber, fontSize: 12 }}>
                      View Details
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
