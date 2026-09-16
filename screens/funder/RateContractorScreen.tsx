import { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Star, CheckCircle2 } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Avatar } from '../../components/Avatar';
import { PillButton } from '../../components/PillButton';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useBidsQuery } from '../../api/tenders';
import { useCreateRatingMutation } from '../../api/ratings';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'RateContractor'>;

export function RateContractorScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { jobId } = route.params;
  const { data: bids, isLoading } = useBidsQuery({ projectId: jobId });
  const acceptedBid = (bids || []).find((b) => b.status === 'accepted');
  const createRating = useCreateRatingMutation();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!acceptedBid) return;
    try {
      await createRating.mutateAsync({
        toUserId: acceptedBid.contractorId,
        projectId: jobId,
        score: rating,
        comment: comment.trim(),
        roleContext: 'contractor',
      });
      setSubmitted(true);
    } catch (err) {
      showToast({ title: t('rateContractor.failedToSubmit'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  if (isLoading) {
    return (
      <Screen header={<Header title={t('rateContractor.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  if (!acceptedBid) {
    return (
      <Screen header={<Header title={t('rateContractor.title')} back />}>
        <View style={{ padding: 16 }}>
          <EmptyState icon={Star} title={t('rateContractor.noAwardedContractor')} description={t('rateContractor.noAwardedDesc')} />
        </View>
      </Screen>
    );
  }

  if (submitted) {
    return (
      <Screen header={<Header title={t('rateContractor.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={32} color={colors.forestDark} />
          </View>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20, textAlign: 'center' }}>
            {t('rateContractor.thankYou')}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
            {t('rateContractor.visibleOnProfile')} {acceptedBid.contractorName}{t('rateContractor.profileHelps')}
          </Text>
          <PillButton onPress={() => navigation.goBack()} fullWidth>
            {t('rateContractor.done')}
          </PillButton>
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title={t('rateContractor.title')} back />}>
      <View style={{ padding: 16, gap: 24 }}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Avatar name={acceptedBid.contractorName} size={64} />
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
            {acceptedBid.contractorName}
          </Text>
        </View>

        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('rateContractor.yourRating')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Pressable key={i} onPress={() => setRating(i)} hitSlop={6}>
                <Star size={32} color={colors.amber} fill={rating >= i ? colors.amber : 'transparent'} />
              </Pressable>
            ))}
          </View>
          {rating > 0 && (
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13 }}>
              {rating >= 4 ? t('rateContractor.excellent') : rating >= 3 ? t('rateContractor.good') : t('rateContractor.needsImprovement')}
            </Text>
          )}
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('rateContractor.yourReviewOptional')}
          </Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            placeholder={t('rateContractor.reviewPlaceholder')}
            placeholderTextColor={colors.inkSubtle}
            style={{
              backgroundColor: colors.parchment,
              borderRadius: 14,
              padding: 14,
              fontFamily: FONT.sans,
              color: colors.ink,
              fontSize: 13,
              minHeight: 100,
              textAlignVertical: 'top',
            }}
          />
        </View>

        <PillButton
          variant="primary"
          onPress={submit}
          loading={createRating.isPending}
          disabled={rating === 0 || createRating.isPending}
          fullWidth
        >
          {t('rateContractor.submitRating')}
        </PillButton>
      </View>
    </Screen>
  );
}
