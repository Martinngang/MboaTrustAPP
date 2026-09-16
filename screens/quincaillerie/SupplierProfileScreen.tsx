import { View, Text, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { ShieldCheck, Store } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useSupplierDirectoryQuery } from '../../api/supplierProfiles';
import { useSupplierInventoryQuery } from '../../api/inventoryItems';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'SupplierProfile'>;

// Ported from MboaTrustFrontend/src/screens/SupplierScreens.tsx's
// SupplierProfileScreen — the public-facing store profile a funder or
// contractor sees when evaluating a supplier before requesting materials,
// and what a supplier sees as "how I look publicly" from their own
// dashboard's quick action.
export function SupplierProfileScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const { supplierId } = route.params;

  const { data: suppliers, isLoading } = useSupplierDirectoryQuery();
  const supplier = suppliers?.find((s) => s.id === supplierId);
  const { data: inventory } = useSupplierInventoryQuery(supplier?.id);

  if (isLoading) {
    return (
      <Screen header={<Header title={t('supplierProfile.title')} back />}>
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  if (!supplier) {
    return (
      <Screen header={<Header title={t('supplierProfile.title')} back />}>
        <View style={{ padding: 16 }}>
          <EmptyState icon={Store} title={t('supplierProfile.notFound')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title={supplier.businessName} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Card style={{ padding: 18, backgroundColor: colors.forest, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 22 }}>{supplier.businessName[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 18 }} numberOfLines={1}>{supplier.businessName}</Text>
                {supplier.verificationStatus === 'verified' && <ShieldCheck size={15} color="#fff" />}
              </View>
              <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase', marginTop: 3 }}>
                {supplier.address}, {supplier.region}
              </Text>
            </View>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { label: t('supplierProfile.rating'), value: supplier.averageRating > 0 ? supplier.averageRating.toFixed(1) : '—' },
            { label: t('supplierProfile.completed'), value: String(supplier.completedOrderCount) },
            { label: t('supplierProfile.status'), value: supplier.verificationStatus === 'verified' ? t('supplierProfile.verified') : t('supplierProfile.pending') },
          ].map((s) => (
            <Card key={s.label} style={{ flex: 1, padding: 12, alignItems: 'center', gap: 2 }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15 }}>{s.value}</Text>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase' }}>{s.label}</Text>
            </Card>
          ))}
        </View>

        {supplier.registeredCategories.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('supplierProfile.categories')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {supplier.registeredCategories.map((c) => (
                <View key={c} style={{ backgroundColor: colors.parchment, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 }}>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('supplierProfile.inventory')}</Text>
          {!inventory || inventory.length === 0 ? (
            <Card style={{ padding: 14, alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13 }}>{t('supplierProfile.noItemsListed')}</Text>
            </Card>
          ) : (
            inventory.map((item) => (
              <Card key={item.id} style={{ padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>{item.name}</Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>{item.category}</Text>
                </View>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 14 }}>
                  {fmt(item.price)} <Text style={{ fontFamily: FONT.sans, fontSize: 11, color: colors.inkSubtle }}>/ {item.unit}</Text>
                </Text>
              </Card>
            ))
          )}
        </View>
      </View>
    </Screen>
  );
}
