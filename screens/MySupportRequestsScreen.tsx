import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useSupportTicketsQuery, SUPPORT_TYPE_LABELS } from '../api/support';
import type { MainStackParamList } from '../navigation/types';

/** A user's own tickets — the backend already scopes non-admins to their
 * own submissions, so this is a plain list. */
export function MySupportRequestsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { data: tickets = [], isLoading } = useSupportTicketsQuery();

  return (
    <Screen header={<Header title="My support requests" subtitle="Track what you've reported" back />}>
      <View style={{ padding: 16, gap: 10 }}>
        {isLoading ? (
          <ActivityIndicator color={colors.forest} style={{ marginTop: 40 }} />
        ) : tickets.length === 0 ? (
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13, textAlign: 'center', paddingVertical: 40 }}>
            Nothing here yet — anything you report or ask will show up in this list.
          </Text>
        ) : (
          tickets.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => navigation.navigate('SupportRequestDetail', { ticketId: t.id })}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.parchmentDark,
                backgroundColor: colors.surface,
                padding: 14,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }} numberOfLines={1}>{t.subject}</Text>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 2, textTransform: 'uppercase' }}>
                  {SUPPORT_TYPE_LABELS[t.type]} · {new Date(t.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <StatusBadge status={t.status} />
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}
