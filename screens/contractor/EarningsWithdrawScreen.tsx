import { View, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Wallet, CheckCircle2 } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { PillButton } from '../../components/PillButton';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useWithdrawableBalanceQuery, useWithdrawMutation } from '../../api/contracts';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

/** Simplified to match the real backend exactly (escrowController.getWithdrawable
 * / .withdraw): a single available total across every release escrow not yet
 * claimed, and a single "mark as withdrawn" action — no amount picker, no
 * payment-method choice, no transfer fee. The money already moved to the
 * contractor's payout method automatically at milestone-release time; this
 * only records that they've claimed/seen it. There was never a real backend
 * concept of "total earned" vs "pending escrow" or a 1.5% operator fee. */
export function EarningsWithdrawScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { data: balance, isLoading } = useWithdrawableBalanceQuery();
  const withdrawMutation = useWithdrawMutation();

  const handleWithdraw = async () => {
    try {
      const result = await withdrawMutation.mutateAsync();
      showToast({
        title: t('earnings.markedAsWithdrawn'),
        description: `${fmt(result.amount)} ${t('earnings.acrossEscrows')} ${result.count} ${result.count === 1 ? t('earnings.escrow') : t('earnings.escrows')} ${t('earnings.confirmedReceived')}`,
        tone: 'success',
      });
    } catch (err) {
      showToast({ title: t('earnings.error'), description: apiErrorMessage(err, t('earnings.couldNotProcess')), tone: 'error' });
    }
  };

  return (
    <Screen header={<Header title={t('earnings.title')} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Balance Hero Overview */}
        <Card style={{ padding: 18, backgroundColor: colors.forestDark, gap: 12 }}>
          <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('earnings.availableToConfirm')}
          </Text>

          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 28 }}>
              {fmt(balance?.available || 0)}
            </Text>
          )}

          <Text style={{ fontFamily: FONT.sans, color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 17 }}>
            {t('earnings.explainer')}
          </Text>

          {!isLoading && (balance?.available || 0) > 0 && (
            <PillButton
              variant="primary"
              onPress={handleWithdraw}
              loading={withdrawMutation.isPending}
              disabled={withdrawMutation.isPending}
              fullWidth
            >
              {`${t('earnings.confirmReceiptOf')} ${fmt(balance?.available || 0)}`}
            </PillButton>
          )}
        </Card>

        {/* Escrow List */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('earnings.availableReleases')}
          </Text>

          {isLoading ? (
            <ActivityIndicator color={colors.forest} />
          ) : !balance || balance.escrows.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title={t('earnings.nothingAvailable')}
              description={t('earnings.nothingAvailableDesc')}
            />
          ) : (
            balance.escrows.map((e) => (
              <Card key={e.id} style={{ padding: 14, gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                    {e.projectTitle}
                  </Text>
                  <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 14 }}>
                    +{fmt(e.netAmount)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={12} color={colors.forest} />
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11 }}>
                    {t('earnings.released')} {new Date(e.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>
      </View>
    </Screen>
  );
}
