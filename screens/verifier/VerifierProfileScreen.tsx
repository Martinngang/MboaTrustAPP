import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ShieldCheck,
  Award,
  Star,
  MapPin,
  CheckCircle2,
  FileCheck,
  Edit3,
  X,
  Briefcase,
  UserCheck,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { Avatar } from '../../components/Avatar';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { useMyVerifierProfileQuery, useUpsertVerifierProfileMutation } from '../../api/verifier';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

const CAMEROON_REGIONS = ['Centre', 'Littoral', 'Sud', 'Ouest', 'Sud-Ouest', 'Nord-Ouest'];
const SPECIALTIES = [
  'Civil Engineering',
  'Reinforced Concrete',
  'Cadastral Surveying',
  'Structural Audits',
  'Hydraulics & Plumbing',
];

export function VerifierProfileScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { name, avatarUrl } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { data: profile, isLoading } = useMyVerifierProfileQuery();
  const upsertMutation = useUpsertVerifierProfileMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [bio, setBio] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  // The form's initial useState value only ever runs once, before the
  // async profile query has resolved — this used to mean editing always
  // started from a hardcoded fake bio/regions/specialties, silently
  // overwriting the real saved ones if the user didn't notice and fix
  // them. Resyncing whenever the edit modal actually opens fixes that.
  useEffect(() => {
    if (modalOpen && profile) {
      setBio(profile.bio);
      setSelectedRegions(profile.regions);
      setSelectedSpecialties(profile.specialties);
    }
  }, [modalOpen, profile]);

  const toggleRegion = (r: string) => {
    setSelectedRegions((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  const toggleSpecialty = (s: string) => {
    setSelectedSpecialties((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleUpdate = async () => {
    try {
      await upsertMutation.mutateAsync({
        bio: bio.trim(),
        regions: selectedRegions,
        specialties: selectedSpecialties,
      });

      showToast({ title: t('verifierProfile.profileUpdated'), description: t('verifierProfile.credentialsSaved'), tone: 'success' });
      setModalOpen(false);
    } catch (err) {
      showToast({ title: t('verifierProfile.error'), description: apiErrorMessage(err, t('verifierProfile.couldNotUpdate')), tone: 'error' });
    }
  };

  return (
    <Screen
      header={
        <Header
          title={t('verifierProfile.title')}
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
                backgroundColor: colors.forest + '20',
              }}
            >
              <Edit3 size={14} color={colors.forest} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
                {t('verifierProfile.edit')}
              </Text>
            </Pressable>
          }
        />
      }
    >
      <View style={{ padding: 16, gap: 18 }}>
        {/* Verifier Hero Card */}
        <Card style={{ padding: 18, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar name={profile?.fullName || name || t('verifierProfile.verifierFallback')} avatarUrl={avatarUrl} size={54} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                {profile?.fullName || name || t('verifierProfile.verifierFallback')}
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                {profile?.applicationStatus === 'approved' ? t('verifierProfile.approvedFieldVerifier') : `${t('verifierProfile.applicationStatusPrefix')} ${profile?.applicationStatus ?? t('verifierProfile.pendingFallback')}`}
              </Text>
            </View>
          </View>

          {profile?.bio ? (
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, lineHeight: 18 }}>
              {profile.bio}
            </Text>
          ) : null}
        </Card>

        {/* Engineering Specialties */}
        <Card style={{ padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Award size={16} color={colors.forest} />
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15 }}>
              {t('verifierProfile.auditingSpecialties')}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {(profile?.specialties || selectedSpecialties).map((spec) => (
              <View
                key={spec}
                style={{
                  backgroundColor: colors.forest + '15',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
                  {spec}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Covered Regions in Cameroon */}
        <Card style={{ padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MapPin size={16} color={colors.seal} />
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15 }}>
              {t('verifierProfile.coveredRegions')}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {(profile?.regions || selectedRegions).map((reg) => (
              <View
                key={reg}
                style={{
                  backgroundColor: colors.seal + '15',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>
                  {reg} {t('verifierProfile.regionSuffix')}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Verification Authority Badge */}
        <Card style={{ padding: 16, backgroundColor: colors.forest + '12', borderColor: colors.forest + '30', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={22} color={colors.forest} />
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
              {t('verifierProfile.swornStatusTitle')}
            </Text>
          </View>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
            {t('verifierProfile.swornStatusDesc')}
          </Text>
        </Card>
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>{t('verifierProfile.editModalTitle')}</Text>
              <Pressable onPress={() => setModalOpen(false)} hitSlop={6}>
                <X size={20} color={colors.inkMuted} />
              </Pressable>
            </View>

            <TextField
              label={t('verifierProfile.bioLabel')}
              placeholder={t('verifierProfile.bioPlaceholder')}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />

            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>{t('verifierProfile.coveredRegionsLabel')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {CAMEROON_REGIONS.map((r) => {
                  const active = selectedRegions.includes(r);
                  return (
                    <Pressable
                      key={r}
                      onPress={() => toggleRegion(r)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: active ? colors.forest : colors.parchment,
                      }}
                    >
                      <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? '#fff' : colors.ink }}>
                        {r}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <PillButton variant="primary" onPress={handleUpdate} loading={upsertMutation.isPending} fullWidth>
              {t('verifierProfile.saveCredentials')}
            </PillButton>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
