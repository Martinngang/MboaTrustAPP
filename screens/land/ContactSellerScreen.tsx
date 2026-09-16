import { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CheckCircle2 } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Avatar } from '../../components/Avatar';
import { Stars } from '../../components/Stars';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { useLandListingDetailQuery } from '../../api/land';
import { useSendDirectMessageMutation } from '../../api/messaging';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'ContactSeller'>;

// Ported from MboaTrustFrontend/src/screens/LandScreens.tsx's
// ContactSellerScreen — the real part only: web's "tap to reveal number"
// button generates a random fake +237 number client-side on every tap
// (never a real one), so that piece isn't ported. The real, working part —
// POST /messages/direct via useSendDirectMessageMutation, the same
// find-or-create entry point every other "message this person" flow in the
// app uses — is what's actually missing on mobile and built here.
export function ContactSellerScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user } = useApp();
  const { show: showToast } = useToast();

  const { listingId } = route.params;
  const { data: land, isLoading } = useLandListingDetailQuery(listingId);
  const sendDirect = useSendDirectMessageMutation(user?._id ?? null);

  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const submit = async () => {
    if (!land?.sellerId) {
      showToast({ title: t('contactSeller.cannotMessage'), description: t('contactSeller.noSellerAccount'), tone: 'error' });
      return;
    }
    try {
      const { conversation } = await sendDirect.mutateAsync({
        recipientId: land.sellerId,
        contextType: 'land_listing',
        contextId: land.id,
        body: message.trim(),
      });
      setConversationId(conversation.id);
      setSent(true);
    } catch (err) {
      showToast({ title: t('contactSeller.failedToSend'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  if (isLoading || !land) {
    return (
      <Screen header={<Header title={t('contactSeller.title')} back />}>
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  if (sent) {
    return (
      <Screen header={<Header title={t('contactSeller.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.forest }}>
            <CheckCircle2 size={34} color="#fff" />
          </View>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 19, textAlign: 'center' }}>{t('contactSeller.messageSent')}</Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center' }}>
            {land.sellerName} {t('contactSeller.notifiedDesc')}
          </Text>
          {conversationId && (
            <PillButton onPress={() => navigation.navigate('ChatThread', { conversationId, title: land.sellerName })} fullWidth>
              {t('contactSeller.viewConversation')}
            </PillButton>
          )}
          <PillButton variant="secondary" onPress={() => navigation.navigate('LandListingDetail', { listingId: land.id })} fullWidth>
            {t('contactSeller.backToListing')}
          </PillButton>
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title={t('contactSeller.title')} subtitle={land.title} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Card style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar name={land.sellerName} size={48} />
          <View>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{land.sellerName}</Text>
            <Stars rating={land.sellerRating} />
          </View>
        </Card>

        <TextField
          label={t('contactSeller.sendMessageLabel')}
          placeholder={t('contactSeller.messagePlaceholder')}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: 'top' }}
        />

        <PillButton variant="primary" onPress={submit} loading={sendDirect.isPending} disabled={!message.trim() || sendDirect.isPending} fullWidth>
          {t('contactSeller.sendMessageButton')}
        </PillButton>
      </View>
    </Screen>
  );
}
