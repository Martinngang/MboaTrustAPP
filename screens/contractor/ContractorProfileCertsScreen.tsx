import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ShieldCheck,
  Award,
  Star,
  Plus,
  X,
  FileCheck,
  CheckCircle2,
  Briefcase,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { Avatar } from '../../components/Avatar';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { useCertificationsQuery, useAddCertificationMutation } from '../../api/contracts';
import type { MainStackParamList } from '../../navigation/types';

export function ContractorProfileCertsScreen() {
  const { colors } = useTheme();
  const { name, avatarUrl } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { data: certs, isLoading } = useCertificationsQuery();
  const addCertMutation = useAddCertificationMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [authority, setAuthority] = useState('');
  const [year, setYear] = useState('2024');

  const handleAddCert = async () => {
    if (!title.trim() || !authority.trim()) {
      showToast({ title: 'Missing Details', description: 'Please provide certificate title and issuing body.', tone: 'error' });
      return;
    }

    try {
      await addCertMutation.mutateAsync({
        title: title.trim(),
        issuingAuthority: authority.trim(),
        yearIssued: year.trim(),
      });

      showToast({ title: 'Certification Added!', description: 'Your credentials have been updated.', tone: 'success' });
      setModalOpen(false);
      setTitle('');
      setAuthority('');
    } catch (err: any) {
      showToast({ title: 'Addition Error', description: err?.message || 'Could not add certification.', tone: 'error' });
    }
  };

  return (
    <Screen header={<Header title="Contractor Portfolio" back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Contractor Profile Card */}
        <Card style={{ padding: 18, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar name={name || 'Jean-Paul Kamga'} avatarUrl={avatarUrl} size={54} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                {name || 'Jean-Paul Kamga'}
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                ETS Kamga BTP SARL · Yaoundé
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Star size={13} color={colors.amber} fill={colors.amber} />
                  <Text style={{ fontFamily: FONT.mono, color: colors.ink, fontSize: 12, fontWeight: '700' }}>
                    4.9
                  </Text>
                </View>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                  · 14 verified contracts completed
                </Text>
              </View>
            </View>
          </View>

          {/* Trade Specialties Chips */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {['Civil Engineering', 'Structural Masonry', 'Foundation Reinforcement', 'Surveying'].map((t) => (
              <View
                key={t}
                style={{
                  backgroundColor: colors.steel + '15',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontFamily: FONT.mono, color: colors.steel, fontSize: 10, fontWeight: '700' }}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Certifications Header & List */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Award size={18} color={colors.forest} />
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
                Licenses & Certifications
              </Text>
            </View>

            <Pressable
              onPress={() => setModalOpen(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: colors.forest,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
              }}
            >
              <Plus size={14} color="#fff" />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>Add</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.forest} style={{ marginTop: 20 }} />
          ) : (
            (certs || []).map((c) => (
              <Card key={c.id} style={{ padding: 14, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                      {c.title}
                    </Text>
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                      {c.issuingAuthority} · Issued {c.yearIssued}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: colors.forest + '15',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                    }}
                  >
                    <ShieldCheck size={12} color={colors.forest} />
                    <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, fontWeight: '700' }}>
                      Verified
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      </View>

      {/* Add Certification Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>Add Professional Certification</Text>
              <Pressable onPress={() => setModalOpen(false)} hitSlop={6}>
                <X size={20} color={colors.inkMuted} />
              </Pressable>
            </View>

            <TextField
              label="Certificate or License Title"
              placeholder="e.g. Master Mason Structural Certification"
              value={title}
              onChangeText={setTitle}
            />

            <TextField
              label="Issuing Ministry or Professional Order"
              placeholder="e.g. Ministry of Public Works / ONGC"
              value={authority}
              onChangeText={setAuthority}
            />

            <TextField
              label="Year Issued"
              placeholder="2024"
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
            />

            <PillButton variant="primary" onPress={handleAddCert} loading={addCertMutation.isPending} fullWidth>
              Save & Verify Certification
            </PillButton>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
