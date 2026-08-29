import { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ShieldCheck,
  MapPin,
  Compass,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Layers,
  ArrowRight,
  Camera,
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
import {
  useVerificationTasksQuery,
  useStartVerificationTaskMutation,
  type VerificationTask,
} from '../../api/verifier';
import type { MainStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<MainStackParamList, 'VerifierTaskDetail'>;

export function VerifierTaskDetailScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { taskId } = route.params;
  const { data: tasks, isLoading } = useVerificationTasksQuery();
  const startMutation = useStartVerificationTaskMutation();

  const task = (tasks || []).find((t) => t.id === taskId) || (tasks || [])[0];

  if (isLoading || !task) {
    return (
      <Screen header={<Header title="Audit Assignment" back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync(task.id);
      showToast({
        title: 'Audit In Progress',
        description: 'Site inspection initiated. You can now submit your report.',
        tone: 'success',
      });
    } catch (err: any) {
      showToast({ title: 'Error', description: err?.message || 'Could not start audit.', tone: 'error' });
    }
  };

  const checklistItems = [
    { title: 'Excavation & Depth Measurement', detail: 'Verify trench depth reaches ≥ 1.5m into solid substrate.' },
    { title: 'Steel Rebar Reinforcement', detail: 'Inspect 12mm main bars, 8mm stirrup spacing, and tie wire integrity.' },
    { title: 'Concrete Pour Quality', detail: 'Verify aggregate ratio, slump test consistency, and curing.' },
    { title: 'On-Site GPS Geotag Confirmation', detail: 'Confirm coordinates match registered cadastral plot boundaries.' },
  ];

  return (
    <Screen header={<Header title="Inspection Task" subtitle={task.projectTitle} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Task Header Card */}
        <Card style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
                {task.targetType === 'land_listing' ? 'Cadastral Audit' : 'Milestone Verification'}
              </Text>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18, marginTop: 2 }}>
                {task.projectTitle}
              </Text>
              {task.milestoneTitle ? (
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                  Tranche: {task.milestoneTitle}
                </Text>
              ) : null}
            </View>
            <StatusBadge status={task.status} />
          </View>

          {/* Location & GPS */}
          <View style={{ backgroundColor: colors.parchment, borderRadius: 12, padding: 12, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color={colors.forest} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                {task.location}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Compass size={13} color={colors.inkSubtle} />
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11 }}>
                Coordinates: {task.coordinates.lat}° N, {task.coordinates.lng}° E
              </Text>
            </View>
          </View>

          {/* Bounty Fee */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
              Inspector Bounty Fee (Escrow Guaranteed):
            </Text>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16 }}>
              {fmt(task.bountyFee)}
            </Text>
          </View>
        </Card>

        {/* Contractor's Submitted Evidence to Inspect */}
        {task.contractorEvidence && (
          <Card style={{ padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Camera size={16} color={colors.ink} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                Contractor Submitted Proof
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {task.contractorEvidence.photos.map((uri, idx) => (
                <Image
                  key={idx}
                  source={{ uri }}
                  style={{ width: 140, height: 100, borderRadius: 10, backgroundColor: colors.parchment }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
              "{task.contractorEvidence.notes}"
            </Text>
          </Card>
        )}

        {/* Inspection Verification Checklist */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Expert Verification Standards
          </Text>

          <View style={{ gap: 10 }}>
            {checklistItems.map((item, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.forest + '15',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                  }}
                >
                  <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 11, fontWeight: '700' }}>
                    {idx + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11, marginTop: 1 }}>
                    {item.detail}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Submitted Report Review (if completed) */}
        {task.report && (
          <Card style={{ padding: 16, gap: 10, backgroundColor: colors.forest + '12', borderColor: colors.forest + '30' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color={colors.forest} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 14 }}>
                Report Submitted & Signed
              </Text>
            </View>
            <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 13, lineHeight: 18 }}>
              {task.report.reportText}
            </Text>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11 }}>
              Verdict: {task.report.confirmedMatch ? 'PASSED & APPROVED' : 'FLAGGED DEFECT'} · {task.report.submittedAt}
            </Text>
          </Card>
        )}

        {/* Action Decision */}
        <View style={{ gap: 10, marginTop: 4 }}>
          {task.status === 'assigned' && (
            <PillButton
              variant="primary"
              onPress={handleStart}
              loading={startMutation.isPending}
              disabled={startMutation.isPending}
              fullWidth
            >
              Accept & Begin On-Site Audit
            </PillButton>
          )}

          {task.status === 'in_progress' && (
            <PillButton
              variant="primary"
              onPress={() =>
                navigation.navigate('VerifierSubmitReport', {
                  taskId: task.id,
                  projectTitle: task.projectTitle,
                  milestoneTitle: task.milestoneTitle || 'Milestone Verification',
                })
              }
              fullWidth
            >
              Submit Inspection Report & Verdict
            </PillButton>
          )}

          {task.status === 'submitted' && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: colors.forest + '20',
                paddingVertical: 12,
                borderRadius: 14,
              }}
            >
              <ShieldCheck size={16} color={colors.forest} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>
                Audit Completed · Bounty Settled
              </Text>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}
