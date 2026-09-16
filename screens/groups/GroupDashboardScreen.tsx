import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Users, ArrowRight } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { Avatar } from '../../components/Avatar';
import { PillButton } from '../../components/PillButton';
import { EmptyState } from '../../components/EmptyState';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useMyGroupsQuery, useGroupDashboardQuery } from '../../api/groups';
import { useProjectQuery } from '../../api/projects';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'GroupDashboard'>;

export function GroupDashboardScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const { data: groups, isLoading: isLoadingGroups } = useMyGroupsQuery();
  const groupId = route.params?.groupId ?? (groups || [])[0]?.id;
  const { data: dashboard, isLoading } = useGroupDashboardQuery(groupId);
  const { data: linkedProject } = useProjectQuery(dashboard?.group.linkedProjectId ?? undefined);

  if (!isLoadingGroups && !groupId) {
    return (
      <Screen header={<Header title={t('groupDashboard.title')} back />}>
        <View style={{ padding: 16 }}>
          <EmptyState
            icon={Users}
            title={t('groupDashboard.noGroupYet')}
            description={t('groupDashboard.noGroupDesc')}
            action={
              <View style={{ gap: 10, alignItems: 'center' }}>
                <PillButton onPress={() => navigation.navigate('GroupSetup')} fullWidth>
                  {t('groupDashboard.createGroup')}
                </PillButton>
                <Pressable onPress={() => navigation.navigate('JoinGroup', undefined)}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
                    {t('groupDashboard.haveGroupId')}
                  </Text>
                </Pressable>
              </View>
            }
          />
        </View>
      </Screen>
    );
  }

  if (isLoading || !dashboard) {
    return (
      <Screen header={<Header title={t('groupDashboard.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  const { group, members, fundingSummary, contributionsByMember } = dashboard;
  const contributionByUserId = new Map(contributionsByMember.map((c) => [c.userId, c.total]));

  return (
    <Screen header={<Header title={t('groupDashboard.title')} subtitle={group.name} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Card style={{ padding: 18, backgroundColor: colors.forestDark, gap: 10 }}>
          {group.purpose ? (
            <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              {group.purpose}
            </Text>
          ) : null}
          {group.description ? (
            <Text style={{ fontFamily: FONT.sans, color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 17 }}>
              {group.description}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 28, marginTop: 4 }}>
            <View>
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 22 }}>{fmt(fundingSummary?.raised ?? 0)}</Text>
              <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.6)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
                {t('groupDashboard.fundedTogether')}
              </Text>
            </View>
            <View>
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 22 }}>{members.length}</Text>
              <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.6)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
                {t('groupDashboard.members')}
              </Text>
            </View>
          </View>
        </Card>

        <Pressable onPress={() => navigation.navigate('GroupMembers', { groupId: group.id })}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>{t('groupDashboard.manageMembers')}</Text>
        </Pressable>

        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('groupDashboard.perMemberContribution')}
          </Text>
          {members.map((member) => (
            <Card key={member.id} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={member.name} avatarUrl={member.avatarUrl} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }} numberOfLines={1}>
                  {member.name}
                </Text>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 1 }}>{t('groupDashboard.joined')} {member.joinedAt}</Text>
              </View>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 14 }}>
                {fmt(contributionByUserId.get(member.userId) ?? 0)}
              </Text>
            </Card>
          ))}
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('groupDashboard.projectGroupFunding')}
          </Text>
          {!linkedProject ? (
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>{t('groupDashboard.noProjectLinked')}</Text>
          ) : (
            <Pressable onPress={() => navigation.navigate('ProjectDetail', { projectId: linkedProject.id })}>
              <Card style={{ padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }} numberOfLines={1}>
                    {linkedProject.title}
                  </Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 1 }}>{linkedProject.locationName}</Text>
                </View>
                <StatusBadge status={linkedProject.status} />
              </Card>
            </Pressable>
          )}
        </View>
      </View>
    </Screen>
  );
}
