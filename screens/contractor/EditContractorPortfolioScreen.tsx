import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, ImagePlus } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import {
  useContractorPortfolioQuery,
  useUpsertMyContractorProfileMutation,
  type PortfolioImage,
  type PickedImage,
} from '../../api/contractors';
import { apiErrorMessage } from '../../api/client';
import { PROJECT_CATEGORIES } from '../../inventoryTaxonomy';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

// Ported from MboaTrustFrontend/src/screens/ContractorPortfolioScreens.tsx's
// EditContractorPortfolioScreen — same fields (headline, bio, years,
// categories, regions, services, up to 8 portfolio images), same real
// PUT /contractor-profiles/me call. Categories unified onto the same sector
// taxonomy tender categories use (PROJECT_CATEGORIES) — this used to be a
// separate trade-skill list that could never match a tender's category in
// contractorMatchingService's scoring (30 of 100 points).
const TRADES = PROJECT_CATEGORIES;
const REGIONS = ['Centre', 'Littoral', 'North West', 'South West', 'West', 'Far North', 'North', 'Adamawa', 'East', 'South'];

function MultiChipRow({ options, value, onChange, activeColor }: { options: string[]; value: string[]; onChange: (v: string[]) => void; activeColor: string }) {
  const { colors } = useTheme();
  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => toggle(opt)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 14,
              backgroundColor: active ? activeColor : colors.parchment,
            }}
          >
            <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? '#fff' : colors.inkMuted }}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EditContractorPortfolioScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { data: existing, isLoading } = useContractorPortfolioQuery(user?._id);
  const upsert = useUpsertMyContractorProfileMutation();

  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [yearsExperience, setYearsExperience] = useState('0');
  const [categories, setCategories] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState('');
  const [existingImages, setExistingImages] = useState<PortfolioImage[]>([]);
  const [newImages, setNewImages] = useState<PickedImage[]>([]);
  const bioRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!existing) return;
    setHeadline(existing.headline);
    setBio(existing.bio);
    setYearsExperience(String(existing.yearsExperience));
    setCategories(existing.categories);
    setRegions(existing.regions);
    setServices(existing.services);
    setExistingImages(existing.portfolioImages);
  }, [existing]);

  const addService = () => {
    const v = serviceInput.trim();
    if (!v || services.includes(v)) return;
    setServices((s) => [...s, v]);
    setServiceInput('');
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast({ title: t('editPortfolio.permissionRequired'), description: t('editPortfolio.photoLibraryAccess'), tone: 'error' });
      return;
    }
    const remaining = 8 - existingImages.length - newImages.length;
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
    ].slice(0, 8 - existingImages.length));
  };

  const save = async () => {
    try {
      await upsert.mutateAsync({
        headline: headline.trim(),
        bio: bio.trim(),
        categories,
        regions,
        services,
        yearsExperience: Number(yearsExperience) || 0,
        existingPortfolioImages: existingImages,
        newPortfolioImages: newImages,
      });
      showToast({ title: t('editPortfolio.portfolioSaved'), tone: 'success' });
      navigation.goBack();
    } catch (err) {
      showToast({ title: t('editPortfolio.failedToSave'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  if (isLoading) {
    return (
      <Screen header={<Header title={t('editPortfolio.title')} back />}>
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  const totalImages = existingImages.length + newImages.length;

  return (
    <Screen header={<Header title={t('editPortfolio.title')} back />}>
      <View style={{ padding: 16, gap: 16 }}>
        <Card style={{ padding: 16, gap: 14 }}>
          <TextField
            label={t('editPortfolio.headlineLabel')}
            placeholder="e.g. Master Plumber — 12 years, Douala"
            value={headline}
            onChangeText={setHeadline}
            maxLength={140}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => bioRef.current?.focus()}
          />
          <TextField ref={bioRef} label={t('editPortfolio.aboutLabel')} placeholder={t('editPortfolio.aboutPlaceholder')} value={bio} onChangeText={setBio} multiline numberOfLines={4} style={{ minHeight: 90, textAlignVertical: 'top' }} />
          <TextField label={t('editPortfolio.yearsExpLabel')} value={yearsExperience} onChangeText={(v) => setYearsExperience(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" returnKeyType="done" containerStyle={{ width: 100 }} />
        </Card>

        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('editPortfolio.skillsAndTrades')}</Text>
          <MultiChipRow options={TRADES} value={categories} onChange={setCategories} activeColor={colors.forest} />
        </Card>

        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('editPortfolio.regionsYouWorkIn')}</Text>
          <MultiChipRow options={REGIONS} value={regions} onChange={setRegions} activeColor={colors.amber} />
        </Card>

        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('editPortfolio.servicesOffered')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextField
              placeholder={t('editPortfolio.servicePlaceholder')}
              value={serviceInput}
              onChangeText={setServiceInput}
              containerStyle={{ flex: 1 }}
              returnKeyType="done"
              onSubmitEditing={addService}
            />
            <Pressable
              onPress={addService}
              disabled={!serviceInput.trim()}
              accessibilityRole="button"
              style={{ paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center', opacity: !serviceInput.trim() ? 0.5 : 1 }}
            >
              <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 13 }}>{t('editPortfolio.add')}</Text>
            </Pressable>
          </View>
          {services.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {services.map((s) => (
                <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.parchment, paddingLeft: 12, paddingRight: 6, paddingVertical: 6, borderRadius: 14 }}>
                  <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12 }}>{s}</Text>
                  <Pressable onPress={() => setServices((arr) => arr.filter((x) => x !== s))} accessibilityRole="button">
                    <X size={12} color={colors.inkMuted} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('editPortfolio.portfolioImages')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {existingImages.map((img) => (
              <View key={img._id ?? img.url} style={{ width: 76, height: 76, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.parchmentDark }}>
                <Image source={{ uri: img.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <Pressable
                  onPress={() => setExistingImages((arr) => arr.filter((i) => i !== img))}
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
            {totalImages < 8 && (
              <Pressable
                onPress={pickImages}
                accessibilityRole="button"
                style={{ width: 76, height: 76, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.parchmentDark, alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                <ImagePlus size={18} color={colors.inkSubtle} />
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase' }}>{t('editPortfolio.add')}</Text>
              </Pressable>
            )}
          </View>
        </Card>

        <PillButton variant="primary" onPress={save} loading={upsert.isPending} disabled={upsert.isPending} fullWidth>
          {t('editPortfolio.savePortfolio')}
        </PillButton>
      </View>
    </Screen>
  );
}
