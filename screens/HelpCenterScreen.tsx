import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { ChipGroup } from '../components/ChipGroup';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import {
  SUPPORT_CATEGORIES, SUPPORT_CATEGORY_LABELS, SUPPORT_TYPE_LABELS,
  useHelpArticlesQuery, type SupportTicketType,
} from '../api/support';

const CATEGORY_FILTER_OPTIONS = ['All', ...SUPPORT_CATEGORIES.map((c) => SUPPORT_CATEGORY_LABELS[c])];
const QUICK_ACTIONS: SupportTicketType[] = ['bug_report', 'feedback', 'contact_support'];
const QUICK_ACTION_SUB: Record<SupportTicketType, string> = {
  bug_report: 'Something broke or behaved oddly',
  feedback: 'Ideas or suggestions for us',
  question: 'Ask us anything',
  contact_support: 'Talk to our support team',
};

export function HelpCenterScreen() {
  const { colors } = useTheme();
  const { setFeedbackSheetOpen } = useApp();
  const [search, setSearch] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const category = categoryLabel === 'All' ? undefined : SUPPORT_CATEGORIES.find((c) => SUPPORT_CATEGORY_LABELS[c] === categoryLabel);
  const { data: articles = [], isLoading } = useHelpArticlesQuery({ category, q: search.trim() || undefined });

  return (
    <Screen header={<Header title="Help Center" subtitle="Search FAQs, or reach a real person" back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <View style={{ gap: 10 }}>
          {QUICK_ACTIONS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setFeedbackSheetOpen(true, { type: t, screen: 'HelpCenter', screenLabel: 'Help Center' })}
              style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.parchmentDark, backgroundColor: colors.surface, padding: 14 }}
            >
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15 }}>{SUPPORT_TYPE_LABELS[t]}</Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>{QUICK_ACTION_SUB[t]}</Text>
            </Pressable>
          ))}
        </View>

        <TextField placeholder="Search help topics…" value={search} onChangeText={setSearch} />
        <ChipGroup options={CATEGORY_FILTER_OPTIONS} value={categoryLabel} onChange={setCategoryLabel} />

        {isLoading ? (
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13, textAlign: 'center', paddingVertical: 24 }}>Loading…</Text>
        ) : articles.length === 0 ? (
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13, textAlign: 'center', paddingVertical: 24 }}>No help topics match your search.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {articles.map((a) => {
              const isOpen = expandedId === a.id;
              return (
                <Card key={a.id} style={{ overflow: 'hidden' }}>
                  <Pressable
                    onPress={() => setExpandedId(isOpen ? null : a.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 14 }}
                  >
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13, flex: 1 }}>{a.question}</Text>
                    <Text style={{ color: colors.inkSubtle, fontSize: 16 }}>{isOpen ? '−' : '+'}</Text>
                  </Pressable>
                  {isOpen && (
                    <View style={{ borderTopWidth: 1, borderTopColor: colors.parchmentDark, padding: 14 }}>
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, lineHeight: 19 }}>{a.answer}</Text>
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </Screen>
  );
}
