import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Calculator,
  Layers,
  Building,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Info,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { PillButton } from '../components/PillButton';
import { useToast } from '../components/Toast';
import { fmt } from '../components/fmt';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useCurrencyConversionQuery } from '../api/tools';
import { calculateCameroonConstructionMaterials, type ConstructionEstimateResult } from '../utils/constructionEstimator';
import type { MainStackParamList } from '../navigation/types';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translations';

const PRESET_SURFACES = [80, 120, 160, 250];
const FLOOR_OPTIONS: { value: number; labelKey: TranslationKey }[] = [
  { value: 1, labelKey: 'estimator.groundFloor' },
  { value: 2, labelKey: 'estimator.floor1' },
  { value: 3, labelKey: 'estimator.floor2' },
];

export function MaterialCostEstimatorScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const [surfaceInput, setSurfaceInput] = useState('120');
  const [floors, setFloors] = useState(1);
  const [quality, setQuality] = useState<'standard' | 'premium'>('standard');

  const surfaceArea = parseFloat(surfaceInput) || 120;
  const estimate: ConstructionEstimateResult = calculateCameroonConstructionMaterials(
    surfaceArea,
    floors,
    quality
  );

  // Real backend exchange rate (GET /tools/convert), not a hardcoded client
  // rate that silently drifts from what the platform actually uses. Reads
  // convertedAmount (the pre-fee figure) — this is an informational "about
  // how much that is" hint, not a real money movement, so the currency
  // conversion fee doesn't apply here.
  const { data: eurConversion } = useCurrencyConversionQuery(estimate.totalMaterialCostXaf, 'XAF', 'EUR');

  const handleOrderSupply = () => {
    showToast({
      title: t('estimator.estimateExported'),
      description: t('estimator.estimateExportedDesc'),
      tone: 'success',
    });
    navigation.navigate('MaterialOrders');
  };

  return (
    <Screen header={<Header title={t('estimator.title')} subtitle={t('estimator.subtitle')} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Estimator Input Configuration */}
        <Card style={{ padding: 16, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Calculator size={18} color={colors.forest} />
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
              {t('estimator.dimensionsLayout')}
            </Text>
          </View>

          {/* Surface Area Input */}
          <View style={{ gap: 6 }}>
            <TextField
              label={t('estimator.surfaceAreaLabel')}
              placeholder="120"
              value={surfaceInput}
              onChangeText={setSurfaceInput}
              keyboardType="numeric"
              returnKeyType="done"
            />
            {/* Surface Preset Chips */}
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
              {PRESET_SURFACES.map((sqm) => {
                const active = surfaceArea === sqm;
                return (
                  <Pressable
                    key={sqm}
                    onPress={() => setSurfaceInput(sqm.toString())}
                    style={{
                      flex: 1,
                      paddingVertical: 6,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: active ? colors.forest : colors.parchmentDark,
                      backgroundColor: active ? colors.forest + '15' : colors.parchment,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: active ? colors.forest : colors.inkMuted }}>
                      {sqm} m²
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Number of Floors */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>
              {t('estimator.buildingElevation')}
            </Text>
            <View style={{ gap: 6 }}>
              {FLOOR_OPTIONS.map((f) => {
                const active = floors === f.value;
                return (
                  <Pressable
                    key={f.value}
                    onPress={() => setFloors(f.value)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 10,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: active ? colors.forest : colors.parchmentDark,
                      backgroundColor: active ? colors.forest + '12' : colors.surface,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: colors.ink }}>
                      {t(f.labelKey)}
                    </Text>
                    {active && <CheckCircle2 size={16} color={colors.forest} />}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Quality Grade Selector */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['standard', 'premium'] as const).map((q) => {
              const active = quality === q;
              return (
                <Pressable
                  key={q}
                  onPress={() => setQuality(q)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: active ? colors.forest : colors.parchmentDark,
                    backgroundColor: active ? colors.forest + '15' : colors.parchment,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 12, color: active ? colors.forest : colors.inkMuted, textTransform: 'capitalize' }}>
                    {q === 'standard' ? t('estimator.standard') : t('estimator.premium')} {t('estimator.gradeStructural')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Live Material Results Hero Card */}
        <Card style={{ padding: 18, backgroundColor: colors.forestDark, gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('estimator.totalBudget')}
          </Text>

          <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 24 }}>
            {fmt(estimate.totalMaterialCostXaf)}
          </Text>

          {eurConversion ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' }}>
              <Sparkles size={13} color="#FFD700" />
              <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 12 }}>
                {`≈ €${eurConversion.convertedAmount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}`}
              </Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 10, marginTop: 4 }}>
            <Text style={{ fontFamily: FONT.sans, color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
              {t('estimator.totalBuiltArea')} {estimate.totalBuiltAreaSqm} m²
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
              ~{fmt(estimate.costPerSqm)} / m²
            </Text>
          </View>
        </Card>

        {/* Itemized Bill of Quantities */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
            {t('estimator.itemizedBom')}
          </Text>

          {estimate.items.map((item) => (
            <Card key={item.id} style={{ padding: 14, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                    {item.name}
                  </Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11, marginTop: 1 }}>
                    {item.specification}
                  </Text>
                </View>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 14 }}>
                  {fmt(item.totalCost)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.parchmentDark }}>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkMuted, fontSize: 11 }}>
                  {t('estimator.quantity')} {item.quantity} {item.unit}
                </Text>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11 }}>
                  @{fmt(item.unitPrice)} / {item.unit}
                </Text>
              </View>
            </Card>
          ))}
        </View>

        {/* Order Supply Button */}
        <PillButton variant="primary" onPress={handleOrderSupply} fullWidth>
          {t('estimator.generateSupplyOrder')}
        </PillButton>
      </View>
    </Screen>
  );
}
