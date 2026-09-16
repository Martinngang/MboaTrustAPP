import { View, Text, TextInput, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { fmt } from './fmt';
import { useTranslation } from '../i18n/useTranslation';

export interface DraftScheduleMilestone { id: number; title: string; amount: string; description: string }

/** Evenly splits `budget` across `count` rows, the last row absorbing the
 * rounding remainder — a starting point every caller lets the user
 * hand-edit afterward rather than the only option. */
export function evenSplitAmounts(budget: number, count: number): number[] {
  if (count <= 0) return [];
  const per = Math.round(budget / count);
  return Array.from({ length: count }, (_, i) => (i === count - 1 ? budget - per * (count - 1) : per));
}

export function makeDefaultSchedule(count = 3): DraftScheduleMilestone[] {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1, title: `Milestone ${i + 1}`, amount: '', description: '' }));
}

export function scheduleTotal(ms: DraftScheduleMilestone[]): number {
  return ms.reduce((s, m) => s + (Number(m.amount) || 0), 0);
}

export function scheduleRowsValid(ms: DraftScheduleMilestone[]): boolean {
  return ms.length > 0 && ms.every((m) => m.title.trim() !== '' && Number(m.amount) > 0);
}

// Ported from MboaTrustFrontend/src/components/MilestoneScheduleEditor.tsx —
// shared row-editable payment-schedule builder (title + optional work
// description + amount per row, a Milestones/Weekly framing toggle,
// add/remove, one-tap even rebalance, running total-vs-target check).
// Mobile previously had no equivalent anywhere: PostJobScreen hardcoded
// `milestoneCount: 3` with no way to customize milestones, and
// SubmitBidScreen/NegotiationScreen had no milestone-schedule option on a
// proposal/counter-offer at all, even though the underlying mutations
// already accept one.
export function MilestoneScheduleEditor({
  milestones, onChange, budget, weekly, onWeeklyChange,
}: {
  milestones: DraftScheduleMilestone[];
  onChange: (ms: DraftScheduleMilestone[]) => void;
  budget: number;
  weekly: boolean;
  onWeeklyChange: (weekly: boolean) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const scheduleLabel = (i: number) => (weekly ? `${t('milestoneSchedule.week')} ${i + 1}` : `${t('milestoneSchedule.milestone')} ${i + 1}`);
  const isAutoLabel = (title: string) => /^(Milestone|Week) \d+$/.test(title.trim());

  const setWeeklyMode = (next: boolean) => {
    onWeeklyChange(next);
    onChange(milestones.map((m, i) => (isAutoLabel(m.title) ? { ...m, title: next ? `Week ${i + 1}` : `Milestone ${i + 1}` } : m)));
  };

  const addRow = () => {
    const amounts = evenSplitAmounts(budget, milestones.length + 1);
    onChange([...milestones, { id: Date.now(), title: scheduleLabel(milestones.length), amount: '', description: '' }].map((m, i) => ({ ...m, amount: String(amounts[i]) })));
  };
  const removeRow = (id: number) => {
    if (milestones.length <= 1) return;
    const remaining = milestones.filter((m) => m.id !== id);
    const amounts = evenSplitAmounts(budget, remaining.length);
    onChange(remaining.map((m, i) => ({ ...m, amount: String(amounts[i]) })));
  };
  const updateRow = (id: number, field: 'title' | 'amount' | 'description', value: string) => {
    onChange(milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };
  const rebalance = () => {
    const amounts = evenSplitAmounts(budget, milestones.length);
    onChange(milestones.map((m, i) => ({ ...m, amount: String(amounts[i]) })));
  };

  const total = scheduleTotal(milestones);

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          {t('milestoneSchedule.paymentSchedule')}
        </Text>
        <View style={{ flexDirection: 'row', borderRadius: 999, borderWidth: 1, borderColor: colors.parchmentDark, padding: 2 }}>
          {(['milestones', 'weekly'] as const).map((mode) => {
            const active = (mode === 'weekly') === weekly;
            return (
              <Pressable
                key={mode}
                onPress={() => setWeeklyMode(mode === 'weekly')}
                style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: active ? colors.forest : 'transparent' }}
              >
                <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: active ? '#fff' : colors.inkMuted }}>
                  {mode === 'weekly' ? t('milestoneSchedule.weekly') : t('milestoneSchedule.milestones')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, marginBottom: 12, lineHeight: 17 }}>
        {weekly ? t('milestoneSchedule.weeklyDesc') : t('milestoneSchedule.milestonesDesc')}
      </Text>

      <View style={{ gap: 8 }}>
        {milestones.map((m, i) => (
          <View key={m.id} style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.parchmentDark, backgroundColor: colors.surface, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
              </View>
              {milestones.length > 1 && (
                <Pressable onPress={() => removeRow(m.id)}>
                  <Text style={{ fontFamily: FONT.mono, color: colors.seal, fontSize: 11 }}>{t('milestoneSchedule.remove')}</Text>
                </Pressable>
              )}
            </View>
            <TextInput
              value={m.title}
              onChangeText={(v) => updateRow(m.id, 'title', v)}
              placeholder={scheduleLabel(i)}
              placeholderTextColor={colors.inkSubtle}
              style={{ borderWidth: 1, borderColor: colors.parchmentDark, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontFamily: FONT.sans, color: colors.ink, fontSize: 13, marginBottom: 8 }}
            />
            <TextInput
              value={m.description}
              onChangeText={(v) => updateRow(m.id, 'description', v)}
              placeholder={t('milestoneSchedule.whatWorkPlaceholder')}
              placeholderTextColor={colors.inkSubtle}
              style={{ borderWidth: 1, borderColor: colors.parchmentDark, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontFamily: FONT.sans, color: colors.ink, fontSize: 13, marginBottom: 8 }}
            />
            <TextInput
              value={m.amount}
              onChangeText={(v) => updateRow(m.id, 'amount', v.replace(/[^0-9]/g, ''))}
              placeholder={t('milestoneSchedule.amountPlaceholder')}
              placeholderTextColor={colors.inkSubtle}
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: colors.parchmentDark, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontFamily: FONT.sans, color: colors.ink, fontSize: 13 }}
            />
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Pressable
          onPress={addRow}
          style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.forest, alignItems: 'center' }}
        >
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>
            + {weekly ? t('milestoneSchedule.addWeek') : t('milestoneSchedule.addMilestone')}
          </Text>
        </Pressable>
        <Pressable
          onPress={rebalance}
          disabled={!budget}
          style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.parchmentDark, alignItems: 'center', opacity: budget ? 1 : 0.4 }}
        >
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.inkMuted, fontSize: 13 }}>{t('milestoneSchedule.splitEvenly')}</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 2 }}>
        <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {t('milestoneSchedule.scheduleTotal')}
        </Text>
        <Text style={{ fontFamily: FONT.mono, color: total === budget ? colors.forest : colors.seal, fontSize: 12, fontWeight: '700' }}>
          {fmt(total)} / {fmt(budget)}
        </Text>
      </View>
      {budget > 0 && total !== budget && (
        <Text style={{ fontFamily: FONT.sans, color: colors.seal, fontSize: 12, marginTop: 4 }}>
          {t('milestoneSchedule.mustMatchTarget')}
        </Text>
      )}
    </View>
  );
}
