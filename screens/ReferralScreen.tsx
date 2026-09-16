import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Share, ActivityIndicator } from 'react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { fmt } from '../components/fmt';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useMyReferralsQuery, useCreateReferralMutation, type Referral } from '../api/referrals';
import { Users, Share2 } from 'lucide-react-native';
import { useTranslation } from '../i18n/useTranslation';

const REFERRAL_STATUS_MAP: Record<Referral['status'], string> = { invited: 'pending', joined: 'active', rewarded: 'approved' };

export function ReferralScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { data: referrals, isLoading } = useMyReferralsQuery();
  const createReferral = useCreateReferralMutation();

  // "My shareable link" = the most recent still-'invited' (unclaimed)
  // referral record — each one is single-use, so a fresh one is created
  // once the last is claimed.
  const shareable = (referrals || []).find((r) => r.status === 'invited');
  const createdRef = useRef(false);
  useEffect(() => {
    if (!isLoading && !shareable && !createdRef.current) {
      createdRef.current = true;
      createReferral.mutate();
    }
  }, [isLoading, shareable]);

  const rewardedCount = (referrals || []).filter((r) => r.status === 'rewarded').length;
  const totalRewards = (referrals || []).reduce((s, r) => s + (r.rewardAmount ?? 0), 0);
  const link = shareable ? `https://mboatrust.app/#/signup?ref=${shareable.id}` : '';
  const joinedReferrals = (referrals || []).filter((r) => r.status !== 'invited');

  const shareLink = async () => {
    if (!link) return;
    try {
      await Share.share({ message: `${t('referral.shareMessage')} ${link}` });
    } catch {
      // User cancelled the share sheet — nothing to do.
    }
  };

  return (
    <Screen header={<Header title={t('referral.title')} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Card style={{ padding: 18, backgroundColor: colors.forestDark, gap: 12, alignItems: 'center' }}>
          <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('referral.yourLink')}
          </Text>
          <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.85)', fontSize: 12, textAlign: 'center' }}>
            {link || t('referral.generating')}
          </Text>
          <Pressable
            onPress={shareLink}
            disabled={!link}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 4,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: 'rgba(255,255,255,0.14)',
              opacity: link ? 1 : 0.5,
            }}
          >
            <Share2 size={14} color="#fff" />
            <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>{t('referral.shareLink')}</Text>
          </Pressable>
        </Card>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Card style={{ flex: 1, padding: 14, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>{rewardedCount}</Text>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2, textAlign: 'center' }}>
              {t('referral.successfulReferrals')}
            </Text>
          </Card>
          <Card style={{ flex: 1, padding: 14, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 18 }}>{fmt(totalRewards)}</Text>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2, textAlign: 'center' }}>
              {t('referral.rewardsEarned')}
            </Text>
          </Card>
        </View>

        <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
          {t('referral.explainer')}
        </Text>

        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('referral.yourReferrals')}
          </Text>
          {isLoading ? (
            <ActivityIndicator color={colors.forest} style={{ marginTop: 10 }} />
          ) : joinedReferrals.length === 0 ? (
            <EmptyState icon={Users} title={t('referral.noReferralsYet')} description={t('referral.noOneJoinedYet')} />
          ) : (
            joinedReferrals.map((r) => (
              <Card key={r.id} style={{ padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                    {r.referredName ?? t('referral.newMember')}
                  </Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 2 }}>
                    {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {r.status === 'rewarded' && r.rewardAmount ? ` · +${fmt(r.rewardAmount)}` : ''}
                  </Text>
                </View>
                <StatusBadge status={REFERRAL_STATUS_MAP[r.status]} />
              </Card>
            ))
          )}
        </View>
      </View>
    </Screen>
  );
}
