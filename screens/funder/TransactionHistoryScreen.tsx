import { View, Text, ActivityIndicator } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useEscrowQuery, type EscrowEntry } from '../../api/escrow';
import { useTranslation } from '../../i18n/useTranslation';
import type { TranslationKey } from '../../i18n/translations';

// Ported from MboaTrustFrontend/src/screens/FunderScreens.tsx's
// TransactionHistoryScreen — same labels/inflow-outflow framing, from a
// funder's own perspective: 'fund' is money they sent into escrow (an
// outflow), 'release'/'fee_deduction' is money that left escrow for the
// contractor or supplier (also not theirs), 'refund' is money that came
// back. Reuses mobile's existing useEscrowQuery (GET /escrows, already
// server-scoped to transactions the caller is a party to) rather than
// adding a parallel API hook for the same endpoint.
const TX_LABEL_KEY: Record<EscrowEntry['type'], TranslationKey> = {
  fund: 'transactionHistory.fundsLocked',
  release: 'transactionHistory.milestoneReleased',
  refund: 'transactionHistory.refundedToYou',
  fee_deduction: 'transactionHistory.platformFee',
};
const TX_IS_INFLOW: Record<EscrowEntry['type'], boolean> = {
  fund: false,
  release: false,
  refund: true,
  fee_deduction: false,
};

export function TransactionHistoryScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { data, isLoading } = useEscrowQuery();
  const transactions = data?.entries ?? [];

  const total = transactions.reduce((s, t) => s + (TX_IS_INFLOW[t.type] ? t.netAmount : -t.netAmount), 0);

  return (
    <Screen header={<Header title={t('transactionHistory.title')} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Card style={{ padding: 18, backgroundColor: colors.forestDark, gap: 6 }}>
          <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('transactionHistory.netInEscrow')}
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 28 }}>
            {fmt(Math.abs(total))}
          </Text>
        </Card>

        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={t('transactionHistory.noTransactionsYet')}
            description={t('transactionHistory.noTransactionsDesc')}
          />
        ) : (
          transactions.map((tx) => {
            const inflow = TX_IS_INFLOW[tx.type];
            return (
              <Card key={tx.id} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: inflow ? colors.forest + '18' : colors.steel + '18',
                  }}
                >
                  {inflow ? (
                    <ArrowDownLeft size={17} color={colors.forest} />
                  ) : (
                    <ArrowUpRight size={17} color={colors.steel} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                    {t(TX_LABEL_KEY[tx.type])} — {tx.projectTitle}
                  </Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 2 }}>
                    {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ fontFamily: FONT.mono, color: inflow ? colors.forest : colors.ink, fontSize: 13, fontWeight: '700' }}>
                    {inflow ? '+' : '−'}{fmt(tx.netAmount)}
                  </Text>
                  <StatusBadge status={tx.status} />
                </View>
              </Card>
            );
          })
        )}
      </View>
    </Screen>
  );
}
