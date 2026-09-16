import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CheckCircle2, X } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useProjectQuery } from '../../api/projects';
import { useInviteCoFunderMutation } from '../../api/pooledFunding';
import { useUserSearchQuery } from '../../api/users';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'InviteCoFunder'>;

/** Like adding a co-signer, this requires an existing registered account —
 * the backend has no way to invite someone who hasn't signed up. */
export function InviteCoFunderScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { projectId } = route.params;
  const { data: project, isLoading } = useProjectQuery(projectId);
  const inviteCoFunder = useInviteCoFunderMutation();

  const [query, setQuery] = useState('');
  const { data: results = [], isFetching } = useUserSearchQuery(query);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [amount, setAmount] = useState('');
  const [invited, setInvited] = useState<string | null>(null);

  const invite = async () => {
    if (!selected || !Number(amount) || !project) return;
    try {
      await inviteCoFunder.mutateAsync({ projectId: project.id, contributorId: selected.id, amount: Number(amount) });
      setInvited(selected.name);
    } catch (err) {
      showToast({ title: t('inviteCoFunder.failedToSend'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  if (isLoading) {
    return (
      <Screen header={<Header title={t('inviteCoFunder.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  if (!project) {
    return (
      <Screen header={<Header title={t('inviteCoFunder.title')} back />}>
        <View style={{ padding: 16 }}>
          <EmptyState icon={CheckCircle2} title={t('inviteCoFunder.projectNotFound')} description={t('inviteCoFunder.projectNotFoundDesc')} />
        </View>
      </Screen>
    );
  }

  if (invited) {
    return (
      <Screen header={<Header title={t('inviteCoFunder.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={32} color="#fff" />
          </View>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20, textAlign: 'center' }}>{t('inviteCoFunder.invitationSent')}</Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
            {invited} {t('inviteCoFunder.invitedDescPart1')} {project.title}. {t('inviteCoFunder.invitedDescPart2')}
          </Text>
          <PillButton onPress={() => navigation.navigate('PooledFunding', { projectId: project.id })} fullWidth>
            {t('inviteCoFunder.backToGroupFunding')}
          </PillButton>
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title={t('inviteCoFunder.title')} subtitle={project.title} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Card style={{ padding: 14, backgroundColor: colors.steel + '15', borderColor: colors.steel + '40' }}>
          <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12, lineHeight: 17 }}>
            {t('inviteCoFunder.explainer')}
          </Text>
        </Card>

        <TextField
          label={t('inviteCoFunder.searchLabel')}
          placeholder={t('inviteCoFunder.namePlaceholder')}
          value={query}
          onChangeText={(v) => { setQuery(v); setSelected(null); }}
          autoCapitalize="words"
          returnKeyType="search"
        />

        {!selected && query.trim().length >= 2 && (
          <View style={{ gap: 8 }}>
            {isFetching ? (
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>{t('inviteCoFunder.searching')}</Text>
            ) : results.length === 0 ? (
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>{t('inviteCoFunder.noMatchingAccount')}</Text>
            ) : (
              results.map((u) => (
                <Pressable
                  key={u.id}
                  onPress={() => setSelected({ id: u.id, name: u.fullName })}
                  style={{ borderRadius: 12, borderWidth: 1, borderColor: colors.parchmentDark, padding: 12 }}
                >
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{u.fullName}</Text>
                  {(u.phoneNumber || u.email) && (
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 2 }}>{u.phoneNumber || u.email}</Text>
                  )}
                </Pressable>
              ))
            )}
          </View>
        )}

        {selected && (
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.forest, backgroundColor: colors.forest + '12', padding: 12 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>{selected.name}</Text>
              <Pressable onPress={() => setSelected(null)} hitSlop={6}>
                <X size={16} color={colors.forest} />
              </Pressable>
            </View>
            <TextField
              label={t('inviteCoFunder.pledgeAmountLabel')}
              placeholder="e.g. 100000"
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={invite}
            />
          </View>
        )}

        <PillButton
          variant="primary"
          onPress={invite}
          loading={inviteCoFunder.isPending}
          disabled={!selected || !Number(amount) || inviteCoFunder.isPending}
          fullWidth
        >
          {t('inviteCoFunder.sendInvitation')}
        </PillButton>
      </View>
    </Screen>
  );
}
