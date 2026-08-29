import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';

// Ported from MboaTrustFrontend/src/components/EmptyState.tsx. Takes a lucide
// icon component directly rather than reproducing web's string-keyed AppIcon
// registry — same visual result, one fewer indirection layer on mobile.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 16, borderRadius: 24, paddingVertical: 56, paddingHorizontal: 24, backgroundColor: colors.parchment }}>
      <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={26} color={colors.forest} />
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 17 }}>{title}</Text>
        {description && (
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13, marginTop: 6, textAlign: 'center', maxWidth: 260 }}>
            {description}
          </Text>
        )}
      </View>
      {action}
    </View>
  );
}
