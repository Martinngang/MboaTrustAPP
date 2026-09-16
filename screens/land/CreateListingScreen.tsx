import { useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  MapPin,
  Check,
  Plus,
  ShieldCheck,
  Compass,
  Maximize2,
  FileCheck,
  Layers,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useCreateLandListingMutation, useAddLandDocumentMutation, type PickedDocument } from '../../api/land';
import { apiErrorMessage } from '../../api/client';
import { AIDeedScanner } from '../../components/AIDeedScanner';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

const REGIONS = ['Centre', 'Littoral', 'Sud', 'Ouest', 'Sud-Ouest', 'Nord-Ouest'];
const FEATURES_LIST = [
  'Direct Road Access',
  'Electricity Grid Connected',
  'City Water Network',
  '100% Flat Build-Ready Terrain',
  'Cadastral Marker Posts Placed',
  'Sea / Coastal View',
  'Commercial Frontage',
];

export function CreateListingScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const createMutation = useCreateLandListingMutation();
  const addDocumentMutation = useAddLandDocumentMutation();
  const [deedPhoto, setDeedPhoto] = useState<PickedDocument | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State — starts empty (placeholder text only guides the shape of a
  // real answer); this used to pre-fill every field with one specific fake
  // listing's data, so publishing without editing anything would have
  // listed that fake plot as the user's own real property.
  const [title, setTitle] = useState('');
  const [region, setRegion] = useState('Centre');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [sizeSqm, setSizeSqm] = useState('');
  const [price, setPrice] = useState('');
  const [titleNumber, setTitleNumber] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const cityRef = useRef<TextInput>(null);
  const neighborhoodRef = useRef<TextInput>(null);
  const sizeSqmRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);

  const numPrice = Number(price) || 0;
  const numSize = Number(sizeSqm) || 1;
  const pricePerSqm = Math.round(numPrice / numSize);

  const toggleFeature = (feat: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!title.trim() || !city.trim()) {
        showToast({ title: t('createListing.missingInformation'), description: t('createListing.enterTitleAndCity'), tone: 'error' });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (numPrice <= 0 || numSize <= 0) {
        showToast({ title: t('createListing.invalidNumbers'), description: t('createListing.enterValidPriceAndSize'), tone: 'error' });
        return;
      }
      if (!titleNumber.trim()) {
        showToast({ title: t('createListing.titleDeedRequired'), description: t('createListing.enterCadastralNumber'), tone: 'error' });
        return;
      }
      setStep(3);
    } else if (step === 3) {
      submitListing();
    }
  };

  const submitListing = async () => {
    // The real backend's LandListing has no neighborhood/titleNumber/
    // features fields — only title/region/city/sizeSqm/price/titleType/
    // description. Rather than silently dropping what the user entered,
    // it's folded into the description, the one free-text field a buyer
    // actually reads.
    const detailLines = [
      description.trim(),
      neighborhood.trim() ? `Neighborhood: ${neighborhood.trim()}` : '',
      titleNumber.trim() ? `Title deed number: ${titleNumber.trim()}` : '',
      selectedFeatures.length > 0 ? `Features: ${selectedFeatures.join(', ')}` : '',
    ].filter(Boolean);

    try {
      const listing = await createMutation.mutateAsync({
        title: title.trim(),
        region,
        city: city.trim(),
        price: numPrice,
        sizeSqm: numSize,
        titleType: 'titre_foncier',
        description: detailLines.join('\n\n'),
      });

      // Best-effort — the listing itself is already real and published;
      // failing to attach the scanned deed photo shouldn't block that.
      if (deedPhoto) {
        await addDocumentMutation.mutateAsync({ listingId: listing.id, file: deedPhoto, type: 'titre_foncier' }).catch(() => {});
      }

      showToast({
        title: t('createListing.listingPublished'),
        description: t('createListing.livePendingVerification'),
        tone: 'success',
      });
      navigation.goBack();
    } catch (err) {
      showToast({ title: t('createListing.error'), description: apiErrorMessage(err, t('createListing.couldNotPublish')), tone: 'error' });
    }
  };

  return (
    <Screen
      header={
        <Header
          title={t('createListing.title')}
          back
          onBack={() => (step > 1 ? setStep((s) => (s - 1) as any) : navigation.goBack())}
        />
      }
    >
      <View style={{ padding: 16, gap: 18 }}>
        {/* Step Indicator */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {[
            { num: 1, label: t('createListing.stepLocation') },
            { num: 2, label: t('createListing.stepTitlePrice') },
            { num: 3, label: t('createListing.stepFeaturesPublish') },
          ].map((s, idx) => (
            <View key={s.num} style={{ flexDirection: 'row', alignItems: 'center', flex: idx < 2 ? 1 : undefined }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: step >= s.num ? colors.seal : colors.parchmentDark,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {step > s.num ? (
                  <Check size={14} color="#fff" strokeWidth={3} />
                ) : (
                  <Text style={{ fontFamily: FONT.mono, color: step >= s.num ? '#fff' : colors.inkSubtle, fontSize: 11, fontWeight: '700' }}>
                    {s.num}
                  </Text>
                )}
              </View>
              {idx < 2 && (
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: step > s.num ? colors.seal : colors.parchmentDark,
                    marginHorizontal: 6,
                  }}
                />
              )}
            </View>
          ))}
        </View>

        {/* Step 1: Location & Title */}
        {step === 1 && (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                {t('createListing.step1Title')}
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                {t('createListing.step1Sub')}
              </Text>
            </View>

            <Card style={{ padding: 16, gap: 14 }}>
              <TextField
                label={t('createListing.listingTitleLabel')}
                placeholder="e.g. 1,200 m² Sea View Plot in Kribi"
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => cityRef.current?.focus()}
              />

              <View style={{ gap: 6 }}>
                <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>{t('createListing.regionLabel')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {REGIONS.map((r) => {
                    const active = region === r;
                    return (
                      <Pressable
                        key={r}
                        onPress={() => setRegion(r)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: active ? colors.seal : colors.parchment,
                        }}
                      >
                        <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? '#fff' : colors.ink }}>
                          {r}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <TextField
                ref={cityRef}
                label={t('createListing.cityLabel')}
                placeholder="e.g. Kribi, Yaoundé, Douala"
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => neighborhoodRef.current?.focus()}
              />

              <TextField
                ref={neighborhoodRef}
                label={t('createListing.neighborhoodLabel')}
                placeholder="e.g. Ngoye Plage, Odza"
                value={neighborhood}
                onChangeText={setNeighborhood}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </Card>
          </View>
        )}

        {/* Step 2: Dimensions, Titre Foncier & Asking Price */}
        {step === 2 && (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                {t('createListing.step2Title')}
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                {t('createListing.step2Sub')}
              </Text>
            </View>

            <Card style={{ padding: 16, gap: 14 }}>
              {/* AI Deed Scanner */}
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <FileCheck size={16} color={colors.forest} />
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                    {t('createListing.aiScannerTitle')}
                  </Text>
                  <View style={{ paddingHorizontal: 7, paddingVertical: 2, backgroundColor: colors.forest + '18', borderRadius: 8 }}>
                    <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>Gemini AI</Text>
                  </View>
                </View>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
                  {t('createListing.aiScannerDesc')}
                </Text>
                <AIDeedScanner
                  onFileSelected={(uri, _base64, mimeType) => setDeedPhoto({ uri, mimeType, fileName: 'deed.jpg' })}
                  onScanComplete={(result) => {
                    if (result.titleNumber) setTitleNumber(result.titleNumber);
                    if (result.plotAreaSqm) setSizeSqm(String(Math.round(result.plotAreaSqm)));
                    if (result.authenticityScore < 50) {
                      showToast({ title: t('createListing.lowAuthenticityScore'), description: t('createListing.aiFlaggedDeed'), tone: 'error' });
                    }
                  }}
                />
              </View>

              <TextField
                label={t('createListing.titleNumberLabel')}
                placeholder="e.g. TF #8812/Oce — auto-filled by AI scanner"
                value={titleNumber}
                onChangeText={setTitleNumber}
                autoCapitalize="characters"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => sizeSqmRef.current?.focus()}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <TextField
                    ref={sizeSqmRef}
                    label={t('createListing.surfaceAreaLabel')}
                    placeholder="1200"
                    value={sizeSqm}
                    onChangeText={(v) => setSizeSqm(v.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => priceRef.current?.focus()}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField
                    ref={priceRef}
                    label={t('createListing.askingPriceLabel')}
                    placeholder="18000000"
                    value={price}
                    onChangeText={(v) => setPrice(v.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                </View>
              </View>

              {/* Price / m2 calculation card */}
              <View
                style={{
                  backgroundColor: colors.parchment,
                  borderRadius: 12,
                  padding: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13 }}>
                  {t('createListing.calculatedPricePerSqm')}
                </Text>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16 }}>
                  {fmt(pricePerSqm)} / m²
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* Step 3: Features, Description & Review */}
        {step === 3 && (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                {t('createListing.step3Title')}
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                {t('createListing.step3Sub')}
              </Text>
            </View>

            <Card style={{ padding: 16, gap: 12 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                {t('createListing.parcelFeatures')}
              </Text>

              <View style={{ gap: 8 }}>
                {FEATURES_LIST.map((feat) => {
                  const active = selectedFeatures.includes(feat);
                  return (
                    <Pressable
                      key={feat}
                      onPress={() => toggleFeature(feat)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        padding: 10,
                        borderRadius: 10,
                        backgroundColor: active ? colors.seal + '12' : colors.parchment,
                        borderWidth: 1,
                        borderColor: active ? colors.seal : colors.parchmentDark,
                      }}
                    >
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          borderWidth: 1.5,
                          borderColor: active ? colors.seal : colors.inkSubtle,
                          backgroundColor: active ? colors.seal : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {active && <Check size={12} color="#fff" strokeWidth={3} />}
                      </View>
                      <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>
                        {feat}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextField
                label={t('createListing.descriptionLabel')}
                placeholder={t('createListing.descriptionPlaceholder')}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </Card>

            <Card style={{ padding: 14, backgroundColor: colors.forest + '12', borderColor: colors.forest + '30', gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={16} color={colors.forest} />
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>
                  {t('createListing.notaryProtectionTitle')}
                </Text>
              </View>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, lineHeight: 16 }}>
                {t('createListing.notaryProtectionDesc')}
              </Text>
            </Card>
          </View>
        )}

        {/* Action Button */}
        <PillButton
          variant="primary"
          onPress={handleNext}
          loading={createMutation.isPending}
          disabled={createMutation.isPending}
          fullWidth
        >
          {step === 3 ? t('createListing.publishButton') : t('createListing.continueButton')}
        </PillButton>
      </View>
    </Screen>
  );
}
