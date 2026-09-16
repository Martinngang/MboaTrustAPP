import { useState } from 'react';
import { View, Text, Image, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { HardHat } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { fmt } from '../components/fmt';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useProjectsQuery } from '../api/projects';
import { useTranslation } from '../i18n/useTranslation';

// Ported from MboaTrustFrontend/src/screens/CommunityScreens.tsx's
// PublicShowcaseScreen — same real completed-project browse (reusing the
// same public GET /projects catalog web's `projects` context array is
// populated from), same category/region filters. Web frames this as a
// no-login marketing page; mobile requires being signed in to reach any
// screen at all, so that framing doesn't apply here, but the underlying
// content (browse completed, escrow-verified projects) is identical — this
// is reachable from the Menu's Community section for every role. The
// before/after image-comparison slider is simplified to a single project
// photo, a mobile-appropriate adaptation of a decorative web widget, not a
// missing function — every real data field (category, region, funded
// amount) is still shown.
export function PublicShowcaseScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { data: projects, isLoading } = useProjectsQuery();
  const [category, setCategory] = useState('All');
  const [region, setRegion] = useState('All');

  const regionOf = (location: string) => location.split(',').pop()?.trim() || location;
  const completed = (projects || []).filter((p) => p.status === 'completed');
  const categories = ['All', ...Array.from(new Set(completed.map((p) => p.category)))];
  const regions = ['All', ...Array.from(new Set(completed.map((p) => regionOf(p.location))))];
  const filtered = completed.filter(
    (p) => (category === 'All' || p.category === category) && (region === 'All' || regionOf(p.location) === region)
  );

  return (
    <Screen header={<Header title={t('showcase.title')} back />}>
      <View style={{ padding: 16, gap: 16 }}>
        <View>
          <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('showcase.eyebrow')}
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 19, marginTop: 6 }}>
            {t('showcase.heading')}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, marginTop: 6, lineHeight: 18 }}>
            {t('showcase.subtitle')}
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {categories.map((c) => {
            const active = category === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
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
                <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? colors.forest : colors.inkMuted }}>{c === 'All' ? t('common.all') : c}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {regions.map((r) => {
            const active = region === r;
            return (
              <Pressable
                key={r}
                onPress={() => setRegion(r)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: active ? colors.amber : colors.parchmentDark,
                  backgroundColor: active ? colors.amber + '18' : colors.surface,
                }}
              >
                <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? colors.forestDark : colors.inkMuted }}>{r === 'All' ? t('common.all') : r}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <ActivityIndicator color={colors.forest} style={{ marginTop: 30 }} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={HardHat} title={t('showcase.noMatchTitle')} description={t('showcase.noMatchDesc')} />
        ) : (
          filtered.map((p) => (
            <Card key={p.id} style={{ overflow: 'hidden' }}>
              {p.imageUrl ? <Image source={{ uri: p.imageUrl }} style={{ width: '100%', height: 140 }} resizeMode="cover" /> : null}
              <View style={{ padding: 14 }}>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {p.category} · {regionOf(p.location)}
                </Text>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15, marginTop: 4 }} numberOfLines={2}>
                  {p.title}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 13 }}>{fmt(p.raised)}</Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>{t('showcase.completed')}</Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}
