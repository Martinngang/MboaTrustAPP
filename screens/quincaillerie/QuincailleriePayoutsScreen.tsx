import { View, Text, ActivityIndicator } from 'react-native';
import { ShieldCheck, Smartphone, Truck } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useMySupplierProfileQuery } from '../../api/supplierProfiles';
import { useMaterialOrdersForMySupplierQuery } from '../../api/materialOrders';
import { useTranslation } from '../../i18n/useTranslation';

// Real earnings, not a manual withdraw flow: the backend has no supplier
// payout endpoint yet — Escrow.payeeType supports 'supplier', but
// /escrows/withdraw only resolves 'contractor'/'recipient' payees (see
// escrowController.js's withdrawableFilter) — and web's own
// SupplierDashboardScreen has no withdraw button either, just a computed
// "Total earnings" figure from confirmed/delivered orders. The previous
// version of this screen had an "Instant Payout" button wired to the
// *contractor's* withdraw mutation with hardcoded fallback numbers
// (2,753,500 / 1,446,500 / 4,200,000 XAF) — none of that corresponded to
// anything real, so it's gone rather than kept as a fake action.
export function QuincailleriePayoutsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { data: profile } = useMySupplierProfileQuery();
  const isVerified = profile?.verificationStatus === 'verified';
  const { data: orders = [], isLoading } = useMaterialOrdersForMySupplierQuery('all', isVerified);

  const settled = orders.filter((o) => o.status === 'delivered');
  const pending = orders.filter((o) => o.status === 'confirmed' || o.status === 'out_for_delivery');
  const totalSettled = settled.reduce((s, o) => s + o.totalAmount, 0);
  const totalPending = pending.reduce((s, o) => s + o.totalAmount, 0);

  return (
    <Screen header={<Header title={t('quincailleriePayouts.title')} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Card style={{ padding: 18, backgroundColor: colors.forestDark, gap: 14 }}>
          <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('quincailleriePayouts.deliveredAndSettled')}
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 28 }}>{fmt(totalSettled)}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 }}>
              <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 9, textTransform: 'uppercase' }}>
                {t('quincailleriePayouts.inProgress')}
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 13, marginTop: 2 }}>{fmt(totalPending)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 }}>
              <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 9, textTransform: 'uppercase' }}>
                {t('quincailleriePayouts.completedOrders')}
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 13, marginTop: 2 }}>{profile?.completedOrderCount ?? settled.length}</Text>
            </View>
          </View>
        </Card>

        {profile?.paymentProvider ? (
          <Card style={{ padding: 16, gap: 10 }}>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{t('quincailleriePayouts.registeredPayoutMethod')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: colors.parchment }}>
              <View
                style={{
                  width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: profile.paymentProvider === 'orange_money' ? '#FF6600' : '#FFCC00',
                }}
              >
                <Smartphone size={18} color={profile.paymentProvider === 'orange_money' ? '#fff' : '#111'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                  {profile.paymentProvider === 'orange_money' ? t('payout.omLabel') : t('payout.momoLabel')}
                </Text>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, marginTop: 1 }}>{profile.payoutPhoneNumber}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={14} color={colors.forest} />
                <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, fontWeight: '700' }}>{t('quincailleriePayouts.onFile')}</Text>
              </View>
            </View>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11 }}>
              {t('quincailleriePayouts.autoReleaseExplainer')}
            </Text>
          </Card>
        ) : null}

        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('quincailleriePayouts.settledOrders')}
          </Text>
          {isLoading ? (
            <ActivityIndicator color={colors.forest} style={{ marginTop: 12 }} />
          ) : settled.length === 0 ? (
            <EmptyState icon={Truck} title={t('quincailleriePayouts.noSettledYet')} description={t('quincailleriePayouts.noSettledDesc')} />
          ) : (
            settled.map((o) => (
              <Card key={o.id} style={{ padding: 14, gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 14 }}>{fmt(o.totalAmount)}</Text>
                  <StatusBadge status={o.status} />
                </View>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                  {o.projectTitle} · {o.milestoneTitle}
                </Text>
              </Card>
            ))
          )}
        </View>
      </View>
    </Screen>
  );
}
