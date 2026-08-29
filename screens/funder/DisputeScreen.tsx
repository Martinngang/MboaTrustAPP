import { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AlertTriangle,
  ShieldAlert,
  Check,
  Lock,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useMilestoneDisputeMutation } from '../../api/escrow';
import type { MainStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<MainStackParamList, 'Dispute'>;

const DISPUTE_REASONS = [
  'Incomplete Work / Substandard Quality',
  'Contractor Inactivity / Unreasonable Delay',
  'Material Deviation from Agreed Specifications',
  'Unauthorized Cost Increase or Scope Change',
  'Suspected Fraud / False Verification Evidence',
];

export function DisputeScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const disputeMutation = useMilestoneDisputeMutation();

  const { projectId, milestoneId, milestoneTitle } = route.params;

  const [selectedReason, setSelectedReason] = useState(DISPUTE_REASONS[0]);
  const [details, setDetails] = useState('');

  const handleSubmitDispute = async () => {
    if (!details.trim()) {
      showToast({ title: 'Explanation Required', description: 'Please provide detailed context for the dispute.', tone: 'error' });
      return;
    }

    try {
      await disputeMutation.mutateAsync({
        projectId,
        milestoneId,
        reason: `${selectedReason}: ${details.trim()}`,
      });

      showToast({
        title: 'Escrow Frozen & Dispute Filed',
        description: 'An independent verifier has been assigned to investigate.',
        tone: 'warning',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({
        title: 'Dispute Submission Failed',
        description: err?.message || 'Could not freeze escrow. Please try again.',
        tone: 'error',
      });
    }
  };

  return (
    <Screen header={<Header title="Raise Milestone Dispute" back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Warning Banner */}
        <Card style={{ padding: 14, backgroundColor: colors.seal + '15', borderColor: colors.seal + '40', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={20} color={colors.seal} />
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 14 }}>
              Escrow Protection Protocol
            </Text>
          </View>
          <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12, lineHeight: 17 }}>
            Filing a dispute freezes the milestone funds in escrow immediately. Funds cannot be released until an independent verification investigation is concluded.
          </Text>
        </Card>

        {/* Milestone Info */}
        <Card style={{ padding: 14, gap: 4 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
            Disputed Milestone
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
            {milestoneTitle}
          </Text>
        </Card>

        {/* Dispute Reason Category */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
            Select Primary Reason
          </Text>

          {DISPUTE_REASONS.map((r) => {
            const active = selectedReason === r;
            return (
              <Pressable
                key={r}
                onPress={() => setSelectedReason(r)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? colors.seal : colors.parchmentDark,
                  backgroundColor: active ? colors.seal + '10' : colors.surface,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: active ? colors.seal : colors.inkSubtle,
                    backgroundColor: active ? colors.seal : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {active && <Check size={12} color="#fff" strokeWidth={3} />}
                </View>
                <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13, flex: 1 }}>
                  {r}
                </Text>
              </Pressable>
            );
          })}
        </Card>

        {/* Detailed Explanation */}
        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
            Detailed Explanation & Observations
          </Text>
          <TextInput
            placeholder="Describe what occurred, dates of communication with contractor, and specific missing deliverables..."
            placeholderTextColor={colors.inkSubtle}
            value={details}
            onChangeText={setDetails}
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

        {/* Submit Dispute */}
        <PillButton
          variant="danger"
          onPress={handleSubmitDispute}
          loading={disputeMutation.isPending}
          disabled={disputeMutation.isPending}
          fullWidth
        >
          Freeze Escrow & Submit Dispute
        </PillButton>
      </View>
    </Screen>
  );
}
