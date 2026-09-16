import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { useAvailabilityQuery, useSetAvailabilityMutation } from '../../api/contractors';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'AvailabilityCalendar'>;

// Ported from MboaTrustFrontend/src/screens/MarketplaceScreens.tsx's
// AvailabilityCalendarScreen — same month grid, same real per-date
// PUT /contractor-profiles/me/availability toggle. Read-only whenever a
// userId param names someone other than the caller (a funder checking a
// contractor's calendar before hiring).
function getMonthGrid(year: number, month: number): (number | null)[] {
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: startWeekday }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function AvailabilityCalendarScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const { user } = useApp();
  const { show: showToast } = useToast();

  const targetUserId = route.params?.userId;
  const readOnly = Boolean(targetUserId) && targetUserId !== user?._id;

  const { data: availability = {} } = useAvailabilityQuery(readOnly ? targetUserId : undefined);
  const setAvailability = useSetAvailabilityMutation();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const cells = getMonthGrid(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const changeMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const dateKey = (day: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <Screen header={<Header title={readOnly ? t('availability.titleReadOnly') : t('availability.title')} subtitle={readOnly ? t('availability.subtitleReadOnly') : t('availability.subtitle')} back />}>
      <View style={{ padding: 16, gap: 14 }}>
        <Card style={{ padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable onPress={() => changeMonth(-1)} accessibilityRole="button" style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={16} color={colors.ink} />
            </Pressable>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15 }}>{monthLabel}</Text>
            <Pressable onPress={() => changeMonth(1)} accessibilityRole="button" style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={16} color={colors.ink} />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row' }}>
            {WEEKDAY_LABELS.map((d, i) => (
              <Text key={i} style={{ flex: 1, fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase', textAlign: 'center' }}>{d}</Text>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {cells.map((day, i) => {
              if (day === null) return <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
              const key = dateKey(day);
              const status = availability[key] ?? 'available';
              const isPast = new Date(viewYear, viewMonth, day) < startOfToday;
              const disabled = readOnly || isPast || setAvailability.isPending;
              const toggle = () => {
                setAvailability.mutate(
                  { date: key, isAvailable: status === 'unavailable' },
                  { onError: (err) => showToast({ title: t('availability.failedToUpdate'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' }) }
                );
              };
              return (
                <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
                  <Pressable
                    onPress={toggle}
                    disabled={disabled}
                    accessibilityRole="button"
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: isPast ? 0.35 : 1,
                      backgroundColor: status === 'unavailable' ? colors.seal + '18' : colors.forest + '18',
                    }}
                  >
                    <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 12, color: status === 'unavailable' ? colors.seal : colors.forest }}>{day}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: colors.forest + '18' }} />
            <Text style={{ fontFamily: FONT.mono, color: colors.inkMuted, fontSize: 10, textTransform: 'uppercase' }}>{t('availability.available')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: colors.seal + '18' }} />
            <Text style={{ fontFamily: FONT.mono, color: colors.inkMuted, fontSize: 10, textTransform: 'uppercase' }}>{t('availability.unavailable')}</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}
