import { useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import {
  Briefcase,
  Droplet,
  GraduationCap,
  HeartPulse,
  Building2,
  Sprout,
  Home as HomeIcon,
  ShieldCheck,
  MapPin,
  Check,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useCreateJobMutation } from '../../api/tenders';
import {
  MilestoneScheduleEditor,
  makeDefaultSchedule,
  scheduleTotal,
  scheduleRowsValid,
  type DraftScheduleMilestone,
} from '../../components/MilestoneScheduleEditor';
import { PROJECT_CATEGORIES } from '../../inventoryTaxonomy';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

// Unified onto the same sector taxonomy used everywhere else a tender's
// category is posted, filtered, or matched against — this used to be a
// separate trade-skill list ('Masonry & Concrete', 'Electrical & Solar'...)
// that never matched web's sector categories ('Water & Sanitation',
// 'Education'...), so a mobile-posted tender's category meant nothing to
// web's browse/filter chips or to contractorMatchingService's scoring.
const TRADE_ICON: Record<string, typeof Droplet> = {
  'Water & Sanitation': Droplet,
  Education: GraduationCap,
  Healthcare: HeartPulse,
  Infrastructure: Building2,
  Agriculture: Sprout,
  Housing: HomeIcon,
};
const TRADE_SPECIALTIES = PROJECT_CATEGORIES.map((name) => ({ id: name, name, icon: TRADE_ICON[name] ?? Building2 }));

export function PostJobScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const tenderMutation = useCreateJobMutation();

  const [title, setTitle] = useState('');
  const [trade, setTrade] = useState(TRADE_SPECIALTIES[0].name);
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [budget, setBudget] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [weekly, setWeekly] = useState(false);
  const [milestones, setMilestones] = useState<DraftScheduleMilestone[]>(makeDefaultSchedule(3));
  const locationRef = useRef<TextInput>(null);
  const budgetRef = useRef<TextInput>(null);
  const durationRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  const numBudget = Number(budget) || 0;
  const scheduleOk = scheduleRowsValid(milestones) && scheduleTotal(milestones) === numBudget;

  // Web attaches real coordinates via a Cameroon region/town picker backed
  // by a geo-data package; the phone's own GPS is the more direct
  // mobile-appropriate way to get the same real coordinate onto the tender
  // (same pattern MilestoneSubmitScreen already uses for evidence geotags).
  // Previously this field simply never existed on mobile — every
  // mobile-posted tender had no location marker anywhere it was later shown.
  const useCurrentLocation = async () => {
    setLocatingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast({ title: t('postJob.locationPermissionRequired'), description: t('postJob.locationPermissionDesc'), tone: 'error' });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      showToast({ title: t('postJob.locationFailed'), description: t('postJob.locationFailedDesc'), tone: 'error' });
    } finally {
      setLocatingGps(false);
    }
  };

  const handleSubmitTender = async () => {
    if (!title.trim() || !description.trim()) {
      showToast({ title: t('postJob.missingInformation'), description: t('postJob.missingInfoDesc'), tone: 'error' });
      return;
    }
    if (numBudget <= 0) {
      showToast({ title: t('postJob.invalidBudget'), description: t('postJob.invalidBudgetDesc'), tone: 'error' });
      return;
    }
    if (!scheduleOk) {
      showToast({ title: t('postJob.scheduleInvalid'), description: t('postJob.scheduleInvalidDesc'), tone: 'error' });
      return;
    }

    const days = Number(durationDays) || 30;
    const deadline = new Date(Date.now() + days * 86_400_000).toISOString();

    try {
      await tenderMutation.mutateAsync({
        title: title.trim(),
        category: trade,
        description: description.trim(),
        location: locationName.trim(),
        coordinates,
        budget: numBudget,
        deadline,
        milestoneCount: milestones.length,
        milestoneSchedule: milestones.map((m) => ({ title: m.title, amount: Number(m.amount) || 0, description: m.description })),
      });

      showToast({
        title: t('postJob.tenderPublished'),
        description: t('postJob.contractorsCanBid'),
        tone: 'success',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({
        title: t('postJob.publicationFailed'),
        description: err?.message || t('postJob.couldNotPublish'),
        tone: 'error',
      });
    }
  };

  return (
    <Screen header={<Header title={t('postJob.title')} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Info Banner */}
        <Card style={{ padding: 14, backgroundColor: colors.steel + '15', borderColor: colors.steel + '40', gap: 6 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.steel, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
            {t('postJob.escrowProtectedTitle')}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12, lineHeight: 17 }}>
            {t('postJob.escrowProtectedDesc')}
          </Text>
        </Card>

        {/* Trade Specialty */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
            {t('postJob.tradeSpecialtyRequired')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {TRADE_SPECIALTIES.map((t) => {
              const active = trade === t.name;
              const Icon = t.icon;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTrade(t.name)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 12,
                    backgroundColor: active ? colors.steel : colors.parchment,
                  }}
                >
                  <Icon size={16} color={active ? '#fff' : colors.ink} />
                  <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? '#fff' : colors.ink }}>
                    {t.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Card>

        {/* Tender Form */}
        <Card style={{ padding: 16, gap: 14 }}>
          <TextField
            label={t('postJob.tenderTitleLabel')}
            placeholder="e.g. Multi-Storey Building Reinforced Masonry"
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => locationRef.current?.focus()}
          />

          <TextField
            ref={locationRef}
            label={t('postJob.siteLocationLabel')}
            placeholder="e.g. Odza, Yaoundé (Centre)"
            value={locationName}
            onChangeText={setLocationName}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => budgetRef.current?.focus()}
          />
          <Pressable
            onPress={useCurrentLocation}
            disabled={locatingGps}
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: -6 }}
          >
            {coordinates ? <Check size={13} color={colors.forest} /> : <MapPin size={13} color={colors.steel} />}
            <Text style={{ fontFamily: FONT.sansSemiBold, color: coordinates ? colors.forest : colors.steel, fontSize: 12 }}>
              {locatingGps ? t('postJob.locating') : coordinates ? t('postJob.locationAttached') : t('postJob.useCurrentLocation')}
            </Text>
          </Pressable>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <TextField
                ref={budgetRef}
                label={t('postJob.targetBudgetLabel')}
                placeholder="4500000"
                value={budget}
                onChangeText={(v) => setBudget(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => durationRef.current?.focus()}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                ref={durationRef}
                label={t('postJob.durationLabel')}
                placeholder="30"
                value={durationDays}
                onChangeText={(v) => setDurationDays(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => descriptionRef.current?.focus()}
              />
            </View>
          </View>

          <TextField
            ref={descriptionRef}
            label={t('postJob.scopeOfWorkLabel')}
            placeholder={t('postJob.scopeOfWorkPlaceholder')}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </Card>

        {/* Payment Schedule */}
        <Card style={{ padding: 16 }}>
          <MilestoneScheduleEditor
            milestones={milestones}
            onChange={setMilestones}
            budget={numBudget}
            weekly={weekly}
            onWeeklyChange={setWeekly}
          />
        </Card>

        {/* Submit Button */}
        <PillButton
          variant="primary"
          onPress={handleSubmitTender}
          loading={tenderMutation.isPending}
          disabled={tenderMutation.isPending || !scheduleOk}
          fullWidth
        >
          {t('postJob.publishButton')}
        </PillButton>
      </View>
    </Screen>
  );
}
