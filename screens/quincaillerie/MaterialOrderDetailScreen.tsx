import { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Camera,
  FileText,
  ShieldCheck,
  X,
  Plus,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import {
  useMaterialOrdersQuery,
  useConfirmMaterialOrderMutation,
  useDispatchMaterialOrderMutation,
  type MaterialOrder,
} from '../../api/materials';
import type { MainStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<MainStackParamList, 'MaterialOrderDetail'>;

export function MaterialOrderDetailScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { orderId } = route.params;
  const { data: orders, isLoading } = useMaterialOrdersQuery();
  const confirmMutation = useConfirmMaterialOrderMutation();
  const dispatchMutation = useDispatchMaterialOrderMutation();

  const order = (orders || []).find((o) => o.id === orderId) || (orders || [])[0];

  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [waybillNotes, setWaybillNotes] = useState('Dispatched via Isuzu 10-tonne truck with driver delivery slip #WB-881.');
  const [waybillPhoto, setWaybillPhoto] = useState(
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop'
  );

  if (isLoading || !order) {
    return (
      <Screen header={<Header title="Order Details" back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.amber} />
        </View>
      </Screen>
    );
  }

  const isRequested = order.status === 'requested';
  const isConfirmed = order.status === 'confirmed';
  const isDispatched = order.status === 'dispatched';
  const isDelivered = order.status === 'delivered';

  const handleConfirm = async () => {
    try {
      await confirmMutation.mutateAsync(order.id);
      showToast({ title: 'Order Confirmed!', description: 'Please prepare the materials for site delivery.', tone: 'success' });
    } catch (err: any) {
      showToast({ title: 'Error', description: err?.message || 'Could not confirm order.', tone: 'error' });
    }
  };

  const handleDispatch = async () => {
    try {
      await dispatchMutation.mutateAsync({
        orderId: order.id,
        waybillUrl: waybillPhoto,
        notes: waybillNotes.trim(),
      });
      setDispatchModalOpen(false);
      showToast({ title: 'Delivery Dispatched!', description: 'Waybill registered and buyer notified.', tone: 'success' });
    } catch (err: any) {
      showToast({ title: 'Error', description: err?.message || 'Could not record dispatch.', tone: 'error' });
    }
  };

  return (
    <Screen header={<Header title={order.orderNumber} subtitle={order.projectTitle} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Order Header Card */}
        <Card style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.amber, fontSize: 10, fontWeight: '700' }}>
                {order.orderNumber}
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18, marginTop: 2 }}>
                {order.projectTitle}
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                Milestone: {order.milestoneTitle}
              </Text>
            </View>
            <StatusBadge status={order.status} />
          </View>

          {/* Delivery destination */}
          <View style={{ backgroundColor: colors.parchment, borderRadius: 12, padding: 12, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color={colors.amber} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                Site Delivery Address
              </Text>
            </View>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
              {order.deliveryAddress}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Phone size={12} color={colors.inkSubtle} />
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11 }}>
                Site Receiver: {order.deliveryContact}
              </Text>
            </View>
          </View>
        </Card>

        {/* Itemized Bill of Materials */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Ordered Materials Breakdown ({order.items.length})
          </Text>

          <View style={{ gap: 8 }}>
            {order.items.map((it) => (
              <View
                key={it.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.parchmentDark,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                    {it.name}
                  </Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11, marginTop: 1 }}>
                    {it.quantity} {it.unit} × {fmt(it.unitPrice)}
                  </Text>
                </View>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 14 }}>
                  {fmt(it.totalPrice)}
                </Text>
              </View>
            ))}
          </View>

          {/* Total Invoice */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
              Total Guaranteed Invoice
            </Text>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 18 }}>
              {fmt(order.totalAmount)}
            </Text>
          </View>
        </Card>

        {/* Waybill / Dispatch Info */}
        {order.waybillUrl && (
          <Card style={{ padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <FileText size={16} color={colors.forest} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                Delivery Waybill & Packing Slip
              </Text>
            </View>
            <Image source={{ uri: order.waybillUrl }} style={{ width: '100%', height: 160, borderRadius: 10 }} resizeMode="cover" />
            {order.notes ? (
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
                {order.notes}
              </Text>
            ) : null}
          </Card>
        )}

        {/* Escrow Direct Settlement Banner */}
        <Card style={{ padding: 14, backgroundColor: colors.forest + '12', borderColor: colors.forest + '30', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={22} color={colors.forest} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
              Direct Supplier Escrow Protection
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, marginTop: 1 }}>
              Funds are reserved in escrow specifically for this material purchase and released straight to your store MoMo upon delivery confirmation.
            </Text>
          </View>
        </Card>

        {/* Action Decision Buttons */}
        <View style={{ gap: 10, marginTop: 4 }}>
          {isRequested && (
            <PillButton variant="primary" onPress={handleConfirm} loading={confirmMutation.isPending} fullWidth>
              Confirm Order & Prepare Materials
            </PillButton>
          )}

          {isConfirmed && (
            <PillButton variant="primary" onPress={() => setDispatchModalOpen(true)} fullWidth>
              Upload Waybill & Dispatch Truck
            </PillButton>
          )}

          {isDispatched && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: colors.amber + '20',
                paddingVertical: 12,
                borderRadius: 14,
              }}
            >
              <Truck size={16} color={colors.amber} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                In Transit · Awaiting Site Receiver Signoff
              </Text>
            </View>
          )}

          {isDelivered && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: colors.forest + '20',
                paddingVertical: 12,
                borderRadius: 14,
              }}
            >
              <CheckCircle2 size={16} color={colors.forest} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>
                Delivered · Escrow Settled
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Dispatch Truck Modal */}
      <Modal visible={dispatchModalOpen} transparent animationType="slide" onRequestClose={() => setDispatchModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>Dispatch Material Delivery</Text>
              <Pressable onPress={() => setDispatchModalOpen(false)} hitSlop={6}>
                <X size={20} color={colors.inkMuted} />
              </Pressable>
            </View>

            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>
              Attach a photo of the signed delivery waybill and provide driver / truck details.
            </Text>

            <View style={{ height: 140, backgroundColor: colors.parchment, borderRadius: 12, overflow: 'hidden' }}>
              <Image source={{ uri: waybillPhoto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>

            <TextInput
              placeholder="Driver name, vehicle plate, delivery notes..."
              placeholderTextColor={colors.inkSubtle}
              value={waybillNotes}
              onChangeText={setWaybillNotes}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: colors.parchment,
                borderRadius: 12,
                padding: 12,
                fontFamily: FONT.sans,
                color: colors.ink,
                fontSize: 13,
                minHeight: 70,
                textAlignVertical: 'top',
              }}
            />

            <PillButton variant="primary" onPress={handleDispatch} loading={dispatchMutation.isPending} fullWidth>
              Confirm Dispatch & Alert Site
            </PillButton>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
