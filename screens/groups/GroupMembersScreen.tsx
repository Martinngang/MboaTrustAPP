import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserPlus, Crown } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useMyGroupsQuery, useGroupDashboardQuery, useInviteGroupMemberMutation } from '../../api/groups';
import { useUserSearchQuery } from '../../api/users';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'GroupMembers'>;

export function GroupMembersScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { data: groups } = useMyGroupsQuery();
  const groupId = route.params?.groupId ?? (groups || [])[0]?.id;
  const { data: dashboard, isLoading } = useGroupDashboardQuery(groupId);
  const inviteMember = useInviteGroupMemberMutation();

  const [showInvite, setShowInvite] = useState(false);
  const [query, setQuery] = useState('');
  const { data: results = [], isFetching } = useUserSearchQuery(query);

  const groupMembers = dashboard?.members ?? [];

  const invite = async (userId: string) => {
    if (!groupId) return;
    try {
      await inviteMember.mutateAsync({ groupId, userId });
      setQuery('');
      setShowInvite(false);
      showToast({ title: t('groupMembers.memberAdded'), tone: 'success' });
    } catch (err) {
      showToast({ title: t('groupMembers.failedToAdd'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  if (!isLoading && !groupId) {
    return (
      <Screen header={<Header title={t('groupMembers.title')} back />}>
        <View style={{ padding: 16 }}>
          <EmptyState
            icon={UserPlus}
            title={t('groupDashboard.noGroupYet')}
            description={t('groupDashboard.noGroupDesc')}
            action={
              <PillButton onPress={() => navigation.navigate('GroupSetup')} fullWidth>
                {t('groupDashboard.createGroup')}
              </PillButton>
            }
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title={t('groupMembers.title')} subtitle={dashboard?.group.name} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {groupMembers.length} {groupMembers.length === 1 ? t('groupMembers.member') : t('groupMembers.membersCount')}
          </Text>
          <Pressable onPress={() => setShowInvite((s) => !s)}>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
              {showInvite ? t('groupMembers.cancel') : t('groupMembers.inviteMember')}
            </Text>
          </Pressable>
        </View>

        {showInvite && (
          <Card style={{ padding: 16, gap: 10 }}>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
              {t('groupMembers.mustHaveAccount')}
            </Text>
            <TextField placeholder="e.g. Marie-Claire" value={query} onChangeText={setQuery} autoCapitalize="words" returnKeyType="search" />
            {query.trim().length >= 2 && (
              <View style={{ gap: 8 }}>
                {isFetching ? (
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>{t('groupMembers.searching')}</Text>
                ) : results.length === 0 ? (
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
                    {t('groupMembers.noMatchingAccount')}
                  </Text>
                ) : (
                  results
                    .filter((u) => !groupMembers.some((m) => m.userId === u.id))
                    .map((u) => (
                      <Pressable
                        key={u.id}
                        onPress={() => invite(u.id)}
                        disabled={inviteMember.isPending}
                        style={{
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: colors.parchmentDark,
                          padding: 12,
                          opacity: inviteMember.isPending ? 0.5 : 1,
                        }}
                      >
                        <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{u.fullName}</Text>
                        {(u.phoneNumber || u.email || u.roles.length > 0) && (
                          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 2 }}>
                            {u.phoneNumber || u.email || u.roles.join(', ')}
                          </Text>
                        )}
                      </Pressable>
                    ))
                )}
              </View>
            )}
          </Card>
        )}

        {isLoading ? (
          <ActivityIndicator color={colors.forest} style={{ marginTop: 20 }} />
        ) : (
          <View style={{ gap: 8 }}>
            {groupMembers.map((m) => (
              <Card key={m.id} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar name={m.name} avatarUrl={m.avatarUrl} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{m.name}</Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 1 }}>{t('groupDashboard.joined')} {m.joinedAt}</Text>
                </View>
                {m.role === 'owner' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.amber + '25', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Crown size={11} color={colors.forestDark} />
                    <Text style={{ fontFamily: FONT.mono, color: colors.forestDark, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>
                      {t('groupMembers.owner')}
                    </Text>
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
