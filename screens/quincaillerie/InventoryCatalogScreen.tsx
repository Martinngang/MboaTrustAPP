import { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator, FlatList, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Package, Plus, Search, X, AlertTriangle, ArrowUpDown, Check } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { PillButton } from '../../components/PillButton';
import { BottomSheetModal } from '../../components/BottomSheetModal';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useListBottomPadding } from '../../hooks/useListBottomPadding';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useMyInventoryQuery, useBulkInventoryActionMutation, type InventoryFilters } from '../../api/inventoryItems';
import { apiErrorMessage } from '../../api/client';
import { CATEGORY_NAMES } from '../../inventoryTaxonomy';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';
import type { TranslationKey } from '../../i18n/translations';

const STATUS_FILTERS: { id: 'active' | 'archived' | 'all'; labelKey: TranslationKey }[] = [
  { id: 'active', labelKey: 'invCatalog.filterActive' },
  { id: 'archived', labelKey: 'invCatalog.filterArchived' },
  { id: 'all', labelKey: 'invCatalog.filterAll' },
];

const SORT_OPTIONS: { value: NonNullable<InventoryFilters['sortBy']>; labelKey: TranslationKey }[] = [
  { value: 'name', labelKey: 'invCatalog.sortName' },
  { value: 'price', labelKey: 'invCatalog.sortPrice' },
  { value: 'quantityAvailable', labelKey: 'invCatalog.sortStock' },
  { value: 'createdAt', labelKey: 'invCatalog.sortRecent' },
];

const PAGE_SIZE = 20;

