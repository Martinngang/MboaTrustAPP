import { useState } from 'react';
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
import type { MainStackParamList } from '../../navigation/types';

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
  const { name, avatarUrl } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { data: profile, isLoading } = useMyVerifierProfileQuery();
  const upsertMutation = useUpsertVerifierProfileMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [bio, setBio] = useState(profile?.bio || 'Sworn Civil Engineer & Land Surveyor registered with ONGC Cameroon.');
  const [selectedRegions, setSelectedRegions] = useState<string[]>(profile?.regions || ['Centre', 'Littoral', 'Sud']);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    profile?.specialties || ['Civil Engineering', 'Reinforced Concrete', 'Cadastral Surveying']
  );

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

      showToast({ title: 'Profile Updated!', description: 'Your verifier credentials have been saved.', tone: 'success' });
      setModalOpen(false);
    } catch (err: any) {
      showToast({ title: 'Error', description: err?.message || 'Could not update profile.', tone: 'error' });
    }
  };

  return (
    <Screen
      header={
        <Header
          title="Verifier Credentials"
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
                Edit
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
            <Avatar name={profile?.fullName || name || 'Dr. Christian Nguema'} avatarUrl={avatarUrl} size={54} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                {profile?.fullName || 'Dr. Christian Nguema'}
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                Ordre National du Génie Civil (ONGC)
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Star size={13} color="#FFD700" fill="#FFD700" />
                  <Text style={{ fontFamily: FONT.mono, color: colors.ink, fontSize: 12, fontWeight: '700' }}>
                    {profile?.rating || 4.9}
                  </Text>
                </View>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                  · {profile?.completedTasksCount || 18} audits completed
                </Text>
              </View>
            </View>
          </View>

          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, lineHeight: 18 }}>
            {profile?.bio || 'Sworn Civil Engineer & Land Surveyor registered with ONGC Cameroon.'}
          </Text>
        </Card>

        {/* Engineering Specialties */}
        <Card style={{ padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Award size={16} color={colors.forest} />
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15 }}>
              Auditing Specialties
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
              Covered Inspection Regions
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
                  {reg} Region
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
              Sworn MboaTrust Verifier Status
            </Text>
          </View>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
            Your signed field inspection reports are legally recognized and directly unlock escrow disbursements to contractors and material suppliers.
          </Text>
        </Card>
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>Edit Verifier Credentials</Text>
              <Pressable onPress={() => setModalOpen(false)} hitSlop={6}>
                <X size={20} color={colors.inkMuted} />
              </Pressable>
            </View>

            <TextField
              label="Bio & Engineering Experience"
              placeholder="e.g. Master of Civil Engineering with 12 years field experience..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />

            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>Covered Regions</Text>
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
              Save Credentials
            </PillButton>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
