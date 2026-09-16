import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator } from 'react-native';
import { Truck, MapPin, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react-native';
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
  useMaterialOrdersForMySupplierQuery,
  useConfirmMaterialOrderMutation,
  useRejectMaterialOrderMutation,
  useMarkOrderOutForDeliveryMutation,
} from '../../api/materialOrders';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'MaterialOrderDetail'>;

// Ported from the real backend lifecycle in materialOrderController.js —
// requested -> confirmed -> out_for_delivery -> delivered, plus
// requested -> rejected and requested -> cancelled. The previous version of
// this screen had a "QR pickup voucher" and "waybill photo upload" flow with
// no backend endpoint behind either of them (fabricated — no QR/blockchain
// concept exists anywhere in this backend); both are gone. "Confirm
// delivery" (the last step) belongs to whoever received the materials on
// site (the project owner or awarded contractor, via geotag), not the
// supplier, so it isn't an action offered from this — the supplier's own —
// screen.
export function MaterialOrderDetailScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { orderId } = route.params;
  const { data: orders, isLoading } = useMaterialOrdersForMySupplierQuery('all');
  const confirmMutation = useConfirmMaterialOrderMutation();
  const rejectMutation = useRejectMaterialOrderMutation();
  const outForDeliveryMutation = useMarkOrderOutForDeliveryMutation();

  const order = (orders || []).find((o) => o.id === orderId);

  if (isLoading) {
    return (
      <Screen header={<Header title={t('materialOrderDetail.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.amber} />
        </View>
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen header={<Header title={t('materialOrderDetail.title')} back />}>
        <View style={{ padding: 24 }}>
          <EmptyState icon={Truck} title={t('materialOrderDetail.orderNotFound')} description={t('materialOrderDetail.orderNotFoundDesc')} />
        </View>
      </Screen>
    );
  }

  const isRequested = order.status === 'requested';
  const isConfirmed = order.status === 'confirmed';
  const isOutForDelivery = order.status === 'out_for_delivery';
  const isDelivered = order.status === 'delivered';
  const isRejected = order.status === 'rejected';
  const isCancelled = order.status === 'cancelled';
  const anyActionPending = confirmMutation.isPending || rejectMutation.isPending || outForDeliveryMutation.isPending;

  const handleConfirm = async () => {
    try {
      await confirmMutation.mutateAsync({ orderId: order.id });
      showToast({ title: t('materialOrderDetail.orderConfirmed'), description: t('materialOrderDetail.prepareForPickup'), tone: 'success' });
    } catch (err) {
      showToast({ title: t('materialOrderDetail.failedToConfirm'), description: apiErrorMessage(err), tone: 'error' });
    }
  };

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync({ orderId: order.id, reason: 'Item(s) currently out of stock' });
      showToast({ title: t('materialOrderDetail.orderRejected'), tone: 'info' });
    } catch (err) {
      showToast({ title: t('materialOrderDetail.failedToReject'), description: apiErrorMessage(err), tone: 'error' });
    }
  };

  const handleMarkOutForDelivery = async () => {
    try {
      await outForDeliveryMutation.mutateAsync(order.id);
      showToast({ title: t('materialOrderDetail.markedOutForDelivery'), description: t('materialOrderDetail.requesterWillConfirm'), tone: 'success' });
    } catch (err) {
      showToast({ title: t('materialOrderDetail.failedToUpdate'), description: apiErrorMessage(err), tone: 'error' });
    }
  };

  return (
    <Screen header={<Header title={order.projectTitle} subtitle={order.milestoneTitle} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Card style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>{order.projectTitle}</Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                {order.milestoneTitle} · {t('materialOrderDetail.requestedBy')} {order.requestedByName}
              </Text>
            </View>
            <StatusBadge status={order.status} />
          </View>

          {order.deliveryAddress ? (
            <View style={{ backgroundColor: colors.parchment, borderRadius: 12, padding: 12, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color={colors.amber} />
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>{t('materialOrderDetail.deliveryAddress')}</Text>
              </View>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>{order.deliveryAddress}</Text>
            </View>
          ) : null}

          {order.rejectionReason ? (
            <View style={{ backgroundColor: colors.seal + '15', borderRadius: 12, padding: 12 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>{t('materialOrderDetail.rejectionReason')}</Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, marginTop: 2 }}>{order.rejectionReason}</Text>
            </View>
          ) : null}
        </Card>

        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('materialOrderDetail.materials')} ({order.items.length})
          </Text>
          <View style={{ gap: 8 }}>
            {order.items.map((it, i) => (
              <View
                key={i}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.parchmentDark }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>{it.name}</Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11, marginTop: 1 }}>
                    {it.quantity} × {fmt(it.unitPrice)}
                  </Text>
                </View>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 14 }}>{fmt(it.subtotal)}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>{t('materialOrderDetail.total')}</Text>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 18 }}>{fmt(order.totalAmount)}</Text>
          </View>
        </Card>

        {order.deliveryConfirmation ? (
          <Card style={{ padding: 14, backgroundColor: colors.forest + '12', borderColor: colors.forest + '30', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={22} color={colors.forest} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>{t('materialOrderDetail.deliveryConfirmed')}</Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, marginTop: 1 }}>
                {t('materialOrderDetail.confirmedOnSiteBy')} {order.deliveryConfirmation.confirmedByName}.
              </Text>
            </View>
          </Card>
        ) : (
          <Card style={{ padding: 14, backgroundColor: colors.forest + '12', borderColor: colors.forest + '30', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={22} color={colors.forest} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>{t('materialOrderDetail.escrowProtected')}</Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, marginTop: 1 }}>
                {t('materialOrderDetail.escrowProtectedDesc')}
              </Text>
            </View>
          </Card>
        )}

        <View style={{ gap: 10, marginTop: 4 }}>
          {isRequested && (
            <>
              <PillButton variant="primary" onPress={handleConfirm} loading={confirmMutation.isPending} disabled={anyActionPending} fullWidth>
                {t('materialOrderDetail.confirmOrder')}
              </PillButton>
              <PillButton variant="danger" onPress={handleReject} loading={rejectMutation.isPending} disabled={anyActionPending} fullWidth>
                {t('materialOrderDetail.rejectOrder')}
              </PillButton>
            </>
          )}

          {isConfirmed && (
            <PillButton variant="primary" onPress={handleMarkOutForDelivery} loading={outForDeliveryMutation.isPending} disabled={anyActionPending} fullWidth>
              {t('materialOrderDetail.markOutForDelivery')}
            </PillButton>
          )}

          {isOutForDelivery && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.amber + '20', paddingVertical: 12, borderRadius: 14 }}>
              <Truck size={16} color={colors.amber} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>{t('materialOrderDetail.inTransit')}</Text>
            </View>
          )}

          {isDelivered && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.forest + '20', paddingVertical: 12, borderRadius: 14 }}>
              <CheckCircle2 size={16} color={colors.forest} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>{t('materialOrderDetail.delivered')}</Text>
            </View>
          )}

          {(isRejected || isCancelled) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.seal + '15', paddingVertical: 12, borderRadius: 14 }}>
              <XCircle size={16} color={colors.seal} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 13 }}>{isRejected ? t('materialOrderDetail.rejected') : t('materialOrderDetail.cancelled')}</Text>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}
