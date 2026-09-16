import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, ImagePlus, Copy, Trash2, AlertCircle } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import {
  useInventoryItemQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDuplicateInventoryItemMutation,
  useArchiveInventoryItemMutation,
  useRestoreInventoryItemMutation,
  useDeleteInventoryItemMutation,
  type Specification,
  type PickedImage,
} from '../../api/inventoryItems';
import { CATEGORY_NAMES, subcategoriesFor, PROJECT_CATEGORIES, UNIT_SUGGESTIONS } from '../../inventoryTaxonomy';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'InventoryItemForm'>;

// Ported from MboaTrustFrontend/src/screens/InventoryItemFormScreen.tsx —
// one form for both add and edit (route param `itemId` decides which),
// covering identity/images/pricing & stock/sourced-from/specifications/
// dimensions/project suitability, plus the edit-only duplicate/archive/
// restore/delete actions the previous mobile screen had no way to reach.
export function InventoryItemFormScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const itemId = route.params?.itemId;
  const isEdit = Boolean(itemId);

  const { data: existing, isLoading } = useInventoryItemQuery(itemId);
  const createMutation = useCreateInventoryItemMutation();
  const updateMutation = useUpdateInventoryItemMutation();
  const duplicateMutation = useDuplicateInventoryItemMutation();
  const archiveMutation = useArchiveInventoryItemMutation();
  const restoreMutation = useRestoreInventoryItemMutation();
  const deleteMutation = useDeleteInventoryItemMutation();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [quantityAvailable, setQuantityAvailable] = useState('0');
  const [minStockLevel, setMinStockLevel] = useState('0');
  const [sourcedFromName, setSourcedFromName] = useState('');
  const [sourcedFromContact, setSourcedFromContact] = useState('');
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [projectSuitability, setProjectSuitability] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<PickedImage[]>([]);
  const skuRef = useRef<TextInput>(null);
  const brandRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);
  const minStockRef = useRef<TextInput>(null);
  const sourcedContactRef = useRef<TextInput>(null);
  const widthRef = useRef<TextInput>(null);
  const heightRef = useRef<TextInput>(null);
  const weightRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setSku(existing.sku);
    setBrand(existing.brand);
    setCategory(existing.category);
    setSubcategory(existing.subcategory);
    setDescription(existing.description);
    setUnit(existing.unit);
    setPrice(String(existing.price));
    setQuantityAvailable(String(existing.quantityAvailable));
    setMinStockLevel(String(existing.minStockLevel));
    setSourcedFromName(existing.sourcedFrom.name);
    setSourcedFromContact(existing.sourcedFrom.contact);
    setSpecifications(existing.specifications);
    setLength(existing.dimensions.length != null ? String(existing.dimensions.length) : '');
    setWidth(existing.dimensions.width != null ? String(existing.dimensions.width) : '');
    setHeight(existing.dimensions.height != null ? String(existing.dimensions.height) : '');
    setWeightKg(existing.dimensions.weightKg != null ? String(existing.dimensions.weightKg) : '');
    setProjectSuitability(existing.projectSuitability);
    setExistingImages(existing.images);
  }, [existing]);

  const addSpecRow = () => setSpecifications((s) => [...s, { key: '', value: '' }]);
  const updateSpecRow = (i: number, patch: Partial<Specification>) => setSpecifications((s) => s.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const removeSpecRow = (i: number) => setSpecifications((s) => s.filter((_, idx) => idx !== i));

  const toggleProjectType = (p: string) => {
    setProjectSuitability((arr) => (arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]));
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast({ title: t('invForm.permissionRequired'), description: t('invForm.photoLibraryAccess'), tone: 'error' });
      return;
    }
    const remaining = 6 - existingImages.length - newImages.length;
    if (remaining <= 0) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });
    if (picked.canceled || !picked.assets?.length) return;
    setNewImages((prev) => [
      ...prev,
      ...picked.assets.map((a) => ({ uri: a.uri, fileName: a.fileName, mimeType: a.mimeType })),
    ].slice(0, 6 - existingImages.length));
  };

  const valid = name.trim().length > 0 && category.trim().length > 0 && unit.trim().length > 0 && price.trim().length > 0 && Number(price) >= 0;

  const save = async () => {
    if (!valid) return;
    const input = {
      name: name.trim(),
      sku: sku.trim(),
      category: category.trim(),
      subcategory: subcategory.trim(),
      description: description.trim(),
      unit: unit.trim(),
      price: Number(price) || 0,
      quantityAvailable: Number(quantityAvailable) || 0,
      minStockLevel: Number(minStockLevel) || 0,
      brand: brand.trim(),
      sourcedFrom: { name: sourcedFromName.trim(), contact: sourcedFromContact.trim() },
      specifications: specifications.filter((s) => s.key.trim() && s.value.trim()),
      dimensions: {
        length: length ? Number(length) : null,
        width: width ? Number(width) : null,
        height: height ? Number(height) : null,
        unit: 'cm',
        weightKg: weightKg ? Number(weightKg) : null,
      },
      projectSuitability,
      existingImages,
      newImages,
    };
    try {
      if (isEdit && itemId) {
        await updateMutation.mutateAsync({ id: itemId, input });
        showToast({ title: t('invForm.productUpdated'), tone: 'success' });
      } else {
        await createMutation.mutateAsync(input);
        showToast({ title: t('invForm.productAdded'), tone: 'success' });
      }
      navigation.goBack();
    } catch (err) {
      showToast({ title: t('invForm.failedToSave'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  const handleArchiveToggle = async () => {
    if (!existing) return;
    try {
      if (existing.status === 'active') {
        await archiveMutation.mutateAsync(existing.id);
        showToast({ title: t('invForm.archived'), tone: 'success' });
      } else {
        await restoreMutation.mutateAsync(existing.id);
        showToast({ title: t('invForm.restored'), tone: 'success' });
      }
    } catch (err) {
      showToast({ title: t('invForm.failed'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  const handleDuplicate = async () => {
    if (!existing) return;
    try {
      const dup = await duplicateMutation.mutateAsync(existing.id);
      showToast({ title: t('invForm.duplicated'), tone: 'success' });
      navigation.replace('InventoryItemForm', { itemId: dup.id });
    } catch (err) {
      showToast({ title: t('invForm.failed'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert(
      t('invForm.deleteProductTitle'),
      `${existing.name} ${t('invForm.deleteProductDesc')}`,
      [
        { text: t('invForm.cancel'), style: 'cancel' },
        {
          text: t('invForm.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(existing.id);
              showToast({ title: t('invForm.productDeleted'), tone: 'success' });
              navigation.goBack();
            } catch (err) {
              showToast({ title: t('invForm.failed'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
            }
          },
        },
      ]
    );
  };

  if (isEdit && isLoading) {
    return (
      <Screen header={<Header title={t('invForm.editTitle')} back />}>
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  const saving = createMutation.isPending || updateMutation.isPending;
  const lowStock = Number(quantityAvailable) <= Number(minStockLevel);
  const totalImages = existingImages.length + newImages.length;

  return (
    <Screen
      header={
        <Header
          title={isEdit ? t('invForm.editTitle') : t('invForm.addTitle')}
          back
          action={
            isEdit && existing ? (
              <Pressable
                onPress={handleArchiveToggle}
                accessibilityRole="button"
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: colors.parchmentDark }}
              >
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.inkMuted, fontSize: 11 }}>
                  {existing.status === 'active' ? t('invForm.archive') : t('invForm.restore')}
                </Text>
              </Pressable>
            ) : undefined
          }
        />
      }
    >
      <View style={{ padding: 16, gap: 16 }}>
        <Card style={{ padding: 16, gap: 12 }}>
          <TextField
            label={t('invForm.productNameLabel')}
            placeholder="e.g. Cement (50kg bag)"
            value={name}
            onChangeText={setName}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => skuRef.current?.focus()}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextField
              ref={skuRef}
              label={t('invForm.skuLabel')}
              placeholder={t('invForm.optional')}
              value={sku}
              onChangeText={setSku}
              containerStyle={{ flex: 1 }}
              autoCapitalize="characters"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => brandRef.current?.focus()}
            />
            <TextField ref={brandRef} label={t('invForm.brandLabel')} placeholder={t('invForm.optional')} value={brand} onChangeText={setBrand} containerStyle={{ flex: 1 }} autoCapitalize="words" returnKeyType="done" />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('invForm.categoryLabel')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {CATEGORY_NAMES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => { setCategory(c); setSubcategory(''); }}
                  accessibilityRole="button"
                  style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: category === c ? colors.forest : colors.parchment }}
                >
                  <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: category === c ? '#fff' : colors.ink }}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {category ? (
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('invForm.subcategoryLabel')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {subcategoriesFor(category).map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setSubcategory(s)}
                    accessibilityRole="button"
                    style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: subcategory === s ? colors.amber : colors.parchment }}
                  >
                    <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: subcategory === s ? '#fff' : colors.ink }}>{s}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <TextField label={t('invForm.descriptionLabel')} placeholder={t('invForm.descriptionPlaceholder')} value={description} onChangeText={setDescription} multiline numberOfLines={3} style={{ minHeight: 70, textAlignVertical: 'top' }} />
        </Card>

        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('invForm.photosLabel')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {existingImages.map((url) => (
              <View key={url} style={{ width: 76, height: 76, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.parchmentDark }}>
                <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <Pressable
                  onPress={() => setExistingImages((arr) => arr.filter((u) => u !== url))}
                  accessibilityRole="button"
                  style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={11} color="#fff" />
                </Pressable>
              </View>
            ))}
            {newImages.map((img, i) => (
              <View key={i} style={{ width: 76, height: 76, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.forest }}>
                <Image source={{ uri: img.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <Pressable
                  onPress={() => setNewImages((arr) => arr.filter((_, idx) => idx !== i))}
                  accessibilityRole="button"
                  style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={11} color="#fff" />
                </Pressable>
              </View>
            ))}
            {totalImages < 6 && (
              <Pressable
                onPress={pickImages}
                accessibilityRole="button"
                style={{ width: 76, height: 76, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.parchmentDark, alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                <ImagePlus size={18} color={colors.inkSubtle} />
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase' }}>{t('invCatalog.add')}</Text>
              </Pressable>
            )}
          </View>
        </Card>

        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('invForm.pricingAndStock')}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextField
              label={t('invForm.unitLabel')}
              placeholder={t('invForm.unitPlaceholder')}
              value={unit}
              onChangeText={setUnit}
              containerStyle={{ flex: 1 }}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => priceRef.current?.focus()}
            />
            <TextField
              ref={priceRef}
              label={t('invForm.priceLabel')}
              placeholder="0"
              value={price}
              onChangeText={(v) => setPrice(v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
              returnKeyType="done"
            />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {UNIT_SUGGESTIONS.map((u) => (
              <Pressable key={u} onPress={() => setUnit(u)} accessibilityRole="button" style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: unit === u ? colors.forest + '20' : colors.parchment }}>
                <Text style={{ fontFamily: FONT.sans, fontSize: 11, color: unit === u ? colors.forest : colors.inkMuted }}>{u}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextField
              label={t('invForm.quantityAvailableLabel')}
              value={quantityAvailable}
              onChangeText={(v) => setQuantityAvailable(v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => minStockRef.current?.focus()}
            />
            <TextField
              ref={minStockRef}
              label={t('invForm.minStockLabel')}
              value={minStockLevel}
              onChangeText={(v) => setMinStockLevel(v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
              returnKeyType="done"
            />
          </View>
          {lowStock && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.seal + '15', padding: 10, borderRadius: 10 }}>
              <AlertCircle size={13} color={colors.seal} />
              <Text style={{ fontFamily: FONT.sans, color: colors.seal, fontSize: 12 }}>{t('invForm.willShowLowStock')}</Text>
            </View>
          )}
        </Card>

        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('invForm.sourcedFromLabel')}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextField
              label={t('invForm.vendorNameLabel')}
              value={sourcedFromName}
              onChangeText={setSourcedFromName}
              containerStyle={{ flex: 1 }}
              autoCapitalize="words"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => sourcedContactRef.current?.focus()}
            />
            <TextField
              ref={sourcedContactRef}
              label={t('invForm.vendorContactLabel')}
              placeholder={t('invForm.phoneOrEmail')}
              value={sourcedFromContact}
              onChangeText={setSourcedFromContact}
              containerStyle={{ flex: 1 }}
              returnKeyType="done"
            />
          </View>
        </Card>

        <Card style={{ padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('invForm.specifications')}</Text>
            <Pressable onPress={addSpecRow} accessibilityRole="button">
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>{t('invForm.addRow')}</Text>
            </Pressable>
          </View>
          {specifications.length === 0 ? (
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, fontStyle: 'italic' }}>{t('invForm.specExample')}</Text>
          ) : (
            specifications.map((spec, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextField placeholder={t('invForm.keyPlaceholder')} value={spec.key} onChangeText={(v) => updateSpecRow(i, { key: v })} containerStyle={{ width: '35%' }} />
                <TextField placeholder={t('invForm.valuePlaceholder')} value={spec.value} onChangeText={(v) => updateSpecRow(i, { value: v })} containerStyle={{ flex: 1 }} />
                <Pressable onPress={() => removeSpecRow(i)} accessibilityRole="button" style={{ paddingTop: 8 }}>
                  <X size={14} color={colors.seal} />
                </Pressable>
              </View>
            ))
          )}
        </Card>

        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('invForm.dimensionsLabel')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextField
              placeholder="L"
              value={length}
              onChangeText={(v) => setLength(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              containerStyle={{ flex: 1 }}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => widthRef.current?.focus()}
            />
            <TextField
              ref={widthRef}
              placeholder="W"
              value={width}
              onChangeText={(v) => setWidth(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              containerStyle={{ flex: 1 }}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => heightRef.current?.focus()}
            />
            <TextField
              ref={heightRef}
              placeholder="H"
              value={height}
              onChangeText={(v) => setHeight(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              containerStyle={{ flex: 1 }}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => weightRef.current?.focus()}
            />
          </View>
          <TextField ref={weightRef} label={t('invForm.weightLabel')} value={weightKg} onChangeText={(v) => setWeightKg(v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" returnKeyType="done" />
        </Card>

        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('invForm.suitedForLabel')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PROJECT_CATEGORIES.map((p) => {
              const active = projectSuitability.includes(p);
              return (
                <Pressable
                  key={p}
                  onPress={() => toggleProjectType(p)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: active ? colors.forest : colors.parchment }}
                >
                  <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? '#fff' : colors.inkMuted }}>{p}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {isEdit && existing && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={handleDuplicate}
              accessibilityRole="button"
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.parchmentDark }}
            >
              <Copy size={13} color={colors.ink} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 12 }}>{t('invForm.duplicate')}</Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              accessibilityRole="button"
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.seal }}
            >
              <Trash2 size={13} color={colors.seal} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>{t('invForm.delete')}</Text>
            </Pressable>
          </View>
        )}

        <PillButton variant="primary" onPress={save} loading={saving} disabled={!valid || saving} fullWidth>
          {isEdit ? t('invForm.saveChanges') : t('invForm.addProduct')}
        </PillButton>
      </View>
    </Screen>
  );
}
