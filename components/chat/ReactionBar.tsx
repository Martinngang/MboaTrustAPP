import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

// Ported from MboaTrustFrontend/src/screens/MessagingScreens.tsx's
// ReactionPicker — the 6-emoji quick-react row shown above a bubble.
export function ReactionBar({ onSelect }: { onSelect: (emoji: string) => void }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 18,
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
      }}
    >
      {COMMON_EMOJIS.map((e) => (
        <Pressable key={e} onPress={() => onSelect(e)} accessibilityRole="button" style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>{e}</Text>
        </Pressable>
      ))}
    </View>
  );
}
