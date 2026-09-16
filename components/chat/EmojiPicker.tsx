import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';

const EMOJI_CATEGORIES = [
  { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'] },
  { name: 'Gestures', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '💪'] },
  { name: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '✨', '🌟', '💫', '💥', '💯', '✅', '❌'] },
  { name: 'Trust', emojis: ['🏠', '🏗️', '🔑', '🛠️', '📐', '📋', '📁', '📄', '📜', '⚖️', '💰', '💳', '💎', '🔒', '🔓', '🛡️', '📞', '📱', '💻', '✉️', '📦', '🎁', '🏆', '🎯', '📍', '🗺️', '🔔', '🚀'] },
];

// Ported from MboaTrustFrontend/src/screens/MessagingScreens.tsx's
// EmojiPicker popover — categorized grid with search, opened above the
// composer bar instead of anchored to a DOM button.
export function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState(0);

  const emojis = useMemo(() => {
    if (!search.trim()) return EMOJI_CATEGORIES[activeCat].emojis;
    return EMOJI_CATEGORIES.flatMap((c) => c.emojis);
  }, [search, activeCat]);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.parchmentDark,
        maxHeight: 260,
        padding: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search emojis…"
          placeholderTextColor={colors.inkSubtle}
          style={{
            flex: 1,
            backgroundColor: colors.parchment,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 6,
            fontFamily: FONT.sans,
            color: colors.ink,
            fontSize: 12,
          }}
        />
        <Pressable onPress={onClose} accessibilityRole="button" style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center' }}>
          <X size={13} color={colors.inkMuted} />
        </Pressable>
      </View>

      {!search && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 8 }}>
          {EMOJI_CATEGORIES.map((cat, i) => (
            <Pressable
              key={cat.name}
              onPress={() => setActiveCat(i)}
              accessibilityRole="button"
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                backgroundColor: activeCat === i ? colors.forest : colors.parchment,
              }}
            >
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: activeCat === i ? '#fff' : colors.inkMuted }}>{cat.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {emojis.map((emoji, idx) => (
          <Pressable
            key={idx}
            onPress={() => onSelect(emoji)}
            accessibilityRole="button"
            style={{ width: '14.28%', alignItems: 'center', paddingVertical: 6 }}
          >
            <Text style={{ fontSize: 22 }}>{emoji}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
