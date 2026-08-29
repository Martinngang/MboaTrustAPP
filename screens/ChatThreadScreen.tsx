import { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Send,
  Camera,
  Image as ImageIcon,
  Check,
  CheckCheck,
  ShieldCheck,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Avatar } from '../components/Avatar';
import { useToast } from '../components/Toast';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useMessagesQuery, useSendMessageMutation, type ChatMessage } from '../api/messaging';
import type { MainStackParamList } from '../navigation/types';

type RouteProps = RouteProp<MainStackParamList, 'ChatThread'>;

export function ChatThreadScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();
  const { show: showToast } = useToast();

  const { conversationId, title, subtitle } = route.params;

  const { data: messages, isLoading } = useMessagesQuery(conversationId);
  const sendMutation = useSendMessageMutation();

  const [inputMessage, setInputMessage] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!inputMessage.trim() && !selectedPhoto) return;

    const textToSend = inputMessage.trim();
    const photoToSend = selectedPhoto || undefined;

    setInputMessage('');
    setSelectedPhoto(null);

    try {
      await sendMutation.mutateAsync({
        conversationId,
        text: textToSend,
        imageUrl: photoToSend,
      });
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (err: any) {
      showToast({ title: 'Message Error', description: err?.message || 'Could not send message.', tone: 'error' });
    }
  };

  const handleAttachPhoto = () => {
    setSelectedPhoto('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=400&fit=crop');
  };

  return (
    <Screen header={<Header title={title} subtitle={subtitle} back />}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 20 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {/* Escrow Chat Notice */}
          <View
            style={{
              backgroundColor: colors.forest + '12',
              borderRadius: 12,
              padding: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              alignSelf: 'center',
              marginBottom: 8,
            }}
          >
            <ShieldCheck size={16} color={colors.forest} />
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11 }}>
              Official project record · Escrow protected conversation
            </Text>
          </View>

          {/* Messages */}
          {isLoading ? (
            <ActivityIndicator color={colors.forest} style={{ marginTop: 20 }} />
          ) : (
            (messages || []).map((msg) => {
              const isMe = msg.from === 'me';
              return (
                <View
                  key={msg.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    gap: 4,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: isMe ? colors.forestDark : colors.surface,
                      borderRadius: 16,
                      borderTopRightRadius: isMe ? 4 : 16,
                      borderTopLeftRadius: !isMe ? 4 : 16,
                      padding: 12,
                      borderWidth: isMe ? 0 : 1,
                      borderColor: colors.parchmentDark,
                      gap: 8,
                    }}
                  >
                    {msg.imageUrl && (
                      <Image
                        source={{ uri: msg.imageUrl }}
                        style={{ width: 220, height: 140, borderRadius: 10, backgroundColor: colors.parchment }}
                        resizeMode="cover"
                      />
                    )}
                    {msg.text ? (
                      <Text
                        style={{
                          fontFamily: FONT.sans,
                          color: isMe ? '#fff' : colors.ink,
                          fontSize: 13,
                          lineHeight: 18,
                        }}
                      >
                        {msg.text}
                      </Text>
                    ) : null}
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>
                      {msg.timestamp}
                    </Text>
                    {isMe && <CheckCheck size={12} color={colors.forest} />}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Selected photo preview in input bar */}
        {selectedPhoto && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Image source={{ uri: selectedPhoto }} style={{ width: 44, height: 44, borderRadius: 8 }} />
            <Pressable onPress={() => setSelectedPhoto(null)} hitSlop={6}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>Remove</Text>
            </Pressable>
          </View>
        )}

        {/* Bottom Message Input Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.parchmentDark,
            paddingHorizontal: 12,
            paddingVertical: 10,
            paddingBottom: Math.max(10, insets.bottom),
            gap: 8,
          }}
        >
          <Pressable onPress={handleAttachPhoto} hitSlop={8}>
            <Camera size={22} color={colors.inkSubtle} />
          </Pressable>

          <TextInput
            placeholder="Type your message..."
            placeholderTextColor={colors.inkSubtle}
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
            style={{
              flex: 1,
              backgroundColor: colors.parchment,
              borderRadius: 18,
              paddingHorizontal: 14,
              paddingVertical: 8,
              fontFamily: FONT.sans,
              color: colors.ink,
              fontSize: 13,
              maxHeight: 90,
            }}
          />

          <Pressable
            onPress={handleSend}
            disabled={!inputMessage.trim() && !selectedPhoto}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: inputMessage.trim() || selectedPhoto ? colors.forest : colors.parchmentDark,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={16} color={inputMessage.trim() || selectedPhoto ? '#fff' : colors.inkSubtle} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
