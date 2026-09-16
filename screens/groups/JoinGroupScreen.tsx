import { useState, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useJoinGroupMutation } from '../../api/groups';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'JoinGroup'>;

/** groupController.join is self-service ("anyone with the group id can join
 * directly, e.g. via a shared link"). */
export function JoinGroupScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const joinGroup = useJoinGroupMutation();

  const [groupId, setGroupId] = useState(route.params?.groupId || '');

  const submit = async (targetId: string) => {
    const trimmed = targetId.trim();
    if (!trimmed) return;
    try {
      await joinGroup.mutateAsync(trimmed);
      navigation.replace('GroupDashboard', { groupId: trimmed });
    } catch (err) {
      showToast({ title: t('joinGroup.failedToJoin'), description: apiErrorMessage(err, t('joinGroup.checkIdAndRetry')), tone: 'error' });
    }
  };

  // A shared link joins immediately — the recipient shouldn't have to
  // re-type the id they were just handed.
  const autoJoinedRef = useRef(false);
  useEffect(() => {
    if (route.params?.groupId && !autoJoinedRef.current) {
      autoJoinedRef.current = true;
      submit(route.params.groupId);
    }
  }, [route.params?.groupId]);

  return (
    <Screen header={<Header title={t('joinGroup.title')} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, lineHeight: 19 }}>
          {t('joinGroup.explainer')}
        </Text>
        <TextField
          label={t('joinGroup.groupIdLabel')}
          placeholder={t('joinGroup.groupIdPlaceholder')}
          value={groupId}
          onChangeText={setGroupId}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => submit(groupId)}
        />
        <PillButton
          variant="primary"
          onPress={() => submit(groupId)}
          loading={joinGroup.isPending}
          disabled={!groupId.trim() || joinGroup.isPending}
          fullWidth
        >
          {t('joinGroup.joinGroupButton')}
        </PillButton>
      </View>
    </Screen>
  );
}
