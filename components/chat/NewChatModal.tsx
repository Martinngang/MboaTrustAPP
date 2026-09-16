import { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { Avatar } from '../Avatar';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useSearchUsersQuery, type BackendParticipant } from '../../api/messaging';

// Ported from MboaTrustFrontend/src/screens/MessagingScreens.tsx's
// NewChatModal — search-users-and-start-chat, reachable from the Messages
// list's "new conversation" header action (web's pencil icon).
export function NewChatModal({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (user: BackendParticipant) => void }) {
  const { colors } = useTheme();
  const [q, setQ] = useState('');
  const { data: users = [], isLoading } = useSearchUsersQuery(q);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          top: '22%',
          borderRadius: 24,
          backgroundColor: colors.cream,
          maxHeight: '56%',
          overflow: 'hidden',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, paddingBottom: 10 }}>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 17 }}>New Message</Text>
          <Pressable onPress={onClose} accessibilityRole="button" style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color={colors.inkMuted} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 18, paddingBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.parchment, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Search size={16} color={colors.inkSubtle} />
            <TextInput
              autoFocus
              value={q}
              onChangeText={setQ}
              placeholder="Search users by name…"
              placeholderTextColor={colors.inkSubtle}
              style={{ flex: 1, fontFamily: FONT.sans, color: colors.ink, fontSize: 13 }}
            />
          </View>
        </View>

        <FlatList
          data={users}
          keyExtractor={(u) => u._id}
          style={{ paddingHorizontal: 10 }}
          contentContainerStyle={{ paddingBottom: 12 }}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator color={colors.forest} style={{ marginVertical: 20 }} />
            ) : q.length > 1 ? (
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, textAlign: 'center', paddingVertical: 20 }}>No users found</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPick(item)}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 14 }}
            >
              <Avatar name={item.fullName} avatarUrl={item.avatarUrl} size={36} />
              <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>{item.fullName}</Text>
            </Pressable>
          )}
        />
      </View>
      </View>
    </Modal>
  );
}
