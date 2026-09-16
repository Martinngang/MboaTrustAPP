import { ScrollView, Pressable, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';

/** Mirrors MboaTrustFrontend/src/components/Chip.tsx's ChipGroup — a
 * horizontally scrollable row of pill filters, one selected at a time.
 * Nothing on mobile had this as a shared component yet; screens like
 * MilestoneSubmitScreen hand-rolled similar pills inline. */
export function ChipGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: selected ? colors.forest : colors.parchmentDark,
              backgroundColor: selected ? colors.forest : colors.surface,
            }}
          >
            <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 12, color: selected ? '#fff' : colors.inkMuted }}>{opt}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
