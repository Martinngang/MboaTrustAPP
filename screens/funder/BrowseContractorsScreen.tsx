import { View, Text, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Trophy, ShieldCheck, User, Calendar } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { PillButton } from '../../components/PillButton';
import { Stars } from '../../components/Stars';
import { EmptyState } from '../../components/EmptyState';
import { useListBottomPadding } from '../../hooks/useListBottomPadding';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useContractorProfilesInfiniteQuery } from '../../api/contractors';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

// Ported from MboaTrustFrontend/src/screens/FunderScreens.tsx's
// BidComparisonScreen — the general "browse the contractor marketplace"
// surface, distinct from TenderBidsScreen (comparing bids on one specific
// tender). Backed by the real /contractor-profiles directory.
export function BrowseContractorsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useContractorProfilesInfiniteQuery();
  const contractors = data?.pages.flatMap((p) => p.items) ?? [];
  const bottomPadding = useListBottomPadding();

  return (
    <Screen
      scroll={false}
      contentContainerStyle={{ paddingBottom: 0 }}
      header={<Header title={t('browseContractors.title')} subtitle={`${contractors.length} ${t('browseContractors.contractors')}`} back />}
    >
      <FlatList
        data={contractors}
        keyExtractor={(c) => c.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <Pressable onPress={() => navigation.navigate('ContractorLeaderboard')} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginBottom: 12 }}>
            <Trophy size={14} color={colors.forest} />
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>{t('browseContractors.viewLeaderboard')}</Text>
          </Pressable>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color={colors.forest} />
            </View>
          ) : (
            <EmptyState icon={User} title={t('browseContractors.noContractorsFound')} />
          )
        }
        ListFooterComponent={
          hasNextPage ? (
            <PillButton variant="secondary" onPress={() => fetchNextPage()} disabled={isFetchingNextPage} fullWidth>
              {isFetchingNextPage ? t('browseContractors.loading') : t('browseContractors.loadMore')}
            </PillButton>
          ) : null
        }
        renderItem={({ item: c }) => (
          <Card style={{ padding: 14, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 16 }}>{c.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }} numberOfLines={1}>{c.name}</Text>
                  {c.verified && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <ShieldCheck size={12} color={colors.forest} />
                      <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 9 }}>{t('browseContractors.verified')}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', marginTop: 1 }}>
                  {c.trade} · {c.location}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <Stars rating={c.rating} />
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>{c.jobs} {t('browseContractors.completedJobs')}</Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 16, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.parchmentDark }}>
              <Pressable
                onPress={() => navigation.navigate('ContractorPortfolio', { userId: c.id })}
                accessibilityRole="button"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
              >
                <User size={13} color={colors.forest} />
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>{t('browseContractors.viewPortfolio')}</Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('AvailabilityCalendar', { userId: c.id })}
                accessibilityRole="button"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
              >
                <Calendar size={13} color={colors.forest} />
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>{t('browseContractors.availability')}</Text>
              </Pressable>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}
