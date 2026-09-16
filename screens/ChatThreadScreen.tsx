import { useCallback, useEffect, useRef, useState } from 'react';
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
  Paperclip,
  SmilePlus,
  Mic,
  Trash2,
  Check,
  X,
  Phone,
  Video,
  Info,
  MessageSquareDashed,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Avatar } from '../components/Avatar';
import { useToast } from '../components/Toast';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { MessageBubble } from '../components/chat/MessageBubble';
import { CallModal } from '../components/chat/CallModal';
import { ChatInfoPanel } from '../components/chat/ChatInfoPanel';
import { EmojiPicker } from '../components/chat/EmojiPicker';
import { Lightbox } from '../components/chat/Lightbox';
import { AttachmentSheet } from '../components/chat/AttachmentSheet';
import {
  useConversationsQuery,
  useSingleConversationQuery,
  useConversationMessagesQuery,
  useConversationRealtime,
  useSendMessageMutation,
  useSendDirectMessageMutation,
  useDirectConversationQuery,
  useUserProfileQuery,
  useReactToMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
  type BackendAttachment,
  type Conversation,
  type ChatMessage,
} from '../api/messaging';
import { uploadChatAttachment } from '../api/messagingUpload';
import { apiErrorMessage, api } from '../api/client';
import { getSocket } from '../api/socket';
import { useApp } from '../context/AppContext';
import type { MainStackParamList } from '../navigation/types';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translations';

type RouteProps = RouteProp<MainStackParamList, 'ChatThread'>;

