import { useMemo, useState } from 'react';
import { View, Text, Pressable, Image, Linking } from 'react-native';
import { CheckCheck, Check, SmilePlus, MoreHorizontal, Pencil, Trash2, FileText, Download } from 'lucide-react-native';
import { Avatar } from '../Avatar';
import { AudioMessagePlayer } from './AudioMessagePlayer';
import { VideoMessagePlayer } from './VideoMessagePlayer';
import { ReactionBar } from './ReactionBar';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import type { ChatMessage } from '../../api/messaging';

function formatBytes(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Ported from MboaTrustFrontend/src/screens/MessagingScreens.tsx's
// MessageBubble — same attachment rendering (image/video/audio/file),
// reactions, edited/deleted state, and per-message action row. Web reveals
// the react/edit/delete actions on hover; there's no hover on a touchscreen,
// so a long-press toggles the same row here instead.
export function MessageBubble({
  msg,
  isMe,
  isFirst,
  isLast,
  inGroup,
  onOpenLightbox,
  onStartEdit,
  onDelete,
  onReact,
}: {
  msg: ChatMessage;
  isMe: boolean;
  isFirst: boolean;
  isLast: boolean;
  inGroup: boolean;
  onOpenLightbox: (url: string) => void;
  onStartEdit: (msg: ChatMessage) => void;
  onDelete: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
}) {
  const { colors } = useTheme();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const reactionGroups = useMemo(() => {
    const map = new Map<string, number>();
    msg.reactions.forEach((r) => map.set(r.emoji, (map.get(r.emoji) ?? 0) + 1));
    return [...map.entries()];
  }, [msg.reactions]);

  const bubbleRadius = {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: !isMe && isLast ? 5 : 16,
    borderBottomRightRadius: isMe && isLast ? 5 : 16,
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: isFirst ? 10 : 3, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
      {!isMe && inGroup && (
        <View style={{ width: 26 }}>{isLast ? <Avatar name={msg.senderName} avatarUrl={msg.senderAvatar} size={26} /> : null}</View>
      )}

      <View style={{ maxWidth: '80%' }}>
        {!isMe && inGroup && isFirst && msg.senderName ? (
          <Text style={{ fontFamily: FONT.mono, color: colors.amber, fontSize: 10, marginBottom: 2, marginLeft: 4 }}>{msg.senderName}</Text>
        ) : null}

        <Pressable
          onLongPress={() => !msg.isDeleted && setShowActions((v) => !v)}
          delayLongPress={280}
          style={[
            bubbleRadius,
            {
              backgroundColor: msg.isDeleted ? colors.parchmentDark : isMe ? colors.forestDark : colors.surface,
              borderWidth: isMe || msg.isDeleted ? 0 : 1,
              borderColor: colors.parchmentDark,
              paddingHorizontal: 12,
              paddingVertical: 9,
              gap: 6,
            },
          ]}
        >
          {msg.isDeleted ? (
            <Text style={{ fontFamily: FONT.sans, fontStyle: 'italic', color: colors.inkMuted, fontSize: 12 }}>This message was deleted</Text>
          ) : (
            <>
              {msg.attachments.map((att, idx) => (
                <View key={idx}>
                  {att.type === 'image' ? (
                    <Pressable onPress={() => onOpenLightbox(att.url)} accessibilityRole="button">
                      <Image source={{ uri: att.url }} style={{ width: 210, height: 140, borderRadius: 10, backgroundColor: colors.parchment }} resizeMode="cover" />
                    </Pressable>
                  ) : att.type === 'video' ? (
                    <VideoMessagePlayer url={att.url} />
                  ) : att.type === 'audio' ? (
                    <AudioMessagePlayer url={att.url} isMe={isMe} />
                  ) : (
                    <Pressable
                      onPress={() => Linking.openURL(att.url)}
                      accessibilityRole="button"
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        padding: 10,
                        borderRadius: 10,
                        backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : colors.parchment,
                        minWidth: 180,
                      }}
                    >
                      <FileText size={16} color={isMe ? '#fff' : colors.ink} />
                      <Text style={{ flex: 1, fontFamily: FONT.sansMedium, color: isMe ? '#fff' : colors.ink, fontSize: 11 }} numberOfLines={1}>
                        {att.fileName || 'Document'}
                      </Text>
                      <Download size={13} color={isMe ? 'rgba(255,255,255,0.8)' : colors.inkMuted} />
                    </Pressable>
                  )}
                  {att.type === 'file' && att.sizeBytes ? (
                    <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: isMe ? 'rgba(255,255,255,0.7)' : colors.inkMuted, marginTop: 2 }}>
                      {formatBytes(att.sizeBytes)}
                    </Text>
                  ) : null}
                </View>
              ))}

              {msg.text ? (
                <Text style={{ fontFamily: FONT.sans, color: isMe ? '#fff' : colors.ink, fontSize: 13, lineHeight: 18 }}>{msg.text}</Text>
              ) : null}

              {msg.isEdited && (
                <Text style={{ fontFamily: FONT.sans, fontStyle: 'italic', fontSize: 9, color: isMe ? 'rgba(255,255,255,0.6)' : colors.inkSubtle }}>
                  edited
                </Text>
              )}
            </>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' }}>
            <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: isMe ? 'rgba(255,255,255,0.8)' : colors.inkSubtle }}>{msg.timestamp}</Text>
            {isMe && !msg.isDeleted && (msg.read ? <CheckCheck size={11} color="rgba(255,255,255,0.85)" /> : <Check size={11} color="rgba(255,255,255,0.6)" />)}
          </View>
        </Pressable>

        {reactionGroups.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
            {reactionGroups.map(([emoji, count]) => (
              <View key={emoji} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: colors.parchment, borderWidth: 1, borderColor: colors.parchmentDark }}>
                <Text style={{ fontSize: 11 }}>
                  {emoji} {count > 1 ? count : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {showActions && !msg.isDeleted && (
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
            <Pressable
              onPress={() => {
                setShowReactions((v) => !v);
                setShowMenu(false);
              }}
              accessibilityRole="button"
              style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.parchmentDark }}
            >
              <SmilePlus size={13} color={colors.inkMuted} />
            </Pressable>
            {isMe && (
              <Pressable
                onPress={() => {
                  setShowMenu((v) => !v);
                  setShowReactions(false);
                }}
                accessibilityRole="button"
                style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.parchmentDark }}
              >
                <MoreHorizontal size={13} color={colors.inkMuted} />
              </Pressable>
            )}
          </View>
        )}

        {showReactions && (
          <View style={{ marginTop: 6, alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
            <ReactionBar
              onSelect={(emoji) => {
                onReact(msg.id, emoji);
                setShowReactions(false);
                setShowActions(false);
              }}
            />
          </View>
        )}

        {showMenu && isMe && (
          <View style={{ marginTop: 6, alignSelf: 'flex-end', borderRadius: 14, backgroundColor: colors.surface, overflow: 'hidden', borderWidth: 1, borderColor: colors.parchmentDark }}>
            <Pressable
              onPress={() => {
                onStartEdit(msg);
                setShowMenu(false);
                setShowActions(false);
              }}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 }}
            >
              <Pencil size={13} color={colors.inkMuted} />
              <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12 }}>Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onDelete(msg.id);
                setShowMenu(false);
                setShowActions(false);
              }}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 }}
            >
              <Trash2 size={13} color={colors.seal} />
              <Text style={{ fontFamily: FONT.sans, color: colors.seal, fontSize: 12 }}>Delete</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
