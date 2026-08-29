import { useState } from 'react';
import { View, Text, Pressable, TextInput, Image, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Camera,
  MapPin,
  CheckCircle2,
  Trash2,
  Plus,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useSubmitMilestoneEvidenceMutation } from '../../api/contracts';
import { AIPhotoInspector } from '../../components/AIPhotoInspector';
import type { MainStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<MainStackParamList, 'MilestoneSubmit'>;

const DEMO_EVIDENCE_PREVIEWS = [
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=400&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=600&h=400&fit=crop&auto=format',
];

export function MilestoneSubmitScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const evidenceMutation = useSubmitMilestoneEvidenceMutation();

  const { projectId, milestoneId = 'm-1', milestoneTitle = 'Foundation & Earthworks' } = route.params;

  const [photos, setPhotos] = useState<string[]>(DEMO_EVIDENCE_PREVIEWS);
  const [notes, setNotes] = useState(
    'Foundation trench excavation completed to 1.5m depth, compacted gravel base laid, and concrete slab poured with reinforced steel rebar cage.'
  );
  const [geotagVerified, setGeotagVerified] = useState(true);

  const addPhoto = () => {
    // Adds a demo high-res site photo
    const samplePhotos = [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=600&h=400&fit=crop&auto=format',
    ];
    const newPhoto = samplePhotos[photos.length % samplePhotos.length];
    setPhotos((prev) => [...prev, newPhoto]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (photos.length === 0) {
      showToast({ title: 'Photos Required', description: 'Please attach at least one photo of the completed work.', tone: 'error' });
      return;
    }
    if (!notes.trim()) {
      showToast({ title: 'Notes Required', description: 'Please provide completion notes and observations.', tone: 'error' });
      return;
    }

    try {
      await evidenceMutation.mutateAsync({
        projectId,
        milestoneId,
        fileUrl: photos[0],
        notes: notes.trim(),
        geotag: geotagVerified ? { lat: 3.848, lng: 11.5021 } : undefined,
      });

      showToast({
        title: 'Evidence Submitted!',
        description: 'Funder and Field Verifier have been notified to inspect and release funds.',
        tone: 'success',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({
        title: 'Submission Error',
        description: err?.message || 'Could not submit evidence. Please try again.',
        tone: 'error',
      });
    }
  };

  return (
    <Screen header={<Header title="Submit Milestone Proof" subtitle={milestoneTitle} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Milestone Info */}
        <Card style={{ padding: 14, backgroundColor: colors.forest + '15', borderColor: colors.forest + '35', gap: 4 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
            Active Milestone Tranche
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
            {milestoneTitle}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
            Payout Value: <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest }}>{fmt(1800000)}</Text>
          </Text>
        </Card>

        {/* AI Photo Inspector */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={18} color={colors.forest} />
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
              AI Site Inspector
            </Text>
            <View style={{ paddingHorizontal: 7, paddingVertical: 2, backgroundColor: colors.forest + '18', borderRadius: 8 }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>
                Gemini AI
              </Text>
            </View>
          </View>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
            Upload a site photo for instant AI quality audit and fraud detection before submitting to the funder.
          </Text>
          <AIPhotoInspector
            label="Upload Milestone Site Photo for AI Inspection"
            onPhotoSelected={(base64) => { /* saved to upload queue */ }}
            onAnalysisComplete={(result) => {
              if (result.verdict === 'fail') {
                showToast({ title: 'AI Flagged Photo', description: result.summary, tone: 'error' });
              }
            }}
          />
        </View>

        {/* Photo Evidence Uploader */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Camera size={18} color={colors.forest} />
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
                Site Photos ({photos.length})
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

          {/* Photo Gallery Grid */}
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

        {/* GPS Geotag Verification Banner */}
        <Card style={{ padding: 14, backgroundColor: colors.surface, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} color={colors.forest} />
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
              On-Site GPS Geotag Match
            </Text>
          </View>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
            Coordinates (3.8480° N, 11.5021° E) match the registered site boundaries in Odza, Yaoundé.
          </Text>
        </Card>

        {/* Execution Notes & Deliverables Description */}
        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
            Completion Notes & Technical Specs
          </Text>
          <TextInput
            placeholder="Describe work completed, curing times, materials used, and readiness for inspection..."
            placeholderTextColor={colors.inkSubtle}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={5}
            style={{
              backgroundColor: colors.parchment,
              borderRadius: 14,
              padding: 14,
              fontFamily: FONT.sans,
              color: colors.ink,
              fontSize: 13,
              minHeight: 120,
              textAlignVertical: 'top',
            }}
          />
        </Card>

        {/* Escrow Release Information */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
          <ShieldCheck size={20} color={colors.forest} />
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, flex: 1, lineHeight: 17 }}>
            Upon submission, the funder and independent field verifiers review the proof to trigger immediate escrow release to your account.
          </Text>
        </View>

        {/* Submit Button */}
        <PillButton
          variant="primary"
          onPress={handleSubmit}
          loading={evidenceMutation.isPending}
          disabled={evidenceMutation.isPending}
          fullWidth
        >
          Submit Evidence for Escrow Release
        </PillButton>
      </View>
    </Screen>
  );
}
