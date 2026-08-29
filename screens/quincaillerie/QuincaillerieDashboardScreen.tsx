import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Store,
  Truck,
  Plus,
  Package,
  CreditCard,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Phone,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { PillButton } from '../../components/PillButton';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import {
  useMyQuincaillerieProfileQuery,
  useMaterialOrdersQuery,
  useConfirmMaterialOrderMutation,
} from '../../api/materials';
import type { MainStackParamList } from '../../navigation/types';

export function QuincaillerieDashboardScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { data: profile, isLoading: isLoadingProfile } = useMyQuincaillerieProfileQuery();
  const { data: orders, isLoading: isLoadingOrders } = useMaterialOrdersQuery();
  const confirmMutation = useConfirmMaterialOrderMutation();

  const pendingOrders = (orders || []).filter((o) => o.status === 'requested');

  const handleConfirmOrder = async (orderId: string, orderNumber: string) => {
    try {
      await confirmMutation.mutateAsync(orderId);
      showToast({
        title: 'Order Confirmed!',
        description: `Order ${orderNumber} is confirmed and preparing for dispatch.`,
        tone: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Confirmation Failed',
        description: err?.message || 'Could not confirm order.',
        tone: 'error',
      });
    }
  };

  return (
    <Screen
      header={
        <Header
          title={profile?.businessName || 'Supplier Workspace'}
          subtitle={`${profile?.address || 'Yaoundé'} · Verified Store`}
          back
        />
      }
    >
      <View style={{ padding: 16, gap: 18 }}>
        {/* Store Hero Card */}
        <Card style={{ padding: 18, backgroundColor: colors.amber + '20', borderColor: colors.amber + '50', gap: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Store size={18} color={colors.ink} />
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                {profile?.businessName || 'Quincaillerie Centrale'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.forest + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <ShieldCheck size={12} color={colors.forest} />
              <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, fontWeight: '700' }}>
                Verified
              </Text>
            </View>
          </View>

          {/* 3 Metric Tiles */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: colors.parchmentDark }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase' }}>
                Pending Orders
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.amber, fontSize: 16, marginTop: 2 }}>
                {pendingOrders.length} New
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: colors.parchmentDark }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase' }}>
                Locked in Escrow
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 14, marginTop: 2 }}>
                {fmt(profile?.pendingEscrow || 1446500)}
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: colors.parchmentDark }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase' }}>
                Settled Revenue
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 14, marginTop: 2 }}>
                {fmt(profile?.totalRevenue || 4200000)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Quick Action Grid */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Store Management
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => navigation.navigate('MaterialOrders')}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.parchmentDark,
                borderRadius: 14,
                padding: 12,
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Truck size={20} color={colors.amber} />
              <Text style={{ fontFamily: FONT.mono, color: colors.ink, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
                Supply Orders
              </Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('InventoryCatalog')}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.parchmentDark,
                borderRadius: 14,
                padding: 12,
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Package size={20} color={colors.forest} />
              <Text style={{ fontFamily: FONT.mono, color: colors.ink, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
                Material Catalog
              </Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('QuincailleriePayouts')}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.parchmentDark,
                borderRadius: 14,
                padding: 12,
                alignItems: 'center',
                gap: 6,
              }}
            >
              <CreditCard size={20} color={colors.steel} />
              <Text style={{ fontFamily: FONT.mono, color: colors.ink, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
                MoMo Payouts
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Urgent Pending Supply Orders */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Orders Awaiting Confirmation ({pendingOrders.length})
            </Text>
            <Pressable onPress={() => navigation.navigate('MaterialOrders')}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.amber, fontSize: 12 }}>
                View All →
              </Text>
            </Pressable>
          </View>

          {isLoadingOrders ? (
            <ActivityIndicator color={colors.amber} style={{ marginTop: 20 }} />
          ) : pendingOrders.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="All orders dispatched"
              description="New material purchase orders from construction sites will appear here with direct escrow lock."
            />
          ) : (
            pendingOrders.map((order) => (
              <Card key={order.id} style={{ padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.mono, color: colors.amber, fontSize: 10, fontWeight: '700' }}>
                      {order.orderNumber}
                    </Text>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15, marginTop: 2 }}>
                      {order.projectTitle}
                    </Text>
                  </View>
                  <StatusBadge status={order.status} />
                </View>

                {/* Line items summary */}
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

                {/* Delivery Location */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} color={colors.inkSubtle} />
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                    {order.deliveryAddress}
                  </Text>
                </View>

                {/* Footer with Price & Actions */}
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
                      Escrow Order Total
                    </Text>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16, marginTop: 1 }}>
                      {fmt(order.totalAmount)}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => handleConfirmOrder(order.id, order.orderNumber)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: colors.forest,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                    }}
                  >
                    <CheckCircle2 size={14} color="#fff" />
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>
                      Confirm & Prepare
                    </Text>
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </View>
      </View>
    </Screen>
  );
}
