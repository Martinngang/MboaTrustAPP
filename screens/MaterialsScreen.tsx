import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Store, Package, MapPin, Truck, CheckCircle2, ArrowRight, Hourglass, AlertCircle } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { PillButton } from '../components/PillButton';
import { useToast } from '../components/Toast';
import { fmt } from '../components/fmt';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useListBottomPadding } from '../hooks/useListBottomPadding';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useMySupplierProfileQuery } from '../api/supplierProfiles';
import { useMyInventoryQuery } from '../api/inventoryItems';
import {
  useMaterialOrdersForMySupplierQuery,
  useConfirmMaterialOrderMutation,
  useRejectMaterialOrderMutation,
  type MaterialOrderStatus,
} from '../api/materialOrders';
import { apiErrorMessage } from '../api/client';
import type { MainStackParamList } from '../navigation/types';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translations';

// Ported from MboaTrustFrontend/src/screens/SupplierScreens.tsx's
// SupplierDashboardScreen — same three real states (no application / pending
// / rejected / verified), same real order-confirm/reject actions inline,
// same inventory-summary read. Web has no separate "payouts" screen or
// manual withdraw button — the backend doesn't support supplier withdrawal
// yet (Escrow.payeeType 'supplier' exists but /escrows/withdraw only
// resolves 'contractor'/'recipient' payees) — so this only ever shows a
// real, computed "Total earnings" figure, never an invented one.
const FILTER_TABS: { id: 'requested' | 'confirmed' | 'out_for_delivery' | 'delivered'; labelKey: TranslationKey }[] = [
  { id: 'requested', labelKey: 'materials.tabNew' },
  { id: 'confirmed', labelKey: 'materials.tabConfirmed' },
  { id: 'out_for_delivery', labelKey: 'materials.tabOutForDelivery' },
  { id: 'delivered', labelKey: 'materials.tabDelivered' },
];

