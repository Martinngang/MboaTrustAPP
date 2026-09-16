import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Store, ShieldCheck, Plus, Minus, X, CheckCircle2, Package } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { PillButton } from '../components/PillButton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { fmt } from '../components/fmt';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useProjectQuery } from '../api/projects';
import { useSupplierDirectoryQuery } from '../api/supplierProfiles';
import { useSupplierInventoryQuery } from '../api/inventoryItems';
import { useCreateMaterialOrderMutation, type MaterialOrderItem } from '../api/materialOrders';
import { apiErrorMessage } from '../api/client';
import { CATEGORY_NAMES } from '../inventoryTaxonomy';
import type { MainStackParamList } from '../navigation/types';
import { useTranslation } from '../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'RequestMaterials'>;

// Ported from MboaTrustFrontend/src/screens/SupplierScreens.tsx's
// RequestMaterialsScreen — same store-picker → cart-from-real-inventory →
// custom-item → POST /material-orders flow, shared by both funder
// (MilestoneReviewScreen) and contractor (ContractDetailScreen) entry
// points exactly as it is on web. Same CATEGORY_NAMES taxonomy web's
// SupplierRegistrationScreen uses for registeredCategories, so these filter
// chips actually match what suppliers can be tagged with.

export function RequestMaterialsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { projectId, milestoneId } = route.params;
  const { data: project, isLoading: projectLoading } = useProjectQuery(projectId);
  const { data: suppliers, isLoading: suppliersLoading } = useSupplierDirectoryQuery();
  const createOrder = useCreateMaterialOrderMutation();

  const milestone = project?.milestones.find((m) => m.id === milestoneId);

  const [category, setCategory] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customItems, setCustomItems] = useState<MaterialOrderItem[]>([]);
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState('1');
  const [customPrice, setCustomPrice] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const customQtyRef = useRef<TextInput>(null);
  const customPriceRef = useRef<TextInput>(null);

  // The project owner chose a preferred supplier at tender-creation time
  // (see PostJobScreen) — pre-select it so the requester skips the
  // store-picker step entirely, matching web exactly.
  useEffect(() => {
    if (project?.materialsManagedBy === 'supplier' && project.preferredSupplierId && !selectedId) {
      setSelectedId(project.preferredSupplierId);
    }
  }, [project, selectedId]);

  const filtered = (suppliers || []).filter((s) => !category || s.registeredCategories.includes(category));
  const selected = (suppliers || []).find((s) => s.id === selectedId) ?? null;
  const { data: selectedInventory } = useSupplierInventoryQuery(selected?.id);

  const cartItems: MaterialOrderItem[] = [
    ...(selectedInventory || [])
      .filter((i) => (cart[i.id] ?? 0) > 0)
      .map((i) => ({ inventoryItemId: i.id, name: i.name, quantity: cart[i.id], unitPrice: i.price, subtotal: cart[i.id] * i.price })),
    ...customItems,
  ];
  const total = cartItems.reduce((s, it) => s + it.subtotal, 0);

  const addCustomItem = () => {
    const quantity = Number(customQty) || 0;
    const unitPrice = Number(customPrice) || 0;
    if (!customName.trim() || quantity <= 0 || unitPrice <= 0) return;
    setCustomItems((items) => [...items, { inventoryItemId: null, name: customName.trim(), quantity, unitPrice, subtotal: quantity * unitPrice }]);
    setCustomName('');
    setCustomQty('1');
    setCustomPrice('');
  };

  const submit = async () => {
    if (!selected || !milestone || cartItems.length === 0) return;
    try {
      await createOrder.mutateAsync({
        projectId,
        milestoneId,
        supplierId: selected.id,
        items: cartItems.map(({ inventoryItemId, name, quantity, unitPrice }) => ({ inventoryItemId, name, quantity, unitPrice })),
      });
      setSubmitted(true);
    } catch (err) {
      showToast({ title: t('requestMaterials.failedToSendOrder'), description: apiErrorMessage(err, t('requestMaterials.checkConnection')), tone: 'error' });
    }
  };

  if (projectLoading) {
    return (
      <Screen header={<Header title={t('requestMaterials.title')} back />}>
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  if (!project || !milestone) {
    return (
      <Screen header={<Header title={t('requestMaterials.title')} back />}>
        <View style={{ padding: 16 }}>
          <EmptyState icon={Store} title={t('requestMaterials.milestoneNotFound')} />
        </View>
      </Screen>
    );
  }

  if (submitted) {
    return (
      <Screen header={<Header title={t('requestMaterials.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.forest }}>
            <CheckCircle2 size={34} color="#fff" />
          </View>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 19, textAlign: 'center' }}>{t('requestMaterials.orderSent')}</Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center' }}>
            {selected?.businessName} {t('requestMaterials.willConfirmSuffix')}
          </Text>
          <PillButton onPress={() => navigation.goBack()} fullWidth>{t('requestMaterials.backToProject')}</PillButton>
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title={t('requestMaterials.title')} subtitle={`${milestone.title} — ${project.title}`} back />}>
      <View style={{ padding: 16, gap: 16 }}>
        {!selected ? (
          <>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {['All', ...CATEGORY_NAMES].map((c) => {
                const active = c === 'All' ? category === null : category === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c === 'All' ? null : c)}
                    accessibilityRole="button"
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: active ? colors.forest : colors.parchmentDark,
                      backgroundColor: active ? colors.forest + '15' : colors.surface,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? colors.forest : colors.inkMuted }}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>

            {suppliersLoading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator color={colors.forest} />
              </View>
            ) : filtered.length === 0 ? (
              <EmptyState icon={Store} title={t('requestMaterials.noVerifiedSuppliers')} />
            ) : (
              filtered.map((s) => (
                <Pressable key={s.id} onPress={() => setSelectedId(s.id)} accessibilityRole="button">
                  <Card style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
                      <Store size={18} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{s.businessName}</Text>
                        <ShieldCheck size={13} color={colors.forest} />
                      </View>
                      <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', marginTop: 2 }}>
                        {s.address}, {s.region}
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              ))
            )}
          </>
        ) : (
          <>
            <Pressable onPress={() => setSelectedId(null)} accessibilityRole="button">
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>{t('requestMaterials.chooseDifferentStore')}</Text>
            </Pressable>

            <Pressable onPress={() => navigation.navigate('SupplierProfile', { supplierId: selected.id })} accessibilityRole="button">
              <Card style={{ padding: 14 }}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{selected.businessName}</Text>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', marginTop: 2 }}>
                  {selected.address}, {selected.region}
                </Text>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 11, marginTop: 6 }}>{t('requestMaterials.viewFullProfile')}</Text>
              </Card>
            </Pressable>

            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('requestMaterials.theirInventory')}
            </Text>
            {!selectedInventory ? (
              <ActivityIndicator color={colors.forest} />
            ) : selectedInventory.length === 0 ? (
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, fontStyle: 'italic' }}>
                {t('requestMaterials.noItemsListed')}
              </Text>
            ) : (
              <View style={{ gap: 8 }}>
                {selectedInventory.map((item) => {
                  const qty = cart[item.id] ?? 0;
                  return (
                    <Card key={item.id} style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>{item.name}</Text>
                        <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, marginTop: 1 }}>{fmt(item.price)} / {item.unit}</Text>
                      </View>
                      <Pressable
                        onPress={() => setCart({ ...cart, [item.id]: Math.max(0, qty - 1) })}
                        disabled={qty === 0}
                        accessibilityRole="button"
                        style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.parchmentDark, alignItems: 'center', justifyContent: 'center', opacity: qty === 0 ? 0.4 : 1 }}
                      >
                        <Minus size={14} color={colors.ink} />
                      </Pressable>
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14, minWidth: 20, textAlign: 'center' }}>{qty}</Text>
                      <Pressable
                        onPress={() => setCart({ ...cart, [item.id]: qty + 1 })}
                        accessibilityRole="button"
                        style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Plus size={14} color="#fff" />
                      </Pressable>
                    </Card>
                  );
                })}
              </View>
            )}

            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('requestMaterials.addCustomItem')}
            </Text>
            <Card style={{ padding: 12, gap: 8 }}>
              <TextField
                placeholder={t('requestMaterials.itemNotInList')}
                value={customName}
                onChangeText={setCustomName}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => customQtyRef.current?.focus()}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextField
                  ref={customQtyRef}
                  placeholder={t('requestMaterials.qty')}
                  value={customQty}
                  onChangeText={(v) => setCustomQty(v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  containerStyle={{ width: 70 }}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => customPriceRef.current?.focus()}
                />
                <TextField
                  ref={customPriceRef}
                  placeholder={t('requestMaterials.unitPriceXaf')}
                  value={customPrice}
                  onChangeText={(v) => setCustomPrice(v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                  returnKeyType="done"
                  onSubmitEditing={addCustomItem}
                />
                <Pressable
                  onPress={addCustomItem}
                  disabled={!customName.trim() || !customPrice}
                  accessibilityRole="button"
                  style={{ paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center', opacity: !customName.trim() || !customPrice ? 0.5 : 1 }}
                >
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 13 }}>{t('requestMaterials.add')}</Text>
                </Pressable>
              </View>
              {customItems.map((it, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>{it.quantity}× {it.name}</Text>
                  <Pressable onPress={() => setCustomItems((items) => items.filter((_, idx) => idx !== i))} accessibilityRole="button">
                    <X size={14} color={colors.seal} />
                  </Pressable>
                </View>
              ))}
            </Card>

            {cartItems.length > 0 && (
              <Card style={{ padding: 14, gap: 8, backgroundColor: colors.parchment }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Package size={14} color={colors.inkSubtle} />
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('requestMaterials.orderSummary')}</Text>
                </View>
                {cartItems.map((it, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>{it.quantity}× {it.name}</Text>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 12 }}>{fmt(it.subtotal)}</Text>
                  </View>
                ))}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.parchmentDark }}>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>{t('requestMaterials.total')}</Text>
                  <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>{fmt(total)}</Text>
                </View>
              </Card>
            )}

            <PillButton variant="primary" onPress={submit} loading={createOrder.isPending} disabled={cartItems.length === 0 || createOrder.isPending} fullWidth>
              {t('requestMaterials.sendOrderRequest')}
            </PillButton>
          </>
        )}
      </View>
    </Screen>
  );
}
