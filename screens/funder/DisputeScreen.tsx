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
import { useTranslation } from '../../i18n/useTranslation';
import { translations, type TranslationKey } from '../../i18n/translations';

type RouteProps = RouteProp<MainStackParamList, 'Dispute'>;

const DISPUTE_REASON_KEYS: TranslationKey[] = [
  'dispute.reason1',
  'dispute.reason2',
  'dispute.reason3',
  'dispute.reason4',
  'dispute.reason5',
];

export function DisputeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const disputeMutation = useMilestoneDisputeMutation();

  const { projectId, milestoneId, milestoneTitle } = route.params;

  const [selectedReasonKey, setSelectedReasonKey] = useState<TranslationKey>(DISPUTE_REASON_KEYS[0]);
  const [details, setDetails] = useState('');

  const handleSubmitDispute = async () => {
    if (!details.trim()) {
      showToast({ title: t('dispute.explanationRequired'), description: t('dispute.explanationRequiredDesc'), tone: 'error' });
      return;
    }

    try {
      await disputeMutation.mutateAsync({
        projectId,
        milestoneId,
        reason: `${translations[selectedReasonKey].en}: ${details.trim()}`,
      });

      showToast({
        title: t('dispute.escrowFrozen'),
        description: t('dispute.verifierAssigned'),
        tone: 'warning',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({
        title: t('dispute.submissionFailed'),
        description: err?.message || t('dispute.couldNotFreeze'),
        tone: 'error',
      });
    }
  };

  return (
    <Screen header={<Header title={t('dispute.title')} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Warning Banner */}
        <Card style={{ padding: 14, backgroundColor: colors.seal + '15', borderColor: colors.seal + '40', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={20} color={colors.seal} />
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 14 }}>
              {t('dispute.protocolTitle')}
            </Text>
          </View>
          <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12, lineHeight: 17 }}>
            {t('dispute.protocolDesc')}
          </Text>
        </Card>

        {/* Milestone Info */}
        <Card style={{ padding: 14, gap: 4 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
            {t('dispute.disputedMilestone')}
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
            {milestoneTitle}
          </Text>
        </Card>

        {/* Dispute Reason Category */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
            {t('dispute.selectPrimaryReason')}
          </Text>

          {DISPUTE_REASON_KEYS.map((rk) => {
            const active = selectedReasonKey === rk;
            return (
              <Pressable
                key={rk}
                onPress={() => setSelectedReasonKey(rk)}
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
                  {t(rk)}
                </Text>
              </Pressable>
            );
          })}
        </Card>

        {/* Detailed Explanation */}
        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
            {t('dispute.detailedExplanation')}
          </Text>
          <TextInput
            placeholder={t('dispute.detailsPlaceholder')}
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
          {t('dispute.freezeAndSubmit')}
        </PillButton>
      </View>
    </Screen>
  );
}
