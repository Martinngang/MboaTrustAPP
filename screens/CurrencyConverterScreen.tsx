import { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { fmt } from '../components/fmt';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useCurrencyConversionQuery } from '../api/tools';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translations';

const CURRENCIES: { code: string; labelKey: TranslationKey }[] = [
  { code: 'EUR', labelKey: 'currency.eurLabel' },
  { code: 'USD', labelKey: 'currency.usdLabel' },
];

/** Real backend conversion (GET /tools/convert) — the same rate table and
 * currency_conversion fee the backend actually applies internally during a
 * foreign-currency milestone payout, not a client-side approximation. */
export function CurrencyConverterScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [currencyCode, setCurrencyCode] = useState(CURRENCIES[0].code);
  const [amount, setAmount] = useState('');

  const currency = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];
  const numericAmount = Number(amount) || 0;
  const { data: result, isFetching } = useCurrencyConversionQuery(numericAmount, currencyCode, 'XAF');

  return (
    <Screen header={<Header title={t('currency.title')} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Card style={{ padding: 16, gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CURRENCIES.map((c) => {
              const active = currencyCode === c.code;
              return (
                <Pressable
                  key={c.code}
                  onPress={() => setCurrencyCode(c.code)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    alignItems: 'center',
                    borderColor: active ? colors.forest : colors.parchmentDark,
                    backgroundColor: active ? colors.forest + '15' : colors.surface,
                  }}
                >
                  <Text style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: '700', color: active ? colors.forest : colors.inkMuted }}>
                    {c.code}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              {t('currency.amountIn')} {currency.code}
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="e.g. 1000"
              placeholderTextColor={colors.inkSubtle}
              style={{
                backgroundColor: colors.parchment,
                borderRadius: 12,
                padding: 14,
                fontFamily: FONT.sans,
                color: colors.ink,
                fontSize: 16,
              }}
            />
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 6 }}>
              {result
                ? `${t('currency.referenceRate')} 1 ${currency.code} = XAF ${result.rate.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`
                : isFetching
                ? t('currency.calculating')
                : ' '}
            </Text>
          </View>
        </Card>

        {numericAmount > 0 && (
          <Card style={{ padding: 16, gap: 10 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              {t('currency.breakdown')}
            </Text>
            {isFetching && !result ? (
              <ActivityIndicator color={colors.forest} style={{ marginVertical: 8 }} />
            ) : result ? (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>
                    {t(currency.labelKey)} {t('currency.convertedToXaf')}
                  </Text>
                  <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>{fmt(result.convertedAmount)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>
                    {`${t('currency.platformFee')} (${((result.feeBreakdown?.feeRate ?? 0) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}%)`}
                  </Text>
                  <Text style={{ fontFamily: FONT.sansMedium, color: colors.inkSubtle, fontSize: 13 }}>
                    -{fmt(result.conversionFee)}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.parchmentDark, marginVertical: 2 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>{t('currency.amountAfterFees')}</Text>
                  <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 17 }}>{fmt(result.settledAmount)}</Text>
                </View>
              </>
            ) : null}
          </Card>
        )}

        <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11, lineHeight: 16, paddingHorizontal: 4 }}>
          {t('currency.disclaimer')}
        </Text>
      </View>
    </Screen>
  );
}
