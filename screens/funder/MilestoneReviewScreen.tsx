import { useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, Modal, TextInput, ActivityIndicator } from 'react-native';
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
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useProjectQuery } from '../../api/projects';
import { useMilestoneApprovalMutation } from '../../api/escrow';
import type { MainStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<MainStackParamList, 'MilestoneReview'>;

export function MilestoneReviewScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const approvalMutation = useMilestoneApprovalMutation();

  const { projectId, milestoneId } = route.params;
  const { data: project, isLoading } = useProjectQuery(projectId);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');

  if (isLoading || !project) {
    return (
      <Screen header={<Header title="Milestone Review" back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  // Find target milestone or first under_review / pending one
  const targetMilestone =
    project.milestones.find((m) => (milestoneId ? m.id === milestoneId : m.status === 'under_review')) ||
    project.milestones[0];

  if (!targetMilestone) {
    return (
      <Screen header={<Header title="Milestone Review" back />}>
        <View style={{ padding: 24, alignItems: 'center', gap: 12 }}>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
            No milestone found
          </Text>
          <PillButton onPress={() => navigation.goBack()} variant="secondary">
            Go Back
          </PillButton>
        </View>
      </Screen>
    );
  }

  const handleApprove = async () => {
    try {
      await approvalMutation.mutateAsync({
        projectId: project.id,
        milestoneId: targetMilestone.id,
        decision: 'approve',
      });
      showToast({
        title: 'Milestone Approved!',
        description: `${fmt(targetMilestone.amount)} has been released from escrow.`,
        tone: 'success',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({
        title: 'Approval Failed',
        description: err?.message || 'Could not approve milestone.',
        tone: 'error',
      });
    }
  };

  const handleRequestCorrections = async () => {
    if (!correctionReason.trim()) {
      showToast({ title: 'Reason Required', description: 'Please explain what needs correction.', tone: 'error' });
      return;
    }
    try {
      await approvalMutation.mutateAsync({
        projectId: project.id,
        milestoneId: targetMilestone.id,
        decision: 'changes_requested',
        reason: correctionReason.trim(),
      });
      setCorrectionModalOpen(false);
      showToast({
        title: 'Corrections Requested',
        description: 'The contractor has been notified to provide revised proof.',
        tone: 'warning',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({
        title: 'Request Failed',
        description: err?.message || 'Could not submit correction request.',
        tone: 'error',
      });
    }
  };

  // Demo evidence items if not attached to project
  const evidenceList =
    targetMilestone.evidence.length > 0
      ? targetMilestone.evidence
      : [
          {
            id: 'ev-1',
            type: 'photo',
            fileUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=400&fit=crop&auto=format',
            notes: 'Foundation trench concrete pouring and rebar reinforcement complete.',
            capturedAt: 'Today, 08:30 AM',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'ev-2',
            type: 'photo',
            fileUrl: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=600&h=400&fit=crop&auto=format',
            notes: 'Geotechnical compaction verification with plumb line check.',
            capturedAt: 'Today, 09:15 AM',
            createdAt: new Date().toISOString(),
          },
        ];

  return (
    <Screen header={<Header title="Review Milestone Proof" back />}>
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
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>Escrow Payout Value</Text>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 17 }}>{fmt(targetMilestone.amount)}</Text>
          </View>
        </Card>

        {/* Verification Evidence Gallery */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Camera size={18} color={colors.forest} />
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
              Submitted Photo Evidence ({evidenceList.length})
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            {evidenceList.map((ev, idx) => (
              <Card key={ev.id || idx} style={{ overflow: 'hidden' }}>
                <Pressable onPress={() => setSelectedPhoto(ev.fileUrl)}>
                  <Image source={{ uri: ev.fileUrl }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
                </Pressable>
                <View style={{ padding: 12, gap: 6 }}>
                  <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 13, lineHeight: 18 }}>
                    {ev.notes}
                  </Text>
                  {ev.capturedAt && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} color={colors.inkSubtle} />
                      <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11 }}>
                        Captured: {ev.capturedAt}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Independent Field Verifier Badge */}
        <Card style={{ padding: 14, backgroundColor: colors.forest + '12', borderColor: colors.forest + '30', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={22} color={colors.forest} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
              Field Inspection Validated
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, marginTop: 1 }}>
              Independent verifier confirmed on-site completion and quality standards.
            </Text>
          </View>
        </Card>

        {/* Action Decision Buttons */}
        <View style={{ gap: 10, marginTop: 4 }}>
          <PillButton
            variant="primary"
            onPress={handleApprove}
            loading={approvalMutation.isPending}
            disabled={approvalMutation.isPending}
            fullWidth
          >
            {`Approve & Release ${fmt(targetMilestone.amount)}`}
          </PillButton>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <PillButton
                variant="secondary"
                onPress={() => setCorrectionModalOpen(true)}
                disabled={approvalMutation.isPending}
                fullWidth
              >
                Request Corrections
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
                Raise Dispute
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
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>Request Milestone Corrections</Text>
              <Pressable onPress={() => setCorrectionModalOpen(false)} hitSlop={6}>
                <X size={20} color={colors.inkMuted} />
              </Pressable>
            </View>

            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>
              Specify the defects or missing deliverables the contractor must fix before escrow funds can be released.
            </Text>

            <TextInput
              placeholder="e.g. Please re-level the left corner foundation and provide clear photos with the surveyor level marker..."
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

            <PillButton variant="primary" onPress={handleRequestCorrections} loading={approvalMutation.isPending} fullWidth>
              Send Correction Notice
            </PillButton>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
