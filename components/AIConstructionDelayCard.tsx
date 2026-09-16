import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { CloudRain, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { predictConstructionDelay, type WeatherRiskAnalysis } from '../utils/constructionDelayPredictor';
import { fmt } from './fmt';

interface Props {
  regionName?: string;
  milestoneType?: 'foundation' | 'framing' | 'roofing' | 'finishing';
}

const RISK_CONFIG: Record<WeatherRiskAnalysis['riskLevel'], { color: string; bg: string; badge: string }> = {
  Low: { color: '#0F7A52', bg: '#dcfce7', badge: 'Low Risk' },
  Medium: { color: '#C9971E', bg: '#fef3c7', badge: 'Moderate Risk' },
  High: { color: '#ea580c', bg: '#ffedd5', badge: 'High Rain Delay' },
  Severe: { color: '#b91c1c', bg: '#fee2e2', badge: 'Severe Monsoon' },
};

export function AIConstructionDelayCard({
  regionName = 'Centre',
  milestoneType = 'foundation',
}: Props) {
  const { colors } = useTheme();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const analysis = predictConstructionDelay(regionName, milestoneType, selectedMonth);
  const cfg = RISK_CONFIG[analysis.riskLevel];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1.5, borderColor: colors.parchmentDark, overflow: 'hidden' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: colors.forestDark }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CloudRain size={18} color="#FFD700" />
          <View>
            <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 14 }}>
              AI Weather Delay Forecast
            </Text>
            <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
              {regionName} ({analysis.zoneType})
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
          <Text style={{ fontFamily: FONT.mono, color: cfg.color, fontSize: 10, fontWeight: '700' }}>
            {cfg.badge}
          </Text>
        </View>
      </View>

      {/* Month Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6, backgroundColor: colors.parchment }}>
        {months.map((m, idx) => (
          <Pressable
            key={m}
            onPress={() => setSelectedMonth(idx)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
              backgroundColor: selectedMonth === idx ? colors.forestDark : colors.surface,
              borderWidth: 1,
              borderColor: colors.parchmentDark,
            }}
          >
            <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: selectedMonth === idx ? '#fff' : colors.ink, fontWeight: selectedMonth === idx ? '700' : '400' }}>
              {m}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Metrics Row */}
      <View style={{ flexDirection: 'row', padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.parchmentDark }}>
        <View style={{ flex: 1, backgroundColor: colors.parchment, padding: 10, borderRadius: 12 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase' }}>
            Rainfall
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 14, marginTop: 2 }}>
            {analysis.monthlyRainfallMm} mm
          </Text>
        </View>

        <View style={{ flex: 1, backgroundColor: colors.parchment, padding: 10, borderRadius: 12 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase' }}>
            Forecast Delay
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: cfg.color, fontSize: 14, marginTop: 2 }}>
            +{analysis.predictedDelayDays} Days
          </Text>
        </View>

        <View style={{ flex: 1, backgroundColor: colors.parchment, padding: 10, borderRadius: 12 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase' }}>
            Buffer Recom.
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 13, marginTop: 2 }}>
            {fmt(analysis.recommendedEscrowBufferXaf)}
          </Text>
        </View>
      </View>

      {/* Curing notes & mitigations */}
      <View style={{ padding: 14, gap: 10 }}>
        <View>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', marginBottom: 2 }}>
            Technical Curing Risk
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12, lineHeight: 16 }}>
            {analysis.curingVulnerability}
          </Text>
        </View>

        <View style={{ gap: 4 }}>
          {analysis.mitigationTips.map((tip, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
              <Text style={{ color: colors.forest, fontSize: 12, fontWeight: '700' }}>✓</Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, flex: 1, lineHeight: 15 }}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