// The owner's full catalogue manager — search, category/status/low-stock
// filters, sort, real server-side pagination, and bulk multi-select
// (archive/restore/delete many at once), matching
// MboaTrustFrontend/src/screens/InventoryScreen.tsx. Per-item actions
// (edit/duplicate/archive/restore/delete) live on InventoryItemFormScreen
// (tap a card to edit) rather than inline on the card — that relocation is
// a deliberate, platform-appropriate difference, not a gap.
export function InventoryCatalogScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<NonNullable<InventoryFilters['sortBy']>>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory, statusFilter, lowStockOnly, sortBy, sortDir]);

  const filters: InventoryFilters = {
    search: debouncedSearch || undefined,
    category: selectedCategory === 'All' ? undefined : selectedCategory,
    status: statusFilter,
    lowStockOnly: lowStockOnly || undefined,
    sortBy,
    sortDir,
    page,
    limit: PAGE_SIZE,
  };
  const { data, isLoading } = useMyInventoryQuery(filters);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pullToRefresh = usePullToRefresh();
  const bottomPadding = useListBottomPadding();
  const bulkMutation = useBulkInventoryActionMutation();

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const runBulk = (action: 'archive' | 'restore' | 'delete') => {
    bulkMutation.mutate(
      { ids: [...selectedIds], action },
      {
        onSuccess: (res) => {
          const key: TranslationKey =
            action === 'archive' ? 'invCatalog.itemsArchived' : action === 'restore' ? 'invCatalog.itemsRestored' : 'invCatalog.itemsDeleted';
          showToast({ title: `${res.matched} ${t(key)}`, tone: 'success' });
          clearSelection();
        },
        onError: (err) => showToast({ title: t('invCatalog.bulkActionFailed'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' }),
      }
    );
  };

  const confirmBulkDelete = () => {
    Alert.alert(
      `${t('invCatalog.deleteCountPrefix')} ${selectedIds.size} ${selectedIds.size === 1 ? t('invCatalog.product') : t('invCatalog.products')}?`,
      t('invCatalog.bulkDeleteDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('invCatalog.deleteAll'), style: 'destructive', onPress: () => runBulk('delete') },
      ]
    );
  };

  const currentSortLabel = t(SORT_OPTIONS.find((o) => o.value === sortBy)?.labelKey ?? 'invCatalog.sortName');

  return (
    <Screen
      scroll={false}
      contentContainerStyle={{ paddingBottom: 0 }}
      header={
        <Header
          title={t('invCatalog.title')}
          subtitle={`${total} ${t('invCatalog.items')}`}
          back
          action={
            <Pressable
              onPress={() => navigation.navigate('InventoryItemForm', undefined)}
              accessibilityRole="button"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 14,
                backgroundColor: colors.forest,
              }}
            >
              <Plus size={14} color="#fff" strokeWidth={2.5} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>{t('invCatalog.add')}</Text>
            </Pressable>
          }
        />
      }
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
        refreshing={pullToRefresh.refreshing}
        onRefresh={pullToRefresh.onRefresh}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 16 }}>
            {/* Search Bar */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.parchmentDark,
                paddingHorizontal: 12,
                paddingVertical: 8,
                gap: 8,
              }}
            >
              <Search size={18} color={colors.inkSubtle} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('invCatalog.searchPlaceholder')}
                placeholderTextColor={colors.inkSubtle}
                style={{ flex: 1, fontFamily: FONT.sans, color: colors.ink, fontSize: 13, padding: 0 }}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={6} accessibilityRole="button">
                  <X size={16} color={colors.inkSubtle} />
                </Pressable>
              ) : null}
            </View>

            {/* Status Filter */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {STATUS_FILTERS.map((f) => {
                const active = statusFilter === f.id;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => setStatusFilter(f.id)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: active ? colors.amber : colors.parchmentDark,
                      backgroundColor: active ? colors.amber + '18' : colors.surface,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? colors.amber : colors.inkMuted }}>{t(f.labelKey)}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Category Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {['All', ...CATEGORY_NAMES].map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: active ? colors.forest : colors.parchmentDark,
                      backgroundColor: active ? colors.forest + '15' : colors.surface,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? colors.forest : colors.inkMuted }}>{cat}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Low-stock toggle + Sort */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable
                onPress={() => setLowStockOnly((v) => !v)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: lowStockOnly ? colors.seal : colors.parchmentDark,
                  backgroundColor: lowStockOnly ? colors.seal + '15' : colors.surface,
                }}
              >
                <AlertTriangle size={12} color={lowStockOnly ? colors.seal : colors.inkMuted} />
                <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 12, color: lowStockOnly ? colors.seal : colors.inkMuted }}>
                  {t('invCatalog.lowStockOnly')}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSortModalOpen(true)}
                style={{
                  marginLeft: 'auto',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.parchmentDark,
                  backgroundColor: colors.surface,
                }}
              >
                <ArrowUpDown size={12} color={colors.inkMuted} />
                <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 12, color: colors.inkMuted }}>{currentSortLabel}</Text>
              </Pressable>
            </View>

            {/* Select-mode toggle */}
            <Pressable onPress={() => (selectMode ? clearSelection() : setSelectMode(true))} accessibilityRole="button" style={{ alignSelf: 'flex-start' }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
                {selectMode ? t('invCatalog.cancelSelection') : t('invCatalog.selectMultiple')}
              </Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color={colors.forest} />
            </View>
          ) : (
            <EmptyState
              icon={Package}
              title={t('invCatalog.noMaterialsFound')}
              description={t('invCatalog.noMaterialsDesc')}
            />
          )
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 }}>
              <Pressable
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.parchmentDark, opacity: page === 1 ? 0.4 : 1 }}
              >
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 12 }}>{t('invCatalog.prevPage')}</Text>
              </Pressable>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('invCatalog.pagePrefix')} {page} {t('invCatalog.pageOfInfix')} {totalPages}
              </Text>
              <Pressable
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.parchmentDark, opacity: page === totalPages ? 0.4 : 1 }}
              >
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 12 }}>{t('invCatalog.nextPage')}</Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const selected = selectedIds.has(item.id);
          return (
            <Pressable
              onPress={() => (selectMode ? toggleSelect(item.id) : navigation.navigate('InventoryItemForm', { itemId: item.id }))}
              accessibilityRole="button"
            >
              <Card style={[{ padding: 14, gap: 10 }, selected ? { borderColor: colors.forest, borderWidth: 1.5 } : null]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  {selectMode && (
                    <View
                      style={{
                        width: 20, height: 20, borderRadius: 6, marginTop: 2, alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1.5, borderColor: selected ? colors.forest : colors.parchmentDark,
                        backgroundColor: selected ? colors.forest : 'transparent',
                      }}
                    >
                      {selected && <Check size={13} color="#fff" strokeWidth={3} />}
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.amber + '15' }}>
                        <Text style={{ fontFamily: FONT.mono, color: colors.amber, fontSize: 10, fontWeight: '700' }}>{item.category}</Text>
                      </View>
                      {item.status === 'archived' && <StatusBadge status="archived" />}
                    </View>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{item.name}</Text>
                    {item.description ? (
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: colors.parchmentDark,
                  }}
                >
                  <View>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>{t('invCatalog.unitPrice')}</Text>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16, marginTop: 1 }}>
                      {fmt(item.price)} <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: colors.inkSubtle }}>/ {item.unit}</Text>
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>{t('invCatalog.stockLevel')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.isLowStock ? colors.seal : colors.forest }} />
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: item.isLowStock ? colors.seal : colors.ink, fontSize: 12 }}>
                        {item.quantityAvailable} {item.unit}s {item.isLowStock ? t('invCatalog.lowStock') : t('invCatalog.available')}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        }}
      />

      {/* Bulk-action bar */}
      {selectMode && selectedIds.size > 0 && (
        <View
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.parchmentDark, backgroundColor: colors.surface,
          }}
        >
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
            {selectedIds.size} {t('invCatalog.selected')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              disabled={bulkMutation.isPending}
              onPress={() => runBulk('archive')}
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.parchment }}
            >
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 12 }}>{t('invCatalog.archive')}</Text>
            </Pressable>
            <Pressable
              disabled={bulkMutation.isPending}
              onPress={() => runBulk('restore')}
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.parchment }}
            >
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>{t('invCatalog.restore')}</Text>
            </Pressable>
            <Pressable
              disabled={bulkMutation.isPending}
              onPress={confirmBulkDelete}
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.seal + '18' }}
            >
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>{t('invCatalog.delete')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Sort picker */}
      <BottomSheetModal visible={sortModalOpen} onClose={() => setSortModalOpen(false)}>
        <View style={{ padding: 20, gap: 16 }}>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 17 }}>{t('invCatalog.sortBy')}</Text>
          <View style={{ gap: 4 }}>
            {SORT_OPTIONS.map((o) => {
              const active = sortBy === o.value;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => setSortBy(o.value)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}
                >
                  <Text style={{ fontFamily: active ? FONT.sansSemiBold : FONT.sans, color: active ? colors.forest : colors.ink, fontSize: 14 }}>
                    {t(o.labelKey)}
                  </Text>
                  {active && <Check size={16} color={colors.forest} />}
                </Pressable>
              );
            })}
          </View>
          <PillButton
            variant="secondary"
            onPress={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            fullWidth
          >
            {sortDir === 'asc' ? t('invCatalog.ascending') : t('invCatalog.descending')}
          </PillButton>
          <PillButton variant="primary" onPress={() => setSortModalOpen(false)} fullWidth>
            {t('invCatalog.done')}
          </PillButton>
        </View>
      </BottomSheetModal>
    </Screen>
  );
}
