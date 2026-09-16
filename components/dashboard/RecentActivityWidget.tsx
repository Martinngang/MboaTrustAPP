import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useMyActivityQuery, resolveActivityRoute } from '../../api/activity';
import { useTranslation } from '../../i18n/useTranslation';

// Ported from MboaTrustFrontend/src/components/dashboard/RecentActivityWidget.tsx —
// unified activity feed across every pillar, reading the same real per-user
// `/activity/mine` query the full Activity tab reads (see api/activity.ts).
export function RecentActivityWidget({ limit = 5 }: { limit?: number }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { data: events } = useMyActivityQuery();
  const items = (events || []).slice(0, limit);

  if (items.length === 0) {
    return (
      <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, paddingVertical: 8 }}>
        {t('home.noActivity')}
      </Text>
    );
  }

  return (
    <View>
      <View style={{ gap: 2 }}>
        {items.map((e) => {
          const Icon = e.icon;
          const route = resolveActivityRoute(e.path);
          const content = (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, paddingHorizontal: 4 }}>
              <Icon size={15} color={colors.forest} style={{ marginTop: 1 }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 12 }} numberOfLines={1}>
                  {e.title}
                </Text>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 1 }}>
                  {e.time}
                </Text>
              </View>
            </View>
          );
          return route ? (
            <Pressable key={e.id} onPress={() => navigation.navigate(route.screen, route.params)} accessibilityRole="button">
              {content}
            </Pressable>
          ) : (
            <View key={e.id}>{content}</View>
          );
        })}
      </View>
      <Pressable onPress={() => navigation.navigate('Activity')} accessibilityRole="button" style={{ marginTop: 6, paddingHorizontal: 4 }}>
        <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>{t('home.viewAllActivity')}</Text>
      </Pressable>
    </View>
  );
}
