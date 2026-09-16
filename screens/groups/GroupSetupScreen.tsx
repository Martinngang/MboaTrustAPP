import { useRef, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useCreateGroupMutation } from '../../api/groups';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

export function GroupSetupScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const createGroup = useCreateGroupMutation();

  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const purposeRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  const canCreate = name.trim().length > 0;

  const submit = async () => {
    if (!canCreate) return;
    try {
      const group = await createGroup.mutateAsync({ name: name.trim(), description: description.trim(), purpose: purpose.trim() });
      navigation.replace('GroupDashboard', { groupId: group.id });
    } catch (err) {
      showToast({ title: t('groupSetup.failedToCreate'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  return (
    <Screen header={<Header title={t('groupSetup.title')} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, lineHeight: 19 }}>
          {t('groupSetup.explainer')}
        </Text>

        <Card style={{ padding: 16, gap: 14 }}>
          <TextField
            label={t('groupSetup.groupNameLabel')}
            placeholder="e.g. Cameroon Diaspora Association — Brussels Chapter"
            value={name}
            onChangeText={setName}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => purposeRef.current?.focus()}
          />
          <TextField
            ref={purposeRef}
            label={t('groupSetup.purposeLabel')}
            placeholder="e.g. Pooling toward community water & education projects"
            value={purpose}
            onChangeText={setPurpose}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => descriptionRef.current?.focus()}
          />
          <View>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>
              {t('groupSetup.descriptionLabel')}
            </Text>
            <TextInput
              ref={descriptionRef}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              placeholder={t('groupSetup.descriptionPlaceholder')}
              placeholderTextColor={colors.inkSubtle}
              style={{
                backgroundColor: colors.parchment,
                borderRadius: 12,
                padding: 12,
                fontFamily: FONT.sans,
                color: colors.ink,
                fontSize: 13,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
            />
          </View>
        </Card>

        <PillButton variant="primary" onPress={submit} loading={createGroup.isPending} disabled={!canCreate || createGroup.isPending} fullWidth>
          {t('groupSetup.createGroupButton')}
        </PillButton>
      </View>
    </Screen>
  );
}
