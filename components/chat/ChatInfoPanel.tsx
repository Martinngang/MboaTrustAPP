import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, Animated, Dimensions, Linking } from 'react-native';
import { X, Bell, BellOff, Shield, Image as ImageIcon, Film, Music, FileText, Download } from 'lucide-react-native';
import { Avatar } from '../Avatar';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import type { BackendAttachment, ChatMessage, Conversation } from '../../api/messaging';

function formatBytes(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Ported from MboaTrustFrontend/src/screens/MessagingScreens.tsx's
// InfoPanel — same Overview (participants, mute toggle, escrow notice) and
// Media & Files tabs, as a slide-over Modal instead of a CSS-positioned div.
export function ChatInfoPanel({
  visible,
  conversation,
  messages,
  onClose,
}: {
  visible: boolean;
  conversation: Conversation;
  messages?: ChatMessage[];
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { user } = useApp();
  const [tab, setTab] = useState<'info' | 'media'>('info');
  const [isMuted, setIsMuted] = useState(false);
  const width = Dimensions.get('window').width;
  const translateX = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : width,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const mediaFiles = useMemo(() => {
    if (!messages) return [] as (BackendAttachment & { sentAt: string })[];
    return messages.flatMap((m) => m.attachments.map((att) => ({ ...att, sentAt: m.rawSentAt })));
  }, [messages]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={onClose} />
        <Animated.View
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: Math.min(360, width * 0.88),
            backgroundColor: colors.cream,
            transform: [{ translateX }],
            borderLeftWidth: 1,
            borderLeftColor: colors.parchmentDark,
          }}
        >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 18,
            paddingTop: 54,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.parchmentDark,
          }}
        >
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 16 }}>Details</Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={15} color={colors.inkMuted} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.parchmentDark, paddingHorizontal: 12 }}>
          {(['info', 'media'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              accessibilityRole="tab"
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                borderBottomWidth: 2,
                borderBottomColor: tab === t ? colors.forest : 'transparent',
              }}
            >
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, fontWeight: '700', color: tab === t ? colors.forest : colors.inkMuted }}>
                {t === 'info' ? 'Overview' : `Media & Files (${mediaFiles.length})`}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ padding: 18, gap: 20 }}>
          {tab === 'info' ? (
            <>
              <View style={{ alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.parchmentDark, gap: 6 }}>
                <Avatar name={conversation.withName} avatarUrl={conversation.avatarUrl} isGroup={conversation.isGroup} size={76} />
                <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 17 }}>{conversation.withName}</Text>
                <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: colors.parchment }}>
                  <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10 }}>{conversation.context}</Text>
                </View>
              </View>

              {conversation.participantIds.length > 0 && (
                <View style={{ gap: 10 }}>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Participants ({conversation.participantIds.length})
                  </Text>
                  {conversation.participantIds.map((p) => {
                    const isMe = String(p._id) === String(user?._id);
                    return (
                      <View
                        key={p._id}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, backgroundColor: colors.parchment }}
                      >
                        <Avatar name={p.fullName} avatarUrl={p.avatarUrl} size={34} />
                        <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>
                          {p.fullName}
                          {isMe ? <Text style={{ color: colors.forest, fontFamily: FONT.mono, fontSize: 11 }}> (You)</Text> : null}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              <Pressable
                onPress={() => setIsMuted((v) => !v)}
                accessibilityRole="button"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: colors.parchment,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {isMuted ? <BellOff size={16} color={colors.inkMuted} /> : <Bell size={16} color={colors.forest} />}
                  <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>Mute notifications</Text>
                </View>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkMuted, fontSize: 11 }}>{isMuted ? 'Muted' : 'Off'}</Text>
              </Pressable>

              <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.parchmentDark, backgroundColor: colors.parchment }}>
                <Shield size={18} color={colors.forest} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 12 }}>MboaTrust Escrow Protection</Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, marginTop: 2, lineHeight: 15 }}>
                    Messages in this conversation are logged and protected for milestone dispute evidence.
                  </Text>
                </View>
              </View>
            </>
          ) : mediaFiles.length === 0 ? (
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, textAlign: 'center', paddingVertical: 30 }}>
              No shared media or files yet.
            </Text>
          ) : (
            mediaFiles.map((f, idx) => {
              const Icon = f.type === 'image' ? ImageIcon : f.type === 'video' ? Film : f.type === 'audio' ? Music : FileText;
              return (
                <Pressable
                  key={idx}
                  onPress={() => Linking.openURL(f.url)}
                  accessibilityRole="button"
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.parchmentDark, backgroundColor: colors.parchment }}
                >
                  <Icon size={18} color={f.type === 'video' ? colors.amber : colors.forest} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 12 }} numberOfLines={1}>
                      {f.fileName || 'Attachment'}
                    </Text>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkMuted, fontSize: 10 }}>{formatBytes(f.sizeBytes)}</Text>
                  </View>
                  <Download size={15} color={colors.inkMuted} />
                </Pressable>
              );
            })
          )}
        </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
