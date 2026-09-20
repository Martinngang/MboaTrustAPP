import { useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, X, MessageSquareDashed, Users, Pencil } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { NewChatModal } from '../components/chat/NewChatModal';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useListBottomPadding } from '../hooks/useListBottomPadding';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useConversationsQuery, useStartConversationMutation, type Conversation, type BackendParticipant } from '../api/messaging';
import { useApp } from '../context/AppContext';
import type { MainStackParamList } from '../navigation/types';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translations';

type FilterTab = 'All' | 'Unread' | 'Groups';
const TABS: { id: FilterTab; labelKey: TranslationKey }[] = [
  { id: 'All', labelKey: 'messages.tabAll' },
  { id: 'Unread', labelKey: 'messages.tabUnread' },
  { id: 'Groups', labelKey: 'messages.tabGroups' },
];

function relativeTime(iso: string, t: (k: TranslationKey) => string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return t('common.now');
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return t('common.yesterday');
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function preview(convo: Conversation): string {
  if (!convo.lastMessage) return convo.context;
  if (convo.lastMessage.type === 'text') return convo.lastMessage.body || convo.context;
  return `📎 ${convo.lastMessage.type}`;
}

// Rewritten to match MboaTrustFrontend/src/screens/MessagingScreens.tsx's
// SidebarPanel exactly: All/Unread/Groups filters (the previous mobile
// version invented context-type tabs web doesn't have), a search box, and a
// "new conversation" entry point (web's pencil icon) that was entirely
// missing — there was no way to start a chat with someone from this screen.
export function MessagesScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user } = useApp();

  const [tab, setTab] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  const { data: conversations, isLoading } = useConversationsQuery(user?._id ?? null);
  const startMutation = useStartConversationMutation(user?._id ?? null);
  const pullToRefresh = usePullToRefresh();
  const bottomPadding = useListBottomPadding();

  const filtered = useMemo(() => {
    if (!conversations) return [];
    let list = conversations;
    if (tab === 'Unread') list = list.filter((c) => c.unreadCount > 0);
    else if (tab === 'Groups') list = list.filter((c) => c.isGroup);
    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter((c) => c.withName.toLowerCase().includes(q) || preview(c).toLowerCase().includes(q));
    return list;
  }, [conversations, tab, searchQuery]);

  const openConversation = (convo: Conversation) => {
    navigation.navigate('ChatThread', { conversationId: convo.id, title: convo.withName, subtitle: convo.context });
  };

  const startNewChat = async (picked: BackendParticipant) => {
    setShowNewChat(false);
    const conv = await startMutation.mutateAsync({ contextType: 'direct', participantIds: [picked._id] });
    if (conv.draft) {
      navigation.navigate('ChatThread', { draftUserId: picked._id, title: picked.fullName });
    } else {
      navigation.navigate('ChatThread', { conversationId: conv.id, title: conv.withName, subtitle: conv.context });
    }
  };

  return (
    <Screen
      scroll={false}
      contentContainerStyle={{ paddingBottom: 0 }}
      header={
        <Header
          title={t('messages.title')}
          subtitle={`${conversations?.length ?? 0} ${t('messages.subtitleCount')}`}
          action={
            <Pressable
              onPress={() => setShowNewChat(true)}
              accessibilityRole="button"
              accessibilityLabel={t('messages.newConversation')}
              style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center' }}
            >
              <Pencil size={16} color={colors.forest} />
            </Pressable>
          }
        />
      }
    >
      <FlatList
        data={filtered}
        keyExtractor={(conv) => conv.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
        refreshing={pullToRefresh.refreshing}
        onRefresh={pullToRefresh.onRefresh}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.parchmentDark,
                paddingHorizontal: 12,
                paddingVertical: 8,
                gap: 8,
              }}
            >
              <Search size={18} color={colors.inkSubtle} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('messages.searchPlaceholder')}
                placeholderTextColor={colors.inkSubtle}
                style={{ flex: 1, fontFamily: FONT.sans, color: colors.ink, fontSize: 13, padding: 0 }}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                  <X size={16} color={colors.inkSubtle} />
                </Pressable>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {TABS.map((tb) => {
                const active = tab === tb.id;
                return (
                  <Pressable
                    key={tb.id}
                    onPress={() => setTab(tb.id)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: active ? colors.forest : colors.surface,
                      borderWidth: active ? 0 : 1,
                      borderColor: colors.parchmentDark,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.mono, fontSize: 11, fontWeight: '700', color: active ? '#fff' : colors.inkMuted }}>{t(tb.labelKey)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color={colors.forest} />
            </View>
          ) : (
            <EmptyState
              icon={tab === 'Groups' ? Users : MessageSquareDashed}
              title={tab === 'Unread' ? t('messages.allCaughtUp') : tab === 'Groups' ? t('messages.noGroupChats') : t('messages.noConversationsYet')}
              description={tab === 'All' ? t('messages.tapPencilToStart') : t('messages.directDiscussionsWillAppear')}
            />
          )
        }
        renderItem={({ item: conv }) => (
          <Pressable onPress={() => openConversation(conv)} accessibilityRole="button">
            <Card style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={conv.withName} avatarUrl={conv.avatarUrl} isGroup={conv.isGroup} size={46} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 14, flexShrink: 1 }} numberOfLines={1}>
                      {conv.withName}
                    </Text>
                    {conv.isAdvisor && (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: colors.amber }}>
                        <Text style={{ fontFamily: FONT.mono, color: colors.forestDark, fontSize: 9, fontWeight: '700' }}>{t('chat.aiBadge')}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontFamily: FONT.mono, color: conv.unreadCount > 0 ? colors.forest : colors.inkSubtle, fontSize: 10 }}>
                    {relativeTime(conv.updatedAt, t)}
                  </Text>
                </View>

                <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, textTransform: 'uppercase' }} numberOfLines={1}>
                  {conv.context}
                </Text>

                <Text
                  style={{ fontFamily: FONT.sans, color: conv.unreadCount > 0 ? colors.ink : colors.inkMuted, fontSize: 12, fontWeight: conv.unreadCount > 0 ? '600' : '400' }}
                  numberOfLines={1}
                >
                  {preview(conv)}
                </Text>
              </View>

              {conv.unreadCount > 0 && (
                <View style={{ minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 10, fontWeight: '700' }}>
                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                  </Text>
                </View>
              )}
            </Card>
          </Pressable>
        )}
      />

      <NewChatModal visible={showNewChat} onClose={() => setShowNewChat(false)} onPick={startNewChat} />
    </Screen>
  );
}
