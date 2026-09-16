import { useEffect, useState } from 'react';
import { View, Text, TextInput, Image, Pressable, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera, ShieldCheck, WifiOff, MapPin, Plus, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useProjectQuery } from '../../api/projects';
import { useSubmitMilestoneEvidenceMutation } from '../../api/contracts';
import { useReverseGeocodeQuery } from '../../api/tools';
import { apiErrorMessage } from '../../api/client';
import { AIPhotoInspector } from '../../components/AIPhotoInspector';
import { useOfflineQueue, type QueuedMilestoneEvidence } from '../../context/OfflineQueueContext';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'MilestoneSubmit'>;

const MIN_PHOTOS = 2;

interface Photo {
  uri: string;
  mimeType: string;
}

export function MilestoneSubmitScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const evidenceMutation = useSubmitMilestoneEvidenceMutation();
  const { isOnline, queue, enqueueMilestoneEvidence, syncNow, isSyncing } = useOfflineQueue();

  const { projectId, milestoneId: routeMilestoneId } = route.params;
  const { data: project, isLoading } = useProjectQuery(projectId);

  const targetMilestone = project
    ? project.milestones.find((m) => (routeMilestoneId ? m.id === routeMilestoneId : m.status === 'pending')) ||
      project.milestones[0]
    : undefined;

  // The AI inspector owns the first ("primary") photo slot; anything past it
  // is a plain repeatable pick, mirroring VerifierSubmitReportScreen's
  // add/remove pattern. Both feed the same evidence submission.
  const [primaryPhoto, setPrimaryPhoto] = useState<Photo | null>(null);
  const [extraPhotos, setExtraPhotos] = useState<Photo[]>([]);
  const photos: Photo[] = primaryPhoto ? [primaryPhoto, ...extraPhotos] : extraPhotos;

  const [notes, setNotes] = useState('');
  const [queuedForSync, setQueuedForSync] = useState(false);

  // Real device GPS — works fully offline, no network required to read a fix.
  const [geo, setGeo] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'locating' | 'ok' | 'unavailable'>('locating');
  // Resolves the raw fix to a real place name the moment it comes in — the
  // raw-coordinate label stays as the fallback while this loads or fails.
  const { data: placeName, isLoading: placeNameLoading } = useReverseGeocodeQuery(geo?.lat, geo?.lng);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setGeoStatus('unavailable');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (cancelled) return;
        const { latitude, longitude } = pos.coords;
        setGeo({ lat: latitude, lng: longitude, label: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` });
        setGeoStatus('ok');
      } catch {
        if (!cancelled) setGeoStatus('unavailable');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addExtraPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast({ title: t('milestoneSubmit.permissionRequired'), description: t('milestoneSubmit.cameraRollAccess'), tone: 'error' });
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setExtraPhotos((prev) => [...prev, { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' }]);
  };

  const removeExtraPhoto = (idx: number) => {
    setExtraPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // If this milestone already has unsynced queue entries (e.g. captured
  // offline, navigated away, came back before they synced) surface them
  // instead of letting the contractor submit duplicates.
  const existingQueued = queue.filter(
    (q): q is QueuedMilestoneEvidence => q.kind === 'milestone_evidence' && q.projectId === projectId && q.milestoneId === targetMilestone?.id,
  );

  const handleSubmit = async () => {
    if (photos.length < MIN_PHOTOS) {
      showToast({ title: t('milestoneSubmit.photosRequired'), description: `${t('milestoneSubmit.attachAtLeast')} ${MIN_PHOTOS} ${t('milestoneSubmit.photosOfWork')}`, tone: 'error' });
      return;
    }
    if (!notes.trim()) {
      showToast({ title: t('milestoneSubmit.notesRequired'), description: t('milestoneSubmit.notesRequiredDesc'), tone: 'error' });
      return;
    }
    if (!targetMilestone) return;

    const geotagLat = geo?.lat;
    const geotagLng = geo?.lng;
    const resolvedPlaceName = placeName ?? undefined;

    if (!isOnline) {
      // The backend stores one Evidence sub-document per file, so — same as
      // the web offline queue and the online loop below — a multi-photo
      // submission becomes one queued item per photo, all sharing the same
      // notes/geotag.
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        await enqueueMilestoneEvidence({
          kind: 'milestone_evidence',
          projectId,
          projectTitle: project?.title ?? '',
          milestoneId: targetMilestone.id,
          milestoneTitle: targetMilestone.title,
          photoUri: photo.uri,
          fileName: `evidence-${i + 1}.jpg`,
          mimeType: photo.mimeType,
          notes: notes.trim(),
          geotagLat,
          geotagLng,
          placeName: resolvedPlaceName,
        });
      }
      setQueuedForSync(true);
      showToast({
        title: t('milestoneSubmit.savedForSync'),
        description: t('milestoneSubmit.offlineDesc'),
        tone: 'success',
      });
      return;
    }

    try {
      // One POST per file (the endpoint only accepts a single file), sequential
      // to keep evidence order deterministic — mirrors the web submit loop.
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        await evidenceMutation.mutateAsync({
          projectId,
          milestoneId: targetMilestone.id,
          file: { uri: photo.uri, fileName: `evidence-${i + 1}.jpg`, mimeType: photo.mimeType },
          notes: notes.trim(),
          geotagLat,
          geotagLng,
          placeName: resolvedPlaceName,
        });
      }

      showToast({
        title: t('milestoneSubmit.evidenceSubmitted'),
        description: t('milestoneSubmit.notifiedDesc'),
        tone: 'success',
      });
      navigation.goBack();
    } catch (err) {
      showToast({
        title: t('milestoneSubmit.submissionError'),
        description: apiErrorMessage(err, t('milestoneSubmit.couldNotSubmit')),
        tone: 'error',
      });
    }
  };

  if (isLoading || !project) {
    return (
      <Screen header={<Header title={t('milestoneSubmit.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title={t('milestoneSubmit.title')} subtitle={targetMilestone?.title} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Milestone Info */}
        <Card style={{ padding: 14, backgroundColor: colors.forest + '15', borderColor: colors.forest + '35', gap: 4 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
            {t('milestoneSubmit.activeMilestoneTranche')}
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
            {targetMilestone?.title || t('milestoneSubmit.milestoneFallback')}
          </Text>
          {targetMilestone ? (
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
              {t('milestoneSubmit.payoutValue')} <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest }}>{fmt(targetMilestone.amount)}</Text>
            </Text>
          ) : null}
        </Card>

        {/* Site Photo & AI Inspector */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Camera size={18} color={colors.forest} />
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
              {t('milestoneSubmit.sitePhotoEvidence')} ({photos.length})
            </Text>
            <View style={{ paddingHorizontal: 7, paddingVertical: 2, backgroundColor: colors.forest + '18', borderRadius: 8 }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>
                Gemini AI
              </Text>
            </View>
          </View>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
            {t('milestoneSubmit.uploadRealPhotosDesc')} {MIN_PHOTOS} {t('milestoneSubmit.photosRequiredSuffix')}
          </Text>
          <AIPhotoInspector
            label={t('milestoneSubmit.uploadMilestonePhoto')}
            onPhotoSelected={(_base64, mimeType, uri) => {
              setPrimaryPhoto({ uri, mimeType });
            }}
          />

          {/* Additional photos */}
          <View style={{ gap: 10, marginTop: 4 }}>
            {extraPhotos.map((photo, idx) => (
              <Card key={idx} style={{ overflow: 'hidden' }}>
                <View style={{ height: 140, backgroundColor: colors.parchment, position: 'relative' }}>
                  <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <Pressable
                    onPress={() => removeExtraPhoto(idx)}
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
            <Pressable
              onPress={addExtraPhoto}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 12,
                borderRadius: 14,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: colors.forest,
              }}
            >
              <Plus size={16} color={colors.forest} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>{t('milestoneSubmit.addAnotherPhoto')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Geotag display — real device GPS, no network required to capture */}
        <Card style={{ padding: 14, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.forest + '15' }}>
              <MapPin size={16} color={colors.forest} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                {geoStatus === 'locating' ? t('milestoneSubmit.locating') : geoStatus === 'ok' ? t('milestoneSubmit.gpsAttached') : t('milestoneSubmit.locationUnavailable')}
              </Text>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 1 }}>
                {geoStatus === 'ok' && geo
                  ? placeNameLoading
                    ? t('milestoneSubmit.resolvingPlaceName')
                    : placeName
                      ? `${placeName} (${geo.label})`
                      : geo.label
                  : geoStatus === 'unavailable'
                    ? t('milestoneSubmit.enableLocationAccess')
                    : t('milestoneSubmit.waitingForGps')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Execution Notes & Deliverables Description */}
        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
            {t('milestoneSubmit.completionNotesTitle')}
          </Text>
          <TextInput
            placeholder={t('milestoneSubmit.notesPlaceholder')}
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
            {t('milestoneSubmit.escrowInfo')}
          </Text>
        </View>

        {queuedForSync || existingQueued.length > 0 ? (
          <Card style={{ padding: 16, gap: 10, backgroundColor: colors.amber + '15', borderColor: colors.amber + '40' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <WifiOff size={18} color={colors.amber} />
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15 }}>{t('milestoneSubmit.savedOnDevice')}</Text>
            </View>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
              {existingQueued.length} {existingQueued.length === 1 ? t('milestoneSubmit.photo') : t('milestoneSubmit.photos')} {t('milestoneSubmit.queuedDesc')}
            </Text>
            {isOnline && (
              <PillButton variant="ghost" onPress={syncNow} loading={isSyncing} disabled={isSyncing} fullWidth>
                {isSyncing ? t('milestoneSubmit.syncing') : t('milestoneSubmit.syncNow')}
              </PillButton>
            )}
            <PillButton variant="primary" onPress={() => navigation.goBack()} fullWidth>
              {t('milestoneSubmit.backToProject')}
            </PillButton>
          </Card>
        ) : (
          <>
            {!isOnline && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: colors.amber + '15' }}>
                <WifiOff size={16} color={colors.amber} />
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, flex: 1, lineHeight: 15 }}>
                  {t('milestoneSubmit.offlineWillUpload')}
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <PillButton
              variant="primary"
              onPress={handleSubmit}
              loading={evidenceMutation.isPending}
              disabled={evidenceMutation.isPending || !targetMilestone || photos.length < MIN_PHOTOS}
              fullWidth
            >
              {photos.length < MIN_PHOTOS
                ? `${t('milestoneSubmit.addMorePhoto')} ${MIN_PHOTOS - photos.length} ${MIN_PHOTOS - photos.length === 1 ? t('milestoneSubmit.morePhoto') : t('milestoneSubmit.morePhotos')}`
                : isOnline
                  ? t('milestoneSubmit.submitForRelease')
                  : t('milestoneSubmit.saveForSync')}
            </PillButton>
          </>
        )}
      </View>
    </Screen>
  );
}
