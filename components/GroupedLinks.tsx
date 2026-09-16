import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';

export interface GroupedLinkItem {
  label: string;
  sub?: string;
  onPress: () => void;
  icon?: LucideIcon;
  right?: React.ReactNode;
}

// Ported from MboaTrustFrontend/src/screens/SharedScreens.tsx's GroupedLinks —
// the one visual pattern web uses for every "list of destinations" block on
// Settings and the Menu hub. `tone="danger"` matches web's irreversible-action
// styling (e.g. Delete account).
export function GroupedLinks({
  title,
  items,
  dashed = false,
  tone = 'default',
}: {
  title?: string;
  items: GroupedLinkItem[];
  dashed?: boolean;
  tone?: 'default' | 'danger';
}) {
  const { colors } = useTheme();
  const isDanger = tone === 'danger';
  const borderColor = isDanger ? colors.seal + '40' : colors.parchmentDark;

  return (
    <View>
      {title ? (
        <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
          {title}
        </Text>
      ) : null}
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderStyle: dashed ? 'dashed' : 'solid',
          borderColor,
          overflow: 'hidden',
        }}
      >
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              accessibilityRole="button"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                backgroundColor: colors.surface,
                borderBottomWidth: i < items.length - 1 ? 1 : 0,
                borderBottomColor: borderColor,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                {Icon ? (
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDanger ? colors.seal + '18' : colors.parchment,
                    }}
                  >
                    <Icon size={16} color={isDanger ? colors.seal : colors.forest} />
                  </View>
                ) : null}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: FONT.sansMedium, color: isDanger ? colors.seal : colors.ink, fontSize: 13 }} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {item.sub ? (
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 2 }} numberOfLines={1}>
                      {item.sub}
                    </Text>
                  ) : null}
                </View>
              </View>
              {item.right ?? <ChevronRight size={16} color={isDanger ? colors.seal : colors.inkSubtle} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
