import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Trophy, ShieldCheck } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { Stars } from '../../components/Stars';
import { EmptyState } from '../../components/EmptyState';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useContractorLeaderboardQuery } from '../../api/contractors';
import { PROJECT_CATEGORIES } from '../../inventoryTaxonomy';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

// Ported from MboaTrustFrontend/src/screens/ContractorPortfolioScreens.tsx's
// ContractorLeaderboardScreen — same weighted-score ranking
// (contractorLeaderboardService: completed projects, ratings, reliability,
// verified experience), same medal treatment for the top 3. Unified onto
// the same sector taxonomy tender categories use (PROJECT_CATEGORIES) —
// this used to be a separate trade-skill list that never matched a
// tender's real category value.
const TRADES = PROJECT_CATEGORIES;
const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function ContractorLeaderboardScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const { data, isLoading } = useContractorLeaderboardQuery({ search: search || undefined, category: category ?? undefined, limit: 50 });
  const rows = data?.rows ?? [];

  return (
    <Screen header={<Header title={t('leaderboard.title')} back />}>
      <View style={{ padding: 16, gap: 14 }}>
        <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
          {t('leaderboard.subtitle')}
        </Text>

        <TextField placeholder={t('leaderboard.searchPlaceholder')} value={search} onChangeText={setSearch} autoCapitalize="words" returnKeyType="search" />

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {['All', ...TRADES].map((c) => {
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

        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : rows.length === 0 ? (
          <EmptyState icon={Trophy} title={t('leaderboard.noMatch')} />
        ) : (
          rows.map((r) => (
            <Pressable
              key={r.userId}
              onPress={() => navigation.navigate('ContractorPortfolio', { userId: r.userId })}
              accessibilityRole="button"
            >
              <Card style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.inkSubtle, fontSize: 16, width: 28, textAlign: 'center' }}>
                  {RANK_MEDAL[r.rank] ?? `#${r.rank}`}
                </Text>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 15 }}>
                    {r.fullName.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '—'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }} numberOfLines={1}>{r.fullName}</Text>
                    {r.kycStatus === 'verified' && <ShieldCheck size={13} color={colors.forest} />}
                  </View>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', marginTop: 1 }}>
                    {r.categories[0] ?? t('leaderboard.generalContracting')}{r.regions[0] ? ` · ${r.regions[0]}` : ''} · {r.yearsExperience} {t('leaderboard.yrs')}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <Stars rating={r.stats.avgRating ?? 0} size={11} />
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>{r.stats.completedProjects} {t('leaderboard.completed')}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 18 }}>{r.score.total}</Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase' }}>{t('leaderboard.score')}</Text>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}