function dayLabel(iso: string, t: (k: TranslationKey) => string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return t('common.today');
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return t('common.yesterday');
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

// Full rewrite ported from MboaTrustFrontend/src/screens/MessagingScreens.tsx's
// ChatPane — the previous mobile version only had text + a single photo
// attachment. This brings across every real feature web has: phone/video
// call simulation, conversation info panel, voice notes (MediaRecorder on
// web → expo-audio here), image/video/audio/file attachments, emoji picker,
// reactions, edit/delete, typing indicators, read receipts, and date
// dividers — plus the "message this person" draft-conversation flow that
// used to only exist via useSendDirectMessageMutation with no thread view.
export function ChatThreadScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();
  const { show: showToast } = useToast();
  const { user } = useApp();
  const selfId = user?._id ?? null;

  const { conversationId: routeConversationId, draftUserId, draftContextType, draftContextId, title, subtitle } = route.params;
  const [conversationId, setConversationId] = useState<string | undefined>(routeConversationId);
  const draftMode = !conversationId && Boolean(draftUserId);

  const { data: conversations } = useConversationsQuery(selfId);
  const listConversation = !draftMode ? conversations?.find((c) => c.id === conversationId) : undefined;
  const { data: singleConversation } = useSingleConversationQuery(
    !draftMode && !listConversation ? conversationId : undefined,
    selfId
  );
  const { data: draftProfile } = useUserProfileQuery(draftMode ? draftUserId : undefined);
  const { data: resolvedExisting } = useDirectConversationQuery(draftMode ? draftUserId : undefined, selfId);

  useEffect(() => {
    if (resolvedExisting) setConversationId(resolvedExisting.id);
  }, [resolvedExisting]);

  const draftConversation: Conversation | undefined =
    draftMode && draftProfile
      ? {
          id: '',
          draft: true,
          withName: draftProfile.fullName || title,
          withRole: 'user',
          context: 'Direct',
          avatarInitial: (draftProfile.fullName?.[0] || '?').toUpperCase(),
          avatarUrl: draftProfile.avatarUrl || undefined,
          unreadCount: 0,
          isGroup: false,
          updatedAt: new Date().toISOString(),
          participantIds: [],
        }
      : undefined;

  const conversation = listConversation || singleConversation || draftConversation;

  const { data: messages, isLoading } = useConversationMessagesQuery(draftMode ? undefined : conversationId, selfId);
  const sendMutation = useSendMessageMutation(selfId);
  const sendDirectMutation = useSendDirectMessageMutation(selfId);
  const reactMutation = useReactToMessageMutation(conversationId ?? '', selfId);
  const editMutation = useEditMessageMutation(conversationId ?? '', selfId);
  const deleteMutation = useDeleteMessageMutation(conversationId ?? '', selfId);
  const isSending = draftMode ? sendDirectMutation.isPending : sendMutation.isPending;
  const { typingUsers } = useConversationRealtime(draftMode ? undefined : conversationId, selfId);

  const [inputMessage, setInputMessage] = useState('');
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<BackendAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
  const [callMode, setCallMode] = useState<'audio' | 'video' | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);

  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!conversationId || draftMode) return;
    api.post(`/conversations/${conversationId}/read`).catch(() => {});
  }, [conversationId, draftMode]);

  const emitTyping = useCallback(() => {
    if (!conversationId || draftMode) return;
    const socket = getSocket();
    socket.emit('typing:start', { conversationId, fullName: user?.fullName });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId, fullName: user?.fullName });
    }, 2500);
  }, [conversationId, draftMode, user?.fullName]);

  const send = async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed && !pendingAttachment) return;

    if (!draftMode && conversationId) {
      getSocket().emit('typing:stop', { conversationId, fullName: user?.fullName });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }

    if (editingMsg) {
      try {
        await editMutation.mutateAsync({ messageId: editingMsg.id, body: trimmed });
      } catch (err) {
        showToast({ title: t('chat.editFailed'), description: apiErrorMessage(err, t('chat.couldNotEditMessage')), tone: 'error' });
      }
      setEditingMsg(null);
      setInputMessage('');
      return;
    }

    const attachments = pendingAttachment ? [pendingAttachment] : undefined;
    setInputMessage('');
    setPendingAttachment(null);

    try {
      if (draftMode) {
        const { conversation: newConv } = await sendDirectMutation.mutateAsync({
          recipientId: draftUserId!,
          contextType: draftContextType,
          contextId: draftContextId,
          body: trimmed,
          attachments,
        });
        setConversationId(newConv.id);
      } else if (conversationId) {
        await sendMutation.mutateAsync({ conversationId, body: trimmed, attachments });
      }
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      showToast({ title: t('chat.messageError'), description: apiErrorMessage(err, t('chat.couldNotSendMessage')), tone: 'error' });
    }
  };

  const startEdit = (msg: ChatMessage) => {
    setEditingMsg(msg);
    setInputMessage(msg.text);
  };

  const handleReact = (messageId: string, emoji: string) => {
    reactMutation.mutate({ messageId, emoji });
  };

  const handleDelete = (messageId: string) => {
    deleteMutation.mutate(messageId);
  };

  const uploadAndAttach = async (file: { uri: string; fileName?: string | null; mimeType?: string | null }) => {
    setIsUploading(true);
    try {
      const uploaded = await uploadChatAttachment(file);
      setPendingAttachment(uploaded);
    } catch (err) {
      showToast({ title: t('chat.uploadFailed'), description: apiErrorMessage(err, t('chat.couldNotUploadAttachment')), tone: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast({ title: t('chat.permissionRequired'), description: t('chat.mediaLibraryAccess'), tone: 'error' });
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.85 });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    await uploadAndAttach({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType });
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    await uploadAndAttach({ uri: asset.uri, fileName: asset.name, mimeType: asset.mimeType });
  };

  const startRecording = async () => {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) {
      showToast({ title: t('chat.permissionRequired'), description: t('chat.microphoneAccess'), tone: 'error' });
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const cancelRecording = async () => {
    if (recorderState.isRecording) await recorder.stop();
  };

  const stopAndSendRecording = async () => {
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) return;
    setIsUploading(true);
    try {
      const uploaded = await uploadChatAttachment({ uri, fileName: `voice_note_${Date.now()}.m4a`, mimeType: 'audio/m4a' });
      if (draftMode) {
        const { conversation: newConv } = await sendDirectMutation.mutateAsync({
          recipientId: draftUserId!,
          contextType: draftContextType,
          contextId: draftContextId,
          body: '',
          attachments: [uploaded],
        });
        setConversationId(newConv.id);
      } else if (conversationId) {
        await sendMutation.mutateAsync({ conversationId, body: '', attachments: [uploaded] });
      }
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      showToast({ title: t('chat.voiceNoteFailed'), description: apiErrorMessage(err, t('chat.couldNotSendVoiceNote')), tone: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const groups: { label: string; msgs: ChatMessage[] }[] = [];
  (messages || []).forEach((m) => {
    const label = dayLabel(m.rawSentAt, t);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.msgs.push(m);
    else groups.push({ label, msgs: [m] });
  });

  const headerSubtitle = typingUsers.length > 0 ? `${typingUsers.join(', ')} ${typingUsers.length === 1 ? t('chat.isTyping') : t('chat.areTyping')}` : conversation?.context ?? subtitle;

  return (
    <Screen
      header={
        <Header
          title={conversation?.withName ?? title}
          subtitle={headerSubtitle}
          back
          action={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Pressable
                onPress={() => setCallMode('audio')}
                accessibilityRole="button"
                accessibilityLabel={t('chat.startVoiceCall')}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center' }}
              >
                <Phone size={15} color={colors.forest} />
              </Pressable>
              <Pressable
                onPress={() => setCallMode('video')}
                accessibilityRole="button"
                accessibilityLabel={t('chat.startVideoCall')}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center' }}
              >
                <Video size={15} color={colors.forest} />
              </Pressable>
              <Pressable
                onPress={() => setShowInfo(true)}
                accessibilityRole="button"
                accessibilityLabel={t('chat.conversationDetails')}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center' }}
              >
                <Info size={15} color={colors.inkMuted} />
              </Pressable>
            </View>
          }
        />
      }
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.forest} style={{ marginTop: 20 }} />
          ) : groups.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 50, gap: 8 }}>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquareDashed size={22} color={colors.inkSubtle} />
              </View>
              <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>{t('chat.noMessagesYet')}</Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>{t('chat.sayHelloToStart')}</Text>
            </View>
          ) : (
            groups.map((group) => (
              <View key={group.label}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.parchmentDark }} />
                  <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1 }}>{group.label}</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.parchmentDark }} />
                </View>
                {group.msgs.map((m, i) => {
                  const isMe = m.from === 'me';
                  const isFirst = i === 0 || group.msgs[i - 1].from !== m.from;
                  const isLast = i === group.msgs.length - 1 || group.msgs[i + 1].from !== m.from;
                  return (
                    <MessageBubble
                      key={m.id}
                      msg={m}
                      isMe={isMe}
                      isFirst={isFirst}
                      isLast={isLast}
                      inGroup={Boolean(conversation?.isGroup)}
                      onOpenLightbox={setLightboxUrl}
                      onStartEdit={startEdit}
                      onDelete={handleDelete}
                      onReact={handleReact}
                    />
                  );
                })}
              </View>
            ))
          )}
          {typingUsers.length > 0 && (
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11, fontStyle: 'italic', marginTop: 8 }}>
              {`${typingUsers.join(', ')} ${typingUsers.length === 1 ? t('chat.isTyping') : t('chat.areTyping')}`}
            </Text>
          )}
        </ScrollView>

        {pendingAttachment && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {pendingAttachment.type === 'image' ? (
              <Image source={{ uri: pendingAttachment.url }} style={{ width: 40, height: 40, borderRadius: 8 }} />
            ) : (
              <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center' }}>
                <Paperclip size={16} color={colors.forest} />
              </View>
            )}
            <Text style={{ flex: 1, fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11 }} numberOfLines={1}>
              {pendingAttachment.fileName || t('chat.attachmentReady')}
            </Text>
            <Pressable onPress={() => setPendingAttachment(null)} hitSlop={6} accessibilityRole="button">
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>{t('common.remove')}</Text>
            </Pressable>
          </View>
        )}

        {editingMsg && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 9, textTransform: 'uppercase' }}>{t('chat.editingLabel')}</Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11 }} numberOfLines={1}>{editingMsg.text}</Text>
            </View>
            <Pressable
              onPress={() => {
                setEditingMsg(null);
                setInputMessage('');
              }}
              accessibilityRole="button"
              style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.parchmentDark, alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={12} color={colors.inkMuted} />
            </Pressable>
          </View>
        )}

        {showEmojiPicker && (
          <EmojiPicker
            onSelect={(e) => setInputMessage((prev) => prev + e)}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}

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
            gap: 6,
          }}
        >
          {recorderState.isRecording ? (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.parchment, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.seal }} />
              <Text style={{ fontFamily: FONT.mono, color: colors.ink, fontSize: 12, fontWeight: '700' }}>
                {Math.floor((recorderState.durationMillis || 0) / 1000 / 60)}:
                {String(Math.floor(((recorderState.durationMillis || 0) / 1000) % 60)).padStart(2, '0')}
              </Text>
              <View style={{ flex: 1 }} />
              <Pressable onPress={cancelRecording} accessibilityRole="button" hitSlop={6}>
                <Trash2 size={16} color={colors.seal} />
              </Pressable>
              <Pressable
                onPress={stopAndSendRecording}
                accessibilityRole="button"
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}
              >
                <Send size={14} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <>
              <Pressable onPress={() => setShowAttachmentSheet(true)} disabled={isUploading} hitSlop={8} accessibilityRole="button">
                {isUploading ? <ActivityIndicator size="small" color={colors.inkSubtle} /> : <Paperclip size={20} color={colors.inkSubtle} />}
              </Pressable>

              <Pressable onPress={() => setShowEmojiPicker((v) => !v)} hitSlop={8} accessibilityRole="button">
                <SmilePlus size={20} color={showEmojiPicker ? colors.forest : colors.inkSubtle} />
              </Pressable>

              <TextInput
                placeholder={editingMsg ? t('chat.editMessagePlaceholder') : t('chat.typeMessagePlaceholder')}
                placeholderTextColor={colors.inkSubtle}
                value={inputMessage}
                onChangeText={(v) => {
                  setInputMessage(v);
                  emitTyping();
                }}
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

              {inputMessage.trim() || pendingAttachment ? (
                <Pressable
                  onPress={send}
                  disabled={isSending || isUploading}
                  accessibilityRole="button"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: editingMsg ? colors.amber : colors.forest,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isSending || isUploading ? 0.6 : 1,
                  }}
                >
                  {editingMsg ? <Check size={16} color="#fff" /> : <Send size={16} color="#fff" />}
                </Pressable>
              ) : (
                <Pressable
                  onPress={startRecording}
                  accessibilityRole="button"
                  style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Mic size={20} color={colors.forest} />
                </Pressable>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      <AttachmentSheet visible={showAttachmentSheet} onClose={() => setShowAttachmentSheet(false)} onPickMedia={pickMedia} onPickDocument={pickDocument} />

      {conversation && (
        <CallModal
          visible={Boolean(callMode)}
          name={conversation.withName}
          avatarUrl={conversation.avatarUrl}
          isGroup={conversation.isGroup}
          mode={callMode || 'audio'}
          onClose={() => setCallMode(null)}
        />
      )}

      {conversation && <ChatInfoPanel visible={showInfo} conversation={conversation} messages={messages} onClose={() => setShowInfo(false)} />}

      <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </Screen>
  );
}
