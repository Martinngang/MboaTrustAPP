import { View, Text, Pressable } from 'react-native';
import { PartyPopper, ChevronRight } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useTranslation } from '../../i18n/useTranslation';

export interface AttentionItem {
  icon: LucideIcon;
  label: string;
  sub?: string;
  onPress: () => void;
}

// Ported from MboaTrustFrontend/src/components/dashboard/NeedsAttentionWidget.tsx —
// role-agnostic list widget; each Home screen supplies its own
// role-appropriate items (pending milestone reviews, active bids, pending
// offers, etc.) so the widget itself stays generic and reusable.
export function NeedsAttentionWidget({ items }: { items: AttentionItem[] }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 18, gap: 8 }}>
        <PartyPopper size={26} color={colors.forest} />
        <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>{t('home.caughtUp')}</Text>
        <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11, textAlign: 'center' }}>
          {t('home.caughtUpDesc')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <Pressable
            key={i}
            onPress={it.onPress}
            accessibilityRole="button"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 9,
              paddingHorizontal: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.parchmentDark,
            }}
          >
            <Icon size={16} color={colors.forest} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 12.5 }} numberOfLines={1}>
                {it.label}
              </Text>
              {it.sub ? (
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }} numberOfLines={1}>
                  {it.sub}
                </Text>
              ) : null}
            </View>
            <ChevronRight size={14} color={colors.inkSubtle} />
          </Pressable>
        );
      })}
    </View>
  );
}
