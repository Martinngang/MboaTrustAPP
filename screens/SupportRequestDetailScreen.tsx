import { useState } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { PillButton } from '../components/PillButton';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { apiErrorMessage } from '../api/client';
import { useSupportTicketQuery, useAddSupportTicketResponseMutation, SUPPORT_TYPE_LABELS } from '../api/support';
import type { MainStackParamList } from '../navigation/types';

type RouteProps = RouteProp<MainStackParamList, 'SupportRequestDetail'>;

export function SupportRequestDetailScreen() {
  const { colors } = useTheme();
  const { show: showToast } = useToast();
  const route = useRoute<RouteProps>();
  const { ticketId } = route.params;
  const { data: ticket, isLoading } = useSupportTicketQuery(ticketId);
  const respondMutation = useAddSupportTicketResponseMutation();
  const [reply, setReply] = useState('');

  const submitReply = async () => {
    if (!reply.trim()) return;
    try {
      await respondMutation.mutateAsync({ ticketId, message: reply.trim() });
      setReply('');
    } catch (err) {
      showToast({ title: 'Could not send reply', description: apiErrorMessage(err, 'Please try again'), tone: 'error' });
    }
  };

  if (isLoading || !ticket) {
    return (
      <Screen header={<Header title="Support request" back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title={ticket.subject} subtitle="Support request" back />}>
      <View style={{ padding: 16, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <StatusBadge status={ticket.status} />
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            {SUPPORT_TYPE_LABELS[ticket.type]}
          </Text>
        </View>

        <Card style={{ padding: 14, gap: 6 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>Description</Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 13, lineHeight: 19 }}>{ticket.description}</Text>
        </Card>

        {ticket.attachments.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ticket.attachments.map((att, i) => (
              <Image key={i} source={{ uri: att.url }} style={{ width: 90, height: 90, borderRadius: 12 }} resizeMode="cover" />
            ))}
          </View>
        )}

        <View style={{ gap: 10 }}>
          {ticket.responses.map((r) => (
            <Card key={r.id} style={{ padding: 12, backgroundColor: r.isAdmin ? colors.forest + '10' : colors.parchment }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase', marginBottom: 4 }}>
                {r.isAdmin ? 'Mboa Trust Support' : r.authorName}
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 13 }}>{r.message}</Text>
            </Card>
          ))}
        </View>

        <View style={{ gap: 10 }}>
          <TextField placeholder="Write a follow-up…" value={reply} onChangeText={setReply} />
          <PillButton variant="primary" onPress={submitReply} loading={respondMutation.isPending} disabled={respondMutation.isPending || !reply.trim()} fullWidth>
            Send
          </PillButton>
        </View>
      </View>
    </Screen>
  );
}
