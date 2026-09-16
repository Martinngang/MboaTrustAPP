import { View, Text, Share, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Handshake } from 'lucide-react-native';
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
import { useProjectQuery } from '../../api/projects';
import { usePooledContributionsQuery } from '../../api/pooledFunding';
import { useApp } from '../../context/AppContext';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';
import type { TranslationKey } from '../../i18n/translations';

function frequencyLabel(days: number | null, t: (k: TranslationKey) => string): string {
  if (days === 7) return t('pooledFunding.week');
  if (days === 30) return t('pooledFunding.month');
  if (days === 90) return t('pooledFunding.quarter');
  return `${days ?? '?'} ${t('pooledFunding.days')}`;
}

type RouteProps = RouteProp<MainStackParamList, 'PooledFunding'>;

export function PooledFundingScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user } = useApp();

  const { projectId } = route.params;
  const { data: project, isLoading: projectLoading } = useProjectQuery(projectId);
  const { data: list, isLoading: listLoading } = usePooledContributionsQuery({ projectId });

  if (projectLoading) {
    return (
      <Screen header={<Header title={t('pooledFunding.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  if (!project) {
    return (
      <Screen header={<Header title={t('pooledFunding.title')} back />}>
        <View style={{ padding: 16 }}>
          <EmptyState icon={Handshake} title={t('pooledFunding.projectNotFound')} description={t('pooledFunding.projectNotFoundDesc')} />
        </View>
      </Screen>
    );
  }

  const pct = project.totalAmount > 0 ? Math.round((project.raised / project.totalAmount) * 100) : 0;
  const shareLink = `https://mboatrust.app/#/funder/project/${project.id}`;
  const contributors = list || [];

  const shareLinkAction = async () => {
    try {
      await Share.share({ message: `${t('pooledFunding.helpFundMessage')} "${project.title}" ${t('pooledFunding.onMboaTrust')} ${shareLink}` });
    } catch {
      // User cancelled — nothing to do.
    }
  };

  return (
    <Screen header={<Header title={t('pooledFunding.title')} subtitle={project.title} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Card style={{ padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20 }}>{fmt(project.raised)}</Text>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                {t('pooledFunding.raisedOf')} {fmt(project.totalAmount)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 20 }}>{pct}%</Text>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>{t('pooledFunding.funded')}</Text>
            </View>
          </View>
          <View style={{ height: 8, backgroundColor: colors.parchmentDark, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${Math.min(100, pct)}%`, backgroundColor: colors.forest }} />
          </View>
        </Card>

        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('pooledFunding.contributors')} ({contributors.length})
          </Text>
          {listLoading ? (
            <ActivityIndicator color={colors.forest} />
          ) : contributors.length === 0 ? (
            <EmptyState icon={Handshake} title={t('pooledFunding.noContributorsYet')} description={t('pooledFunding.beFirstOrInvite')} />
          ) : (
            contributors.map((c) => {
              const share = project.totalAmount > 0 ? Math.round((c.amount / project.totalAmount) * 100) : 0;
              const isYou = c.contributorId === user?._id;
              return (
                <Card key={c.id} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar name={c.contributorName} size={36} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }} numberOfLines={1}>
                        {c.contributorName}{isYou ? ` ${t('pooledFunding.you')}` : ''}
                      </Text>
                      <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 13 }}>{fmt(c.amount)}</Text>
                    </View>
                    {c.status === 'collected' ? (
                      <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, marginTop: 2 }}>
                        {share}% {t('pooledFunding.ofGoal')} · {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {c.isRecurring ? ` · ${t('pooledFunding.every')} ${frequencyLabel(c.recurrenceIntervalDays, t)}` : ''}
                      </Text>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <StatusBadge status={c.status} />
                        <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9 }}>
                          {c.status === 'pending' ? t('pooledFunding.invitedNotYetPaid') : new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })
          )}
        </View>

        <Card style={{ padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('pooledFunding.shareToGrow')}
          </Text>
          <Text style={{ fontFamily: FONT.mono, color: colors.ink, fontSize: 11 }}>{shareLink}</Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11 }}>
            {t('pooledFunding.anyoneWithLink')}
          </Text>
          <PillButton variant="secondary" onPress={shareLinkAction} fullWidth>
            {t('pooledFunding.shareLink')}
          </PillButton>
        </Card>

        <PillButton variant="primary" onPress={() => navigation.navigate('InviteCoFunder', { projectId: project.id })} fullWidth>
          {t('pooledFunding.inviteCoFunder')}
        </PillButton>
      </View>
    </Screen>
  );
}
