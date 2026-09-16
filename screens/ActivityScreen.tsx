import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Activity } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useListBottomPadding } from '../hooks/useListBottomPadding';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useMyActivityQuery, resolveActivityRoute, type ActivityType } from '../api/activity';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translations';

// Mirrors web's GlobalActivityScreen category grouping exactly.
const CATEGORY_TYPES: Record<string, ActivityType[]> = {
  Milestones: ['milestone_approved', 'milestone_disputed', 'milestone_submitted'],
  Funding: ['project_funded', 'project_created', 'project_status_changed'],
  Marketplace: ['bid_placed', 'listing_created', 'offer_made'],
};
const CATEGORIES: { id: string; labelKey: TranslationKey }[] = [
  { id: 'All', labelKey: 'common.all' },
  { id: 'Milestones', labelKey: 'activity.categoryMilestones' },
  { id: 'Funding', labelKey: 'activity.categoryFunding' },
  { id: 'Marketplace', labelKey: 'activity.categoryMarketplace' },
];

// Ported from MboaTrustFrontend/src/screens/GlobalActivityScreen.tsx — same
// category filter chips and, critically, the same "every event with a path
// is clickable" behavior (web: `onClick={e.path ? () => nav(e.path!) : undefined}`).
// The previous mobile version rendered plain, non-interactive Cards with no
// filter at all — a real functionality gap, not just a visual one.
export function ActivityScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { data: activities, isLoading } = useMyActivityQuery();
  const [category, setCategory] = useState('All');
  const pullToRefresh = usePullToRefresh();
  const bottomPadding = useListBottomPadding();

  const events = activities || [];
  const filtered = category === 'All' ? events : events.filter((e) => CATEGORY_TYPES[category]?.includes(e.type));

  return (
    <Screen
      scroll={false}
      contentContainerStyle={{ paddingBottom: 0 }}
      header={<Header title={t('activity.title')} subtitle={`${events.length} ${t('activity.subtitle')}`} />}
    >
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
        refreshing={pullToRefresh.refreshing}
        onRefresh={pullToRefresh.onRefresh}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListHeaderComponent={
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {CATEGORIES.map((c) => {
              const active = category === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategory(c.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderColor: active ? colors.forest : colors.parchmentDark,
                    backgroundColor: active ? colors.forest + '14' : colors.surface,
                  }}
                >
                  <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? colors.forest : colors.inkMuted }}>{t(c.labelKey)}</Text>
                </Pressable>
              );
            })}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color={colors.forest} />
            </View>
          ) : (
            <EmptyState
              icon={Activity}
              title={t('activity.emptyTitle')}
              description={t('activity.emptyDesc')}
            />
          )
        }
        renderItem={({ item }) => {
          const Icon = item.icon;
          const route = resolveActivityRoute(item.path);
          return (
            <Card
              onPress={route ? () => navigation.navigate(route.screen, route.params) : undefined}
              style={{ padding: 14, flexDirection: 'row', gap: 12 }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: colors.forest + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2,
                }}
              >
                <Icon size={18} color={colors.forest} />
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>
                    {item.time}
                  </Text>
                </View>

                {item.detail && (
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
                    {item.detail}
                  </Text>
                )}
              </View>
            </Card>
          );
        }}
      />
    </Screen>
  );
}
