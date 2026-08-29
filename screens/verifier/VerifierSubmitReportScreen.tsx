import { useState } from 'react';
import { View, Text, Pressable, TextInput, Image, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Camera,
  Trash2,
  Plus,
  FileCheck,
  Check,
  AlertTriangle,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useSubmitVerificationReportMutation } from '../../api/verifier';
import type { MainStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<MainStackParamList, 'VerifierSubmitReport'>;

const DEMO_INSPECTION_PHOTOS = [
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&h=400&fit=crop',
];

export function VerifierSubmitReportScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const submitMutation = useSubmitVerificationReportMutation();

  const { taskId, projectTitle = 'Building Project', milestoneTitle = 'Milestone Verification' } = route.params;

  const [verdict, setVerdict] = useState<'pass' | 'fail'>('pass');
  const [reportText, setReportText] = useState(
    'On-site inspection completed. Measured trench depth at 1.55m. Steel rebar cage assembled with 12mm bars spaced 20cm on center. Concrete pour is structurally sound and ready for milestone release.'
  );
  const [photos, setPhotos] = useState<string[]>(DEMO_INSPECTION_PHOTOS);
  const [swornPledged, setSwornPledged] = useState(true);

  const addPhoto = () => {
    const sample = 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=600&h=400&fit=crop';
    setPhotos((prev) => [...prev, sample]);
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!reportText.trim()) {
      showToast({ title: 'Report Notes Required', description: 'Please enter detailed technical observations.', tone: 'error' });
      return;
    }
    if (photos.length === 0) {
      showToast({ title: 'Photos Required', description: 'Please attach at least one on-site inspection photo.', tone: 'error' });
      return;
    }
    if (!swornPledged) {
      showToast({ title: 'Pledge Required', description: 'You must confirm the sworn verifier statement.', tone: 'error' });
      return;
    }

    try {
      await submitMutation.mutateAsync({
        taskId,
        reportText: reportText.trim(),
        reportPhotos: photos,
        confirmedMatch: verdict === 'pass',
      });

      showToast({
        title: 'Report Submitted!',
        description: verdict === 'pass' ? 'Verification approved. Escrow release unlocked.' : 'Defects flagged. Escrow holds active.',
        tone: 'success',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({ title: 'Submission Error', description: err?.message || 'Could not submit report.', tone: 'error' });
    }
  };

  return (
    <Screen header={<Header title="Submit Audit Report" subtitle={projectTitle} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Target Info */}
        <Card style={{ padding: 14, backgroundColor: colors.forest + '15', borderColor: colors.forest + '35', gap: 4 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
            Target Inspection
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
            {projectTitle}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
            Tranche: {milestoneTitle}
          </Text>
        </Card>

        {/* Verdict Decision Cards */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
            Select Inspection Verdict
          </Text>

          {/* PASS */}
          <Pressable
            onPress={() => setVerdict('pass')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 14,
              borderWidth: 2,
              borderColor: verdict === 'pass' ? colors.forest : colors.parchmentDark,
              backgroundColor: verdict === 'pass' ? colors.forest + '12' : colors.surface,
            }}
          >
            <CheckCircle2 size={24} color={verdict === 'pass' ? colors.forest : colors.inkSubtle} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15 }}>
                CONFIRMED MATCH (Approved)
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                Work meets all engineering specifications. Ready for escrow disbursement.
              </Text>
            </View>
            {verdict === 'pass' && (
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
                <Check size={12} color="#fff" strokeWidth={3} />
              </View>
            )}
          </Pressable>

          {/* FAIL / DISCREPANCY */}
          <Pressable
            onPress={() => setVerdict('fail')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 14,
              borderWidth: 2,
              borderColor: verdict === 'fail' ? colors.seal : colors.parchmentDark,
              backgroundColor: verdict === 'fail' ? colors.seal + '12' : colors.surface,
            }}
          >
            <XCircle size={24} color={verdict === 'fail' ? colors.seal : colors.inkSubtle} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15 }}>
                DISCREPANCY / DEFECT (Flagged)
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                Discovered defects, missing markers, or sub-standard execution. Escrow frozen.
              </Text>
            </View>
            {verdict === 'fail' && (
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.seal, alignItems: 'center', justifyContent: 'center' }}>
                <Check size={12} color="#fff" strokeWidth={3} />
              </View>
            )}
          </Pressable>
        </View>

        {/* On-Site Verification Photos */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Camera size={18} color={colors.forest} />
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
                Inspector Site Photos ({photos.length})
              </Text>
            </View>

            <Pressable
              onPress={addPhoto}
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
              <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>Add Photo</Text>
            </Pressable>
          </View>

          <View style={{ gap: 12 }}>
            {photos.map((uri, idx) => (
              <Card key={idx} style={{ overflow: 'hidden' }}>
                <View style={{ height: 160, backgroundColor: colors.parchment, position: 'relative' }}>
                  <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <Pressable
                    onPress={() => removePhoto(idx)}
                    hitSlop={6}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(0,0,0,0.65)',
                      borderRadius: 16,
                      width: 32,
                      height: 32,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={16} color="#fff" />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Technical Observations Report */}
        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
            Technical Observations & Measurements
          </Text>
          <TextInput
            placeholder="Document depth measurements, concrete consistency, cadastral beacon coordinates..."
            placeholderTextColor={colors.inkSubtle}
            value={reportText}
            onChangeText={setReportText}
            multiline
            numberOfLines={5}
            style={{
              backgroundColor: colors.parchment,
              borderRadius: 12,
              padding: 12,
              fontFamily: FONT.sans,
              color: colors.ink,
              fontSize: 13,
              minHeight: 110,
              textAlignVertical: 'top',
            }}
          />
        </Card>

        {/* Sworn Verifier Pledge */}
        <Pressable
          onPress={() => setSwornPledged(!swornPledged)}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 10,
            padding: 14,
            borderRadius: 14,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.parchmentDark,
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              borderWidth: 1.5,
              borderColor: swornPledged ? colors.forest : colors.inkSubtle,
              backgroundColor: swornPledged ? colors.forest : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
            }}
          >
            {swornPledged && <Check size={13} color="#fff" strokeWidth={3} />}
          </View>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, flex: 1, lineHeight: 17 }}>
            I certify under professional engineering ethics (ONGC) that I personally verified these site conditions and measurements.
          </Text>
        </Pressable>

        {/* Submit Report Button */}
        <PillButton
          variant="primary"
          onPress={handleSubmit}
          loading={submitMutation.isPending}
          disabled={submitMutation.isPending}
          fullWidth
        >
          {verdict === 'pass' ? 'Sign & Submit Approval Report' : 'Sign & Submit Discrepancy Flag'}
        </PillButton>
      </View>
    </Screen>
  );
}
