import { useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, Modal, TextInput, ActivityIndicator, Linking } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  X,
  FileText,
  Calendar,
  Video,
  MapPin,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { PillButton } from '../../components/PillButton';
import { EmptyState } from '../../components/EmptyState';
import { BiometricLockModal } from '../../components/BiometricLockModal';
import { MilestoneCelebrationModal } from '../../components/MilestoneCelebrationModal';
import { ApprovalStatusList, type Approver } from '../../components/ApprovalStatusList';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useProjectQuery } from '../../api/projects';
import { useMilestoneApprovalMutation, useRequestMilestoneChangesMutation } from '../../api/escrow';
import { useTargetVerificationTasksQuery } from '../../api/verifier';
import { useMaterialOrdersForMilestoneQuery } from '../../api/materialOrders';
import { useVideoSessionsQuery } from '../../api/videoVerification';
import { useApp } from '../../context/AppContext';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'MilestoneReview'>;

export function MilestoneReviewScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const { user } = useApp();
  const approvalMutation = useMilestoneApprovalMutation();
  const changesMutation = useRequestMilestoneChangesMutation();

  const { projectId, milestoneId } = route.params;
  const { data: project, isLoading } = useProjectQuery(projectId);

  // Find target milestone or first under_review / pending one. Computed
  // before any early return (Rules of Hooks) so the verification-tasks
  // query below can be keyed off the real resolved milestone id.
  const targetMilestone = project
    ? project.milestones.find((m) => (milestoneId ? m.id === milestoneId : m.status === 'under_review')) ||
      project.milestones[0]
    : undefined;

  const { data: verificationTasks = [] } = useTargetVerificationTasksQuery('milestone', targetMilestone?.id);
  const verifierReport = verificationTasks.find((t) => t.status === 'submitted');

  // A linked order/receipt is this milestone's evidence, same as a photo,
  // when materials were requested from a verified supplier instead of (or
  // alongside) photo proof — mirrors web's MilestoneReviewScreen exactly.
  const { data: materialOrders = [] } = useMaterialOrdersForMilestoneQuery(project?.id, targetMilestone?.id);
  const materialOrder = materialOrders[0];
  const { data: videoSessions = [] } = useVideoSessionsQuery(project?.id, targetMilestone?.id);
  // Most recent non-cancelled session, if any — a milestone can be
  // re-requested after a cancellation.
  const videoCall = videoSessions.find((s) => s.status !== 'cancelled');

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);

  if (isLoading || !project) {
    return (
      <Screen header={<Header title={t('milestoneReview.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  if (!targetMilestone) {
    return (
      <Screen header={<Header title={t('milestoneReview.title')} back />}>
        <View style={{ padding: 24, alignItems: 'center', gap: 12 }}>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
            {t('milestoneReview.noMilestoneFound')}
          </Text>
          <PillButton onPress={() => navigation.goBack()} variant="secondary">
            {t('milestoneReview.goBack')}
          </PillButton>
        </View>
      </Screen>
    );
  }

  // The backend is the source of truth for multi-sig: it auto-registers
  // whoever decides as an approver on their first decision and only
  // releases once every required identity (owner + co-signer) has approved
  // (see projectController.applyApprovalDecision/decideApproval). This just
  // displays that real state, synthesizing a "pending" row for a required
  // identity that hasn't acted yet so the list isn't empty before anyone
  // has decided.
  const requiresMultiSig = targetMilestone.requiresMultiApproval || project.requiresMultiSig;
  const requiredIdentities = requiresMultiSig
    ? [
        { userId: project.ownerId, userName: project.ownerName },
        ...(project.coSignerId ? [{ userId: project.coSignerId, userName: project.coSignerName ?? t('milestoneReview.coSigner') }] : []),
      ]
    : [];
  const approvers: Approver[] = requiredIdentities.map((req) => {
    const real = targetMilestone.approvers.find((a) => a.userId === req.userId);
    return { name: req.userId === user?._id ? t('milestoneReview.you') : req.userName, status: real?.status === 'approved' ? 'approved' : 'pending' };
  });
  const myApprovalDone = targetMilestone.approvers.find((a) => a.userId === user?._id)?.status === 'approved';

  const executeFinalApproval = async () => {
    try {
      const result = await approvalMutation.mutateAsync({
        projectId: project.id,
        milestoneId: targetMilestone.id,
        status: 'approved',
      });
      if (result.releasedEscrow) {
        setCelebrationOpen(true);
      } else {
        showToast({
          title: t('milestoneReview.approvalRecorded'),
          description: t('milestoneReview.waitingOnOtherApprover'),
          tone: 'success',
        });
        navigation.goBack();
      }
    } catch (err: any) {
      showToast({
        title: t('milestoneReview.approvalFailed'),
        description: err?.message || t('milestoneReview.couldNotApprove'),
        tone: 'error',
      });
    }
  };

  const handleApprove = () => {
    setPinModalOpen(true);
  };

  const handleRequestCorrections = async () => {
    if (!correctionReason.trim()) {
      showToast({ title: t('milestoneReview.reasonRequired'), description: t('milestoneReview.explainCorrection'), tone: 'error' });
      return;
    }
    try {
      await changesMutation.mutateAsync({
        projectId: project.id,
        milestoneId: targetMilestone.id,
        reason: correctionReason.trim(),
      });
      setCorrectionModalOpen(false);
      showToast({
        title: t('milestoneReview.correctionsRequested'),
        description: t('milestoneReview.contractorNotified'),
        tone: 'warning',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({
        title: t('milestoneReview.requestFailed'),
        description: err?.message || t('milestoneReview.couldNotSubmitRequest'),
        tone: 'error',
      });
    }
  };

  const evidenceList = targetMilestone.evidence;

  return (
    <Screen header={<Header title={t('milestoneReview.reviewTitle')} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Milestone Overview Card */}
        <Card style={{ padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
                {project.title}
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 17, marginTop: 2 }}>
                {targetMilestone.title}
              </Text>
            </View>
            <StatusBadge status={targetMilestone.status} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.parchmentDark }}>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>{t('milestoneReview.escrowPayoutValue')}</Text>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 17 }}>{fmt(targetMilestone.amount)}</Text>
          </View>
        </Card>

        {/* Multi-signature Approval Status */}
        {requiresMultiSig && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              {t('milestoneReview.requiresMultipleApprovers')}
            </Text>
            <ApprovalStatusList approvers={approvers} />
          </View>
        )}

        {/* Verification Evidence Gallery */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Camera size={18} color={colors.forest} />
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
              {t('milestoneReview.submittedEvidence')} ({evidenceList.length})
            </Text>
          </View>

          {evidenceList.length === 0 ? (
            <EmptyState
              icon={Camera}
              title={t('milestoneReview.noEvidenceYet')}
              description={t('milestoneReview.noEvidenceDesc')}
            />
          ) : (
            <View style={{ gap: 12 }}>
              {evidenceList.map((ev, idx) => (
                <Card key={ev.id || idx} style={{ overflow: 'hidden' }}>
                  <Pressable onPress={() => setSelectedPhoto(ev.fileUrl)}>
                    <Image source={{ uri: ev.fileUrl }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
                    {ev.duplicateFlag && (
                      <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: colors.seal + 'e6', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
                        <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 9, fontWeight: '700' }}>{t('milestoneReview.flagged')}</Text>
                      </View>
                    )}
                  </Pressable>
                  <View style={{ padding: 12, gap: 6 }}>
                    <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 13, lineHeight: 18 }}>
                      {ev.notes}
                    </Text>
                    {ev.submittedByName && (
                      <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11 }}>
                        {t('milestoneReview.submittedBy')} {ev.submittedByName}
                      </Text>
                    )}
                    {ev.capturedAt && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} color={colors.inkSubtle} />
                        <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11 }}>
                          {t('milestoneReview.captured')} {ev.capturedAt}
                        </Text>
                      </View>
                    )}
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* Geo verification — from whichever evidence entry actually has a
            geotag. Ported from web's MilestoneReviewScreen; mobile opens the
            device's own maps app for "View on Map" instead of an embedded
            map modal (no map library on mobile), same underlying capability. */}
        {(() => {
          const withGeotag = evidenceList.find((e) => e.geotag);
          if (!withGeotag || !withGeotag.geotag) return null;
          const { lat, lng } = withGeotag.geotag;
          const locationLooksOff = withGeotag.locationMatch === false;
          return (
            <Card style={{ padding: 14, gap: 10, borderColor: locationLooksOff ? colors.seal : colors.parchmentDark }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {t('milestoneReview.geoVerification')}
                </Text>
                <Pressable onPress={() => Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`)}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
                    {t('milestoneReview.viewOnMap')}
                  </Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View
                  style={{
                    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: locationLooksOff ? colors.seal + '18' : colors.steel + '18',
                  }}
                >
                  <MapPin size={18} color={locationLooksOff ? colors.seal : colors.steel} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                    {locationLooksOff ? t('milestoneReview.locationDoesNotMatch') : t('milestoneReview.locationConfirmed')}
                  </Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, marginTop: 2 }}>
                    {withGeotag.placeName ? `${withGeotag.placeName} (${lat.toFixed(5)}, ${lng.toFixed(5)})` : `${lat.toFixed(5)}, ${lng.toFixed(5)}`} — {project.location}
                  </Text>
                  {withGeotag.capturedAt && (
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 2 }}>
                      {t('milestoneReview.submittedLabel')} {new Date(withGeotag.capturedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          );
        })()}

        {/* Live Video Verification — only shown when the funder flagged this
            milestone as requiring one at creation time. */}
        {targetMilestone.requiresVideo && (
          <Card style={{ padding: 14, gap: 10 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('milestoneReview.liveVideoVerification')}
            </Text>
            {!videoCall ? (
              <>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
                  {t('milestoneReview.videoVerificationDesc')}
                </Text>
                <Pressable
                  onPress={() =>
                    navigation.navigate('VideoVerification', {
                      projectId: project.id,
                      milestoneId: targetMilestone.id,
                      milestoneTitle: targetMilestone.title,
                    })
                  }
                  accessibilityRole="button"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: colors.steel,
                  }}
                >
                  <Video size={16} color={colors.steel} />
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.steel, fontSize: 13 }}>
                    {t('milestoneReview.requestLiveVideoCheck')}
                  </Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() =>
                  navigation.navigate('VideoVerification', {
                    projectId: project.id,
                    milestoneId: targetMilestone.id,
                    milestoneTitle: targetMilestone.title,
                  })
                }
                accessibilityRole="button"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.steel + '18', alignItems: 'center', justifyContent: 'center' }}>
                  <Video size={18} color={colors.steel} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                    {videoCall.status === 'scheduled'
                      ? `${t('milestoneReview.callScheduled')} — ${new Date(videoCall.scheduledFor!).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                      : videoCall.status === 'completed'
                        ? t('milestoneReview.callCompleted')
                        : t('milestoneReview.callRequested')}
                  </Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 1 }}>
                    {videoCall.status === 'scheduled' ? videoCall.meetingUrl : videoCall.status === 'completed' ? t('milestoneReview.verificationComplete') : t('milestoneReview.awaitingScheduling')}
                  </Text>
                </View>
              </Pressable>
            )}
          </Card>
        )}

        {/* Independent Field Verifier Report — only shown when a verifier
            was actually assigned and has filed a submitted report; never a
            blanket "validated" claim regardless of whether one exists. */}
        {verifierReport && (
          <Card
            style={{
              padding: 14,
              backgroundColor: verifierReport.confirmedMatch === false ? colors.seal + '12' : colors.forest + '12',
              borderColor: verifierReport.confirmedMatch === false ? colors.seal + '30' : colors.forest + '30',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <ShieldCheck size={22} color={verifierReport.confirmedMatch === false ? colors.seal : colors.forest} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                {verifierReport.confirmedMatch === false ? t('milestoneReview.siteVisitNotConfirmed') : t('milestoneReview.independentVerifierReport')}
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, marginTop: 1 }}>
                {verifierReport.reportText || t('milestoneReview.fieldVerifierInspected')}
              </Text>
            </View>
          </Card>
        )}

        {/* Materials — a linked order/receipt is this milestone's evidence,
            same as a photo, when materials were requested from a verified
            supplier instead of (or alongside) photo proof. */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('milestoneReview.materials')}
          </Text>
          {materialOrder ? (
            <Pressable
              onPress={() => navigation.navigate('MaterialOrderDetail', { orderId: materialOrder.id })}
              accessibilityRole="button"
            >
              <Card style={{ padding: 14, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>{materialOrder.supplierName}</Text>
                  <StatusBadge status={materialOrder.status} />
                </View>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
                  {materialOrder.items.length} {materialOrder.items.length === 1 ? t('milestoneReview.item') : t('milestoneReview.items')} · {fmt(materialOrder.totalAmount)}
                </Text>
              </Card>
            </Pressable>
          ) : (
            <>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, fontStyle: 'italic' }}>
                {t('milestoneReview.noMaterialOrderLinked')}
              </Text>
              <Pressable
                onPress={() => navigation.navigate('RequestMaterials', { projectId: project.id, milestoneId: targetMilestone.id })}
                accessibilityRole="button"
                style={{ paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.forest, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>
                  {t('milestoneReview.requestMaterials')}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Prior correction rounds — full history, so both sides see every
            back-and-forth on this milestone. */}
        {targetMilestone.changeRequests.length > 0 && (
          <Card style={{ padding: 14, gap: 8, backgroundColor: colors.amber + '12', borderColor: colors.amber + '40' }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.amber, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('milestoneReview.correctionsRequestedCount')} ({targetMilestone.changeRequests.length})
            </Text>
            {targetMilestone.changeRequests.map((c, i) => (
              <Text key={i} style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 13, lineHeight: 18 }}>
                "{c.reason}"{' '}
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>
                  — {new Date(c.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </Text>
              </Text>
            ))}
          </Card>
        )}

        {/* Action Decision Buttons */}
        <View style={{ gap: 10, marginTop: 4 }}>
          {requiresMultiSig && myApprovalDone ? (
            <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.parchmentDark, backgroundColor: colors.parchment, alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center' }}>
                {t('milestoneReview.signOffRecorded')}
              </Text>
            </View>
          ) : (
            <PillButton
              variant="primary"
              onPress={handleApprove}
              loading={approvalMutation.isPending}
              disabled={approvalMutation.isPending}
              fullWidth
            >
              {requiresMultiSig
                ? `${t('milestoneReview.addYourApproval')} (${approvers.filter((a) => a.status === 'approved').length}/${approvers.length})`
                : `${t('milestoneReview.approveAndReleasePrefix')} ${fmt(targetMilestone.amount)}`}
            </PillButton>
          )}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <PillButton
                variant="secondary"
                onPress={() => setCorrectionModalOpen(true)}
                disabled={approvalMutation.isPending || changesMutation.isPending}
                fullWidth
              >
                {t('milestoneReview.requestCorrections')}
              </PillButton>
            </View>

            <View style={{ flex: 1 }}>
              <PillButton
                variant="danger"
                onPress={() =>
                  navigation.navigate('Dispute', {
                    projectId: project.id,
                    milestoneId: targetMilestone.id,
                    milestoneTitle: targetMilestone.title,
                  })
                }
                disabled={approvalMutation.isPending}
                fullWidth
              >
                {t('milestoneReview.raiseDispute')}
              </PillButton>
            </View>
          </View>
        </View>
      </View>

      {/* Photo Zoom Modal */}
      <Modal visible={!!selectedPhoto} transparent animationType="fade" onRequestClose={() => setSelectedPhoto(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' }}>
          <Pressable onPress={() => setSelectedPhoto(null)} style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }}>
            <X size={28} color="#fff" />
          </Pressable>
          {selectedPhoto && (
            <Image source={{ uri: selectedPhoto }} style={{ width: '92%', height: '70%' }} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* Request Corrections Modal */}
      <Modal visible={correctionModalOpen} transparent animationType="slide" onRequestClose={() => setCorrectionModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>{t('milestoneReview.requestCorrectionsModalTitle')}</Text>
              <Pressable onPress={() => setCorrectionModalOpen(false)} hitSlop={6}>
                <X size={20} color={colors.inkMuted} />
              </Pressable>
            </View>

            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>
              {t('milestoneReview.correctionsModalDesc')}
            </Text>

            <TextInput
              placeholder={t('milestoneReview.correctionsPlaceholder')}
              placeholderTextColor={colors.inkSubtle}
              value={correctionReason}
              onChangeText={setCorrectionReason}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: colors.parchment,
                borderRadius: 14,
                padding: 14,
                fontFamily: FONT.sans,
                color: colors.ink,
                fontSize: 13,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
            />

            <PillButton variant="primary" onPress={handleRequestCorrections} loading={changesMutation.isPending} fullWidth>
              {t('milestoneReview.sendCorrectionNotice')}
            </PillButton>
          </View>
        </View>
      </Modal>

      {/* Biometric Face ID & 4-Digit Escrow Release Security Modal */}
      <BiometricLockModal
        visible={pinModalOpen}
        title={t('milestoneReview.authorizeReleaseTitle')}
        subtitle={`${t('milestoneReview.authorizeReleaseSubtitle')} ${fmt(targetMilestone.amount)} ${t('milestoneReview.toContractor')}`}
        onSuccess={executeFinalApproval}
        onClose={() => setPinModalOpen(false)}
      />

      {/* Celebration Confetti & WhatsApp Share Modal */}
      <MilestoneCelebrationModal
        visible={celebrationOpen}
        milestoneTitle={targetMilestone.title}
        amountXaf={targetMilestone.amount}
        projectName={project.title}
        contractorName={t('milestoneReview.assignedContractor')}
        onClose={() => {
          setCelebrationOpen(false);
          navigation.goBack();
        }}
      />
    </Screen>
  );
}
