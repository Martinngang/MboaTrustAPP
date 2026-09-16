import { View, Text, Image } from 'react-native';
import { Users } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';

// Ported from MboaTrustFrontend/src/components/MobileLayout.tsx's UserAvatar —
// initials-circle fallback when there's no avatarUrl. `isGroup` mirrors
// MessagingScreens.tsx's Avatar, which swaps the initial for a Users glyph
// on group conversations since there's no single "name" to initialize from.
export function Avatar({
  name,
  avatarUrl,
  size = 32,
  isGroup,
}: {
  name?: string;
  avatarUrl?: string | null;
  size?: number;
  isGroup?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.forest,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} />
      ) : isGroup ? (
        <Users size={size * 0.45} color="#fff" />
      ) : (
        <Text style={{ color: '#fff', fontFamily: FONT.serifBold, fontSize: size * 0.42 }}>
          {name ? name[0]?.toUpperCase() : 'M'}
        </Text>
      )}
    </View>
  );
}
