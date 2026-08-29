import { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Search,
  X,
  MessageSquare,
  Building2,
  MapPin,
  Truck,
  Briefcase,
  ChevronRight,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useConversationsQuery, type Conversation } from '../api/messaging';
import type { MainStackParamList } from '../navigation/types';

const CONTEXT_TABS = ['All', 'Projects', 'Tenders', 'Land', 'Direct'] as const;

export function MessagesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const [activeTab, setActiveTab] = useState<(typeof CONTEXT_TABS)[number]>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: conversations, isLoading } = useConversationsQuery();

  const filteredConversations = (conversations || []).filter((c) => {
    if (activeTab === 'Projects' && c.contextType !== 'project') return false;
    if (activeTab === 'Tenders' && c.contextType !== 'bid') return false;
    if (activeTab === 'Land' && c.contextType !== 'land_listing') return false;
    if (activeTab === 'Direct' && c.contextType !== 'direct') return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.withName.toLowerCase().includes(q) ||
      c.lastMessageText.toLowerCase().includes(q)
    );
  });

  return (
    <Screen header={<Header title="Messages" subtitle={`${conversations?.length || 3} conversations`} />}>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Search Bar */}
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
            placeholder="Search conversations, project chats..."
            placeholderTextColor={colors.inkSubtle}
            style={{
              flex: 1,
              fontFamily: FONT.sans,
              color: colors.ink,
              fontSize: 13,
              padding: 0,
            }}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
              <X size={16} color={colors.inkSubtle} />
            </Pressable>
          ) : null}
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {CONTEXT_TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? colors.forest : colors.parchmentDark,
                  backgroundColor: active ? colors.forest + '15' : colors.surface,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT.sansMedium,
                    fontSize: 12,
                    color: active ? colors.forest : colors.inkMuted,
                  }}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Conversations List */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : filteredConversations.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages found"
            description="Direct project discussions and contractor inquiries will appear here."
          />
        ) : (
          filteredConversations.map((conv) => (
            <Pressable
              key={conv.id}
              onPress={() =>
                navigation.navigate('ChatThread', {
                  conversationId: conv.id,
                  title: conv.withName,
                  subtitle: conv.title,
                })
              }
              accessibilityRole="button"
            >
              <Card style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar name={conv.withName} avatarUrl={conv.avatarUrl} size={46} />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 14 }} numberOfLines={1}>
                      {conv.withName}
                    </Text>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>
                      {conv.lastMessageTime}
                    </Text>
                  </View>

                  <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, textTransform: 'uppercase' }} numberOfLines={1}>
                    {conv.title}
                  </Text>

                  <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }} numberOfLines={1}>
                    {conv.lastMessageText}
                  </Text>
                </View>

                {conv.unreadCount > 0 && (
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: colors.forest,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 10, fontWeight: '700' }}>
                      {conv.unreadCount}
                    </Text>
                  </View>
                )}
              </Card>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}
