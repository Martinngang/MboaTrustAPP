import { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import {
  Activity,
  ShieldCheck,
  Wallet,
  Truck,
  Tag,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { fmt } from '../components/fmt';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useMyActivityQuery, type ActivityEvent } from '../api/activity';

const EVENT_ICONS: Record<string, typeof ShieldCheck> = {
  escrow_funded: Wallet,
  verification_passed: ShieldCheck,
  order_dispatched: Truck,
  offer_received: Tag,
  milestone_completed: CheckCircle2,
};

export function ActivityScreen() {
  const { colors } = useTheme();
  const { data: activities, isLoading } = useMyActivityQuery();

  return (
    <Screen header={<Header title="Activity Timeline" subtitle="Escrow, milestone & order history" />}>
      <View style={{ padding: 16, gap: 14 }}>
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : (activities || []).length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity events yet"
            description="Your milestone reviews, payments, and site audits will appear here in chronological order."
          />
        ) : (
          (activities || []).map((item, idx) => {
            const Icon = EVENT_ICONS[item.type] || Activity;
            return (
              <Card key={item.id} style={{ padding: 14, flexDirection: 'row', gap: 12 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: colors.forest + '15',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                  }}
                >
                  <Icon size={18} color={colors.forest} />
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                      {item.title}
                    </Text>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>
                      {item.relativeTime}
                    </Text>
                  </View>

                  <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
                    {item.description}
                  </Text>

                  {item.projectTitle && (
                    <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, marginTop: 2 }}>
                      {item.projectTitle}
                    </Text>
                  )}

                  {item.amount && (
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 13, marginTop: 2 }}>
                      {fmt(item.amount)}
                    </Text>
                  )}
                </View>
              </Card>
            );
          })
        )}
      </View>
    </Screen>
  );
}