export function MaterialsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const [filter, setFilter] = useState<MaterialOrderStatus>('requested');
  const pullToRefresh = usePullToRefresh();
  const bottomPadding = useListBottomPadding();

  const { data: profile, isLoading: isLoadingProfile } = useMySupplierProfileQuery();
  const isVerified = profile?.verificationStatus === 'verified';

  const { data: inventorySummary } = useMyInventoryQuery({ status: 'all', limit: 1 }, isVerified);
  const { data: orders = [], isLoading: isLoadingOrders } = useMaterialOrdersForMySupplierQuery('all', isVerified);
  const confirmOrder = useConfirmMaterialOrderMutation();
  const rejectOrder = useRejectMaterialOrderMutation();

  if (isLoadingProfile) {
    return (
      <Screen>
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  if (!profile || profile.verificationStatus !== 'verified') {
    const isPending = profile?.verificationStatus === 'pending';
    const isRejected = profile?.verificationStatus === 'rejected';
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <View
            style={{
              width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
              backgroundColor: isRejected ? colors.seal + '20' : colors.steel + '20',
            }}
          >
            {isPending ? <Hourglass size={28} color={colors.steel} /> : isRejected ? <AlertCircle size={28} color={colors.seal} /> : <Store size={28} color={colors.steel} />}
          </View>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 17, textAlign: 'center' }}>
            {isPending ? t('materials.appUnderReview') : isRejected ? t('materials.registrationNotApproved') : t('materials.registerAsSupplier')}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center', maxWidth: 320 }}>
            {isPending
              ? t('materials.adminReviewingDesc')
              : isRejected
                ? t('materials.rejectedDesc')
                : t('materials.registerDesc')}
          </Text>
          {!isPending && (
            <PillButton onPress={() => navigation.navigate('QuincaillerieRegister')}>
              {isRejected ? t('materials.resubmitRegistration') : t('materials.getStarted')}
            </PillButton>
          )}
        </View>
      </Screen>
    );
  }

  const filtered = orders.filter((o) => o.status === filter);
  const earnings = orders
    .filter((o) => o.status === 'confirmed' || o.status === 'out_for_delivery' || o.status === 'delivered')
    .reduce((s, o) => s + o.totalAmount, 0);

  const handleConfirm = async (orderId: string) => {
    try {
      await confirmOrder.mutateAsync({ orderId });
      showToast({ title: t('materials.orderConfirmed'), description: t('materials.receiptGenerated'), tone: 'success' });
    } catch (err) {
      showToast({ title: t('materials.failedToConfirm'), description: apiErrorMessage(err), tone: 'error' });
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      await rejectOrder.mutateAsync({ orderId, reason: 'Item(s) currently out of stock' });
      showToast({ title: t('materials.orderRejected'), tone: 'info' });
    } catch (err) {
      showToast({ title: t('materials.failedToReject'), description: apiErrorMessage(err), tone: 'error' });
    }
  };

  return (
    <Screen scroll={false} contentContainerStyle={{ paddingBottom: 0 }}>
      <FlatList
        data={filtered}
        keyExtractor={(ord) => ord.id}
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
                <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20 }}>{profile.businessName}</Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                  {profile.address ? `${profile.address}, ` : ''}{profile.region}
                </Text>
              </View>
              <Pressable onPress={() => navigation.navigate('SupplierProfile', { supplierId: profile.id })} accessibilityRole="button">
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>{t('materials.publicProfile')}</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => navigation.navigate('InventoryCatalog')}
                style={{ flex: 1, backgroundColor: colors.forest + '15', borderWidth: 1, borderColor: colors.forest + '35', borderRadius: 16, padding: 12, gap: 4 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Package size={16} color={colors.forest} />
                  <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, fontWeight: '700' }}>{t('materials.catalog')}</Text>
                </View>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16 }}>
                  {inventorySummary?.total ?? 0} {t('materials.productsCount')}
                </Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 10 }}>{t('materials.manageCatalogue')}</Text>
              </Pressable>

              <View style={{ flex: 1, backgroundColor: colors.amber + '15', borderWidth: 1, borderColor: colors.amber + '35', borderRadius: 16, padding: 12, gap: 4 }}>
                <Text style={{ fontFamily: FONT.mono, color: colors.amber, fontSize: 10, fontWeight: '700' }}>{t('materials.earnings')}</Text>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.amber, fontSize: 16 }}>{fmt(earnings)}</Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 10 }}>{t('materials.confirmedDelivered')}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {FILTER_TABS.map((tab) => {
                const active = filter === tab.id;
                const count = orders.filter((o) => o.status === tab.id).length;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setFilter(tab.id)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1,
                      borderColor: active ? colors.amber : colors.parchmentDark,
                      backgroundColor: active ? colors.amber + '18' : colors.surface,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? colors.amber : colors.inkMuted }}>
                      {t(tab.labelKey)}{count > 0 ? ` (${count})` : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoadingOrders ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color={colors.amber} />
            </View>
          ) : (
            <EmptyState icon={Truck} title={t('materials.noOrdersHere')} description={t('materials.noOrdersDesc')} />
          )
        }
        renderItem={({ item: ord }) => (
          <Pressable
            onPress={() => navigation.navigate('MaterialOrderDetail', { orderId: ord.id })}
            accessibilityRole="button"
          >
            <Card style={{ padding: 16, gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>{ord.projectTitle}</Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                    {ord.milestoneTitle} · {t('materials.requestedBy')} {ord.requestedByName}
                  </Text>
                </View>
                <StatusBadge status={ord.status} />
              </View>

              <View style={{ backgroundColor: colors.parchment, borderRadius: 10, padding: 10, gap: 4 }}>
                {ord.items.map((it, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12 }}>{it.quantity}x {it.name}</Text>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11 }}>{fmt(it.subtotal)}</Text>
                  </View>
                ))}
              </View>

              {ord.deliveryAddress ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13} color={colors.inkSubtle} />
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>{ord.deliveryAddress}</Text>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.parchmentDark }}>
                <View>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>{t('materials.orderTotal')}</Text>
                  <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16, marginTop: 1 }}>{fmt(ord.totalAmount)}</Text>
                </View>
                {ord.status === 'requested' ? (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={() => handleReject(ord.id)}
                      disabled={confirmOrder.isPending || rejectOrder.isPending}
                      style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.seal }}
                    >
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>{t('materials.reject')}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleConfirm(ord.id)}
                      disabled={confirmOrder.isPending || rejectOrder.isPending}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.forest, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
                    >
                      <CheckCircle2 size={14} color="#fff" />
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>{t('materials.confirm')}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.amber, fontSize: 12 }}>{t('materials.manage')}</Text>
                    <ArrowRight size={14} color={colors.amber} />
                  </View>
                )}
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
