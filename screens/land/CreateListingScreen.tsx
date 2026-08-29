import { useState } from 'react';
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
import { useCreateLandListingMutation } from '../../api/land';
import { AIDeedScanner } from '../../components/AIDeedScanner';
import type { MainStackParamList } from '../../navigation/types';

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
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const createMutation = useCreateLandListingMutation();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [region, setRegion] = useState('Sud');
  const [city, setCity] = useState('Kribi');
  const [neighborhood, setNeighborhood] = useState('Ngoye Plage');
  const [sizeSqm, setSizeSqm] = useState('1200');
  const [price, setPrice] = useState('18000000');
  const [titleNumber, setTitleNumber] = useState('TF #8812/Oce');
  const [description, setDescription] = useState(
    'Prime build-ready parcel located close to the coast with complete cadastral boundary markers and direct road access.'
  );
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'Direct Road Access',
    'Electricity Grid Connected',
    'Cadastral Marker Posts Placed',
  ]);

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
        showToast({ title: 'Missing Information', description: 'Please enter listing title and city.', tone: 'error' });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (numPrice <= 0 || numSize <= 0) {
        showToast({ title: 'Invalid Numbers', description: 'Please enter a valid price and surface area.', tone: 'error' });
        return;
      }
      if (!titleNumber.trim()) {
        showToast({ title: 'Title Deed Required', description: 'Please provide the Titre Foncier cadastral number.', tone: 'error' });
        return;
      }
      setStep(3);
    } else if (step === 3) {
      submitListing();
    }
  };

  const submitListing = async () => {
    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        region,
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        price: numPrice,
        sizeSqm: numSize,
        titleType: 'titre_foncier',
        titleNumber: titleNumber.trim(),
        description: description.trim(),
        features: selectedFeatures,
      });

      showToast({
        title: 'Listing Published!',
        description: 'Your verified land plot is now live on the marketplace.',
        tone: 'success',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({ title: 'Error', description: err?.message || 'Could not publish listing.', tone: 'error' });
    }
  };

  return (
    <Screen
      header={
        <Header
          title="List Land on Marketplace"
          back
          onBack={() => (step > 1 ? setStep((s) => (s - 1) as any) : navigation.goBack())}
        />
      }
    >
      <View style={{ padding: 16, gap: 18 }}>
        {/* Step Indicator */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {[
            { num: 1, label: 'Location' },
            { num: 2, label: 'Title & Price' },
            { num: 3, label: 'Features & Publish' },
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
                Step 1: Parcel Location
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                Enter the geographical location of the land plot
              </Text>
            </View>

            <Card style={{ padding: 16, gap: 14 }}>
              <TextField
                label="Listing Title"
                placeholder="e.g. 1,200 m² Sea View Plot in Kribi"
                value={title}
                onChangeText={setTitle}
              />

              <View style={{ gap: 6 }}>
                <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>Region</Text>
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
                label="City / Municipality"
                placeholder="e.g. Kribi, Yaoundé, Douala"
                value={city}
                onChangeText={setCity}
              />

              <TextField
                label="Quarter / Neighborhood"
                placeholder="e.g. Ngoye Plage, Odza"
                value={neighborhood}
                onChangeText={setNeighborhood}
              />
            </Card>
          </View>
        )}

        {/* Step 2: Dimensions, Titre Foncier & Asking Price */}
        {step === 2 && (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                Step 2: Cadastral Deed & Pricing
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                Specify cadastral title deed number and financial terms
              </Text>
            </View>

            <Card style={{ padding: 16, gap: 14 }}>
              {/* AI Deed Scanner */}
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <FileCheck size={16} color={colors.forest} />
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                    AI Title Deed Scanner
                  </Text>
                  <View style={{ paddingHorizontal: 7, paddingVertical: 2, backgroundColor: colors.forest + '18', borderRadius: 8 }}>
                    <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>Gemini AI</Text>
                  </View>
                </View>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
                  Upload your Titre Foncier — AI will extract the title number, plot area, beacons, and check authenticity.
                </Text>
                <AIDeedScanner
                  onScanComplete={(result) => {
                    if (result.titleNumber) setTitleNumber(result.titleNumber);
                    if (result.plotAreaSqm) setSizeSqm(String(Math.round(result.plotAreaSqm)));
                    if (result.authenticityScore < 50) {
                      showToast({ title: 'Low Authenticity Score', description: 'The AI flagged this deed. Please verify it manually.', tone: 'error' });
                    }
                  }}
                />
              </View>

              <TextField
                label="Titre Foncier (Cadastral Title Number)"
                placeholder="e.g. TF #8812/Oce — auto-filled by AI scanner"
                value={titleNumber}
                onChangeText={setTitleNumber}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Surface Area (m²)"
                    placeholder="1200"
                    value={sizeSqm}
                    onChangeText={(v) => setSizeSqm(v.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Total Asking Price (XAF)"
                    placeholder="18000000"
                    value={price}
                    onChangeText={(v) => setPrice(v.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
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
                  Calculated Price per m²:
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
                Step 3: Parcel Features & Specs
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                Select land amenities and enter description
              </Text>
            </View>

            <Card style={{ padding: 16, gap: 12 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                Parcel Features
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
                label="Description & Topography"
                placeholder="Access details, neighborhood development, terrain characteristics..."
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
                  Notary Escrow Protection Guaranteed
                </Text>
              </View>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, lineHeight: 16 }}>
                Buyer purchase payments will be locked in escrow and released directly to your account upon verified notary deed registration.
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
          {step === 3 ? 'Publish Land Listing' : 'Continue to Next Step'}
        </PillButton>
      </View>
    </Screen>
  );
}
