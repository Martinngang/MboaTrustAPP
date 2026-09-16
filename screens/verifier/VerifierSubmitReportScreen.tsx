import { useState } from 'react';
import { View, Text, Pressable, TextInput, Image, ScrollView, ActivityIndicator } from 'react-native';
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
  WifiOff,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useSubmitVerificationReportMutation } from '../../api/verifier';
import { uploadChatAttachment } from '../../api/messagingUpload';
import { apiErrorMessage } from '../../api/client';
import { useOfflineQueue } from '../../context/OfflineQueueContext';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'VerifierSubmitReport'>;

// This is a sworn report that directly gates a real escrow disbursement —
// `confirmedMatch` is what the backend uses to decide whether funds
// release or freeze. The previous version pre-filled a specific, plausible
// technical observation ("Measured trench depth at 1.55m...") and 2 fake
// stock photos as the STARTING state, and "Add Photo" appended the same
// third stock photo every time rather than opening a picker — a verifier
// could sign and submit a fully fabricated "on-site" report, with photos,
// having never visited anything, just by not touching the form. Every
// field now starts empty and photos are real uploads.
export function VerifierSubmitReportScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const submitMutation = useSubmitVerificationReportMutation();
  const { isOnline, enqueueVerifierReport } = useOfflineQueue();

  const { taskId, projectTitle = t('verifierSubmitReport.buildingProjectFallback'), milestoneTitle = t('verifierSubmitReport.milestoneVerificationFallback') } = route.params;

  const [verdict, setVerdict] = useState<'pass' | 'fail'>('pass');
  const [reportText, setReportText] = useState('');
  // `remote: false` photos were picked while offline — they're still local
  // files, uploaded lazily at sync time (see OfflineQueueContext.syncNow)
  // instead of here, since the upload itself needs network.
  const [photos, setPhotos] = useState<{ uri: string; remote: boolean }[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [swornPledged, setSwornPledged] = useState(false);
  const [queuedForSync, setQueuedForSync] = useState(false);

  const addPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast({ title: t('verifierSubmitReport.permissionRequired'), description: t('verifierSubmitReport.cameraRollAccess'), tone: 'error' });
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (picked.canceled || !picked.assets?.[0]) return;

    const asset = picked.assets[0];
    if (!isOnline) {
      setPhotos((prev) => [...prev, { uri: asset.uri, remote: false }]);
      return;
    }
    setUploadingPhoto(true);
    try {
      const uploaded = await uploadChatAttachment({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType });
      setPhotos((prev) => [...prev, { uri: uploaded.url, remote: true }]);
    } catch (err) {
      showToast({ title: t('verifierSubmitReport.uploadFailed'), description: apiErrorMessage(err, t('verifierSubmitReport.couldNotUploadPhoto')), tone: 'error' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!reportText.trim()) {
      showToast({ title: t('verifierSubmitReport.reportNotesRequired'), description: t('verifierSubmitReport.enterObservations'), tone: 'error' });
      return;
    }
    if (photos.length === 0) {
      showToast({ title: t('verifierSubmitReport.photosRequired'), description: t('verifierSubmitReport.attachOnePhoto'), tone: 'error' });
      return;
    }
    if (!swornPledged) {
      showToast({ title: t('verifierSubmitReport.pledgeRequired'), description: t('verifierSubmitReport.confirmSwornStatement'), tone: 'error' });
      return;
    }

    if (!isOnline) {
      await enqueueVerifierReport({
        kind: 'verifier_report',
        taskId,
        projectTitle,
        milestoneTitle,
        reportText: reportText.trim(),
        confirmedMatch: verdict === 'pass',
        photos,
      });
      setQueuedForSync(true);
      showToast({
        title: t('verifierSubmitReport.savedForSync'),
        description: t('verifierSubmitReport.offlineSavedDesc'),
        tone: 'success',
      });
      return;
    }

    try {
      await submitMutation.mutateAsync({
        taskId,
        reportText: reportText.trim(),
        reportPhotos: photos.map((p) => p.uri),
        confirmedMatch: verdict === 'pass',
      });

      showToast({
        title: t('verifierSubmitReport.reportSubmitted'),
        description: verdict === 'pass' ? t('verifierSubmitReport.approvedUnlocked') : t('verifierSubmitReport.flaggedHoldsActive'),
        tone: 'success',
      });
      navigation.goBack();
    } catch (err) {
      showToast({ title: t('verifierSubmitReport.submissionError'), description: apiErrorMessage(err, t('verifierSubmitReport.couldNotSubmit')), tone: 'error' });
    }
  };

  return (
    <Screen header={<Header title={t('verifierSubmitReport.title')} subtitle={projectTitle} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Target Info */}
        <Card style={{ padding: 14, backgroundColor: colors.forest + '15', borderColor: colors.forest + '35', gap: 4 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
            {t('verifierSubmitReport.targetInspection')}
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
            {projectTitle}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
            {t('verifierSubmitReport.tranche')} {milestoneTitle}
          </Text>
        </Card>

        {/* Verdict Decision Cards */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
            {t('verifierSubmitReport.selectVerdict')}
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
                {t('verifierSubmitReport.confirmedMatchTitle')}
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                {t('verifierSubmitReport.confirmedMatchDesc')}
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
                {t('verifierSubmitReport.discrepancyTitle')}
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                {t('verifierSubmitReport.discrepancyDesc')}
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
                {t('verifierSubmitReport.sitePhotos')} ({photos.length})
              </Text>
            </View>

            <Pressable
              onPress={addPhoto}
              disabled={uploadingPhoto}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: colors.forest,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
                opacity: uploadingPhoto ? 0.7 : 1,
              }}
            >
              {uploadingPhoto ? <ActivityIndicator size="small" color="#fff" /> : <Plus size={14} color="#fff" />}
              <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>{uploadingPhoto ? t('verifierSubmitReport.uploading') : t('verifierSubmitReport.addPhoto')}</Text>
            </Pressable>
          </View>

          <View style={{ gap: 12 }}>
            {photos.map((photo, idx) => (
              <Card key={idx} style={{ overflow: 'hidden' }}>
                <View style={{ height: 160, backgroundColor: colors.parchment, position: 'relative' }}>
                  <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  {!photo.remote && (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        borderRadius: 10,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <WifiOff size={11} color="#fff" />
                      <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 9, textTransform: 'uppercase' }}>{t('verifierSubmitReport.pendingUpload')}</Text>
                    </View>
                  )}
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
            {t('verifierSubmitReport.technicalObservations')}
          </Text>
          <TextInput
            placeholder={t('verifierSubmitReport.observationsPlaceholder')}
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
            {t('verifierSubmitReport.swornPledgeText')}
          </Text>
        </Pressable>

        {queuedForSync ? (
          <Card style={{ padding: 16, gap: 10, backgroundColor: colors.amber + '15', borderColor: colors.amber + '40' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <WifiOff size={18} color={colors.amber} />
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15 }}>{t('verifierSubmitReport.savedOnDevice')}</Text>
            </View>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
              {t('verifierSubmitReport.queuedDesc')}
            </Text>
            <PillButton variant="primary" onPress={() => navigation.goBack()} fullWidth>
              {t('verifierSubmitReport.backToTasks')}
            </PillButton>
          </Card>
        ) : (
          <>
            {!isOnline && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: colors.amber + '15' }}>
                <WifiOff size={16} color={colors.amber} />
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, flex: 1, lineHeight: 15 }}>
                  {t('verifierSubmitReport.offlineWillUpload')}
                </Text>
              </View>
            )}

            {/* Submit Report Button */}
            <PillButton
              variant="primary"
              onPress={handleSubmit}
              loading={submitMutation.isPending}
              disabled={submitMutation.isPending}
              fullWidth
            >
              {isOnline
                ? verdict === 'pass'
                  ? t('verifierSubmitReport.signAndSubmitApproval')
                  : t('verifierSubmitReport.signAndSubmitFlag')
                : t('verifierSubmitReport.saveForSync')}
            </PillButton>
          </>
        )}
      </View>
    </Screen>
  );
}
