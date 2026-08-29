import { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Modal, ActivityIndicator, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Package,
  Plus,
  Search,
  X,
  Layers,
  CheckCircle2,
  AlertCircle,
  Tag,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import {
  useQuincaillerieInventoryQuery,
  useAddInventoryItemMutation,
  type InventoryItem,
} from '../../api/materials';
import type { MainStackParamList } from '../../navigation/types';

const CATEGORIES = ['All', 'Cement', 'Steel & Rebar', 'Roofing', 'Plumbing', 'Timber'];
const UNITS = ['Bag', 'Bar', 'Sheet', 'Length', 'Tonne', 'Piece', 'm³'];

export function InventoryCatalogScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { data: inventory, isLoading } = useQuincaillerieInventoryQuery();
  const addMutation = useAddInventoryItemMutation();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Add Item form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Cement');
  const [unit, setUnit] = useState('Bag');
  const [price, setPrice] = useState('4950');
  const [stockQuantity, setStockQuantity] = useState('100');
  const [description, setDescription] = useState('');

  const filteredItems = (inventory || []).filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const q = searchQuery.trim().toLowerCase();
    const matchesQ = !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  const handleAddItem = async () => {
    if (!name.trim()) {
      showToast({ title: 'Name Required', description: 'Please enter material name.', tone: 'error' });
      return;
    }
    const numPrice = Number(price) || 0;
    if (numPrice <= 0) {
      showToast({ title: 'Invalid Price', description: 'Please enter a valid price in XAF.', tone: 'error' });
      return;
    }

    try {
      await addMutation.mutateAsync({
        name: name.trim(),
        category,
        unit,
        price: numPrice,
        stockQuantity: Number(stockQuantity) || 10,
        description: description.trim(),
      });

      showToast({ title: 'Material Added!', description: `${name} is now available in your store catalog.`, tone: 'success' });
      setModalOpen(false);
      setName('');
      setDescription('');
    } catch (err: any) {
      showToast({ title: 'Error', description: err?.message || 'Could not add material item.', tone: 'error' });
    }
  };

  return (
    <Screen
      header={
        <Header
          title="Material Catalog"
          subtitle={`${filteredItems.length} items`}
          back
          action={
            <Pressable
              onPress={() => setModalOpen(true)}
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
              <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>
                Add Item
              </Text>
            </Pressable>
          }
        />
      }
    >
      <View style={{ padding: 16, gap: 16 }}>
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
            placeholder="Search cement, rebar, pipes..."
            placeholderTextColor={colors.inkSubtle}
            style={{
              flex: 1,
              fontFamily: FONT.sans,
              color: colors.ink,
              fontSize: 13,
              padding: 0,
            }}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
              <X size={16} color={colors.inkSubtle} />
            </Pressable>
          ) : null}
        </View>

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {CATEGORIES.map((cat) => {
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
                <Text
                  style={{
                    fontFamily: FONT.sansMedium,
                    fontSize: 12,
                    color: active ? colors.forest : colors.inkMuted,
                  }}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Inventory List */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No materials found"
            description="Add products to your catalog so construction funders and contractors can purchase directly."
          />
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} style={{ padding: 14, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: colors.amber + '15',
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.mono, color: colors.amber, fontSize: 10, fontWeight: '700' }}>
                      {item.category}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                    {item.name}
                  </Text>
                  {item.description ? (
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Price & Stock info */}
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
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                    Unit Price
                  </Text>
                  <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16, marginTop: 1 }}>
                    {fmt(item.price)} <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: colors.inkSubtle }}>/ {item.unit}</Text>
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                    Stock Level
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.forest }} />
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 12 }}>
                      {item.stockQuantity} {item.unit}s Available
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Add New Material Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>Add Material to Catalog</Text>
              <Pressable onPress={() => setModalOpen(false)} hitSlop={6}>
                <X size={20} color={colors.inkMuted} />
              </Pressable>
            </View>

            <TextField
              label="Material Name & Specification"
              placeholder="e.g. Cimencam 42.5R Super CPJ"
              value={name}
              onChangeText={setName}
            />

            <View style={{ gap: 4 }}>
              <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: category === c ? colors.forest : colors.parchment,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: category === c ? '#fff' : colors.ink }}>
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <TextField
                  label="Unit Price (XAF)"
                  placeholder="4950"
                  value={price}
                  onChangeText={(v) => setPrice(v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  label="Warehouse Stock"
                  placeholder="100"
                  value={stockQuantity}
                  onChangeText={(v) => setStockQuantity(v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TextField
              label="Description / Manufacturer Specs"
              placeholder="Standard grade, packaging details, brand..."
              value={description}
              onChangeText={setDescription}
            />

            <PillButton variant="primary" onPress={handleAddItem} loading={addMutation.isPending} fullWidth>
              Save Material in Store
            </PillButton>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
