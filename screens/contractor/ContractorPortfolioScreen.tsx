import { View, Text, Image, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShieldCheck } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Avatar } from '../../components/Avatar';
import { StatusBadge } from '../../components/StatusBadge';
import { Stars } from '../../components/Stars';
import { PillButton } from '../../components/PillButton';
import { EmptyState } from '../../components/EmptyState';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { useContractorPortfolioQuery, useContractorCompletedWorkQuery } from '../../api/contractors';
import { useCertificationsForUserQuery } from '../../api/contracts';
import { useRatingsQuery } from '../../api/ratings';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'ContractorPortfolio'>;

// Ported from MboaTrustFrontend/src/screens/ContractorPortfolioScreens.tsx's
// ContractorPortfolioScreen — the public-facing profile a funder sees when
// evaluating a contractor, and what the contractor sees as "how funders see
// me" from their own account (same screen, isSelf just adds an Edit button).
export function ContractorPortfolioScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user } = useApp();

  const { userId } = route.params;
  const isSelf = user?._id === userId;

  const { data: portfolio, isLoading } = useContractorPortfolioQuery(userId);
  const { data: completedWork = [] } = useContractorCompletedWorkQuery(userId);
  const { data: certifications = [] } = useCertificationsForUserQuery(userId);
  const { data: reviews = [] } = useRatingsQuery({ toUserId: userId, roleContext: 'contractor' });

  if (isLoading || !portfolio) {
    return (
      <Screen header={<Header title={t('contractorPortfolio.title')} back />}>
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  const verifiedCertCount = certifications.filter((c) => c.verified).length;

  return (
    <Screen header={<Header title={t('contractorPortfolio.title')} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Card style={{ padding: 18, backgroundColor: colors.forest, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar name={portfolio.fullName} avatarUrl={portfolio.avatarUrl} size={58} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 18 }} numberOfLines={1}>
                  {portfolio.fullName}
                </Text>
                {portfolio.kycStatus === 'verified' && <ShieldCheck size={15} color="#fff" />}
              </View>
              {portfolio.headline ? (
                <Text style={{ fontFamily: FONT.sans, color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 }} numberOfLines={2}>
                  {portfolio.headline}
                </Text>
              ) : null}
              <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase', marginTop: 3 }}>
                {portfolio.categories[0] ?? t('contractorPortfolio.generalContracting')}{portfolio.regions[0] ? ` · ${portfolio.regions[0]}` : ''}
              </Text>
            </View>
          </View>
        </Card>

        {isSelf && (
          <PillButton variant="primary" onPress={() => navigation.navigate('EditContractorPortfolio')} fullWidth>
            {t('contractorPortfolio.editPortfolio')}
          </PillButton>
        )}

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { label: t('contractorPortfolio.statCompleted'), value: String(portfolio.stats.completedProjects) },
            { label: t('contractorPortfolio.statRating'), value: portfolio.stats.ratingCount > 0 ? (portfolio.stats.avgRating ?? 0).toFixed(1) : '—' },
            { label: t('contractorPortfolio.statYearsExp'), value: String(portfolio.yearsExperience) },
            { label: t('contractorPortfolio.statCompletion'), value: `${Math.round(portfolio.stats.completionRate * 100)}%` },
          ].map((s) => (
            <Card key={s.label} style={{ flex: 1, padding: 10, alignItems: 'center', gap: 2 }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15 }}>{s.value}</Text>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase' }}>{s.label}</Text>
            </Card>
          ))}
        </View>

        {portfolio.bio ? (
          <Card style={{ padding: 14, gap: 6 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('contractorPortfolio.about')}</Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, lineHeight: 19 }}>{portfolio.bio}</Text>
          </Card>
        ) : null}

        {portfolio.categories.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('contractorPortfolio.skillsAndTrades')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {portfolio.categories.map((c) => (
                <View key={c} style={{ backgroundColor: colors.parchment, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 }}>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {portfolio.services.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('contractorPortfolio.servicesOffered')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {portfolio.services.map((s) => (
                <View key={s} style={{ borderWidth: 1, borderColor: colors.parchmentDark, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 }}>
                  <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12 }}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('contractorPortfolio.portfolio')}</Text>
          {portfolio.portfolioImages.length === 0 ? (
            <Card style={{ padding: 14, alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13 }}>{t('contractorPortfolio.noPortfolioImages')}</Text>
            </Card>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {portfolio.portfolioImages.map((img) => (
                <View key={img._id ?? img.url} style={{ width: '31.5%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.parchmentDark }}>
                  <Image source={{ uri: img.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('contractorPortfolio.certifications')}{verifiedCertCount > 0 ? ` (${verifiedCertCount} ${t('contractorPortfolio.verified')})` : ''}
          </Text>
          {certifications.length === 0 ? (
            <Card style={{ padding: 14, alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13 }}>{t('contractorPortfolio.noCertifications')}</Text>
            </Card>
          ) : (
            certifications.map((c) => (
              <Card key={c.id} style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>{c.title}</Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>{c.issuer}</Text>
                </View>
                <StatusBadge status={c.verified ? 'verified' : c.rejected ? 'rejected' : 'pending'} />
              </Card>
            ))
          )}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('contractorPortfolio.completedWork')}</Text>
          {completedWork.length === 0 ? (
            <Card style={{ padding: 14, alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13 }}>{t('contractorPortfolio.noCompletedWork')}</Text>
            </Card>
          ) : (
            completedWork.map((w) => (
              <Card key={w.id} style={{ padding: 12 }}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>{w.projectTitle}</Text>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', marginTop: 2 }}>
                  {w.category}{w.location ? ` · ${w.location}` : ''} · {new Date(w.completedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </Text>
              </Card>
            ))
          )}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('contractorPortfolio.clientReviews')}</Text>
          {reviews.length === 0 ? (
            <Card style={{ padding: 14, alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13 }}>{t('contractorPortfolio.noReviews')}</Text>
            </Card>
          ) : (
            reviews.map((r) => (
              <Card key={r.id} style={{ padding: 14, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>{r.fromName}</Text>
                  <Stars rating={r.score} />
                </View>
                {r.comment ? (
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, fontStyle: 'italic', lineHeight: 17 }}>"{r.comment}"</Text>
                ) : null}
              </Card>
            ))
          )}
        </View>
      </View>
    </Screen>
  );
}
