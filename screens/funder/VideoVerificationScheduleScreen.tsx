import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Video, Check, CalendarCheck2 } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useVideoSessionsQuery, useRequestVideoSessionMutation, useScheduleVideoSessionMutation } from '../../api/videoVerification';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'VideoVerification'>;

// Ported from MboaTrustFrontend/src/screens/FunderScreens.tsx's
// VideoVerificationScheduleScreen — same auto-request-on-first-visit, same
// confirmed-state view once scheduled. Web picks an exact date+time via
// native `<input type="date">`/`<input type="time">`; RN has no equivalent,
// so this uses the same relative date-chip + time-slot-chip pattern already
// established in land/ScheduleVisitScreen.tsx, combined into the same exact
// `scheduledFor` ISO timestamp the backend expects.
function computeDateOptions(t: (k: any) => string) {
  const now = new Date();
  const offsets = [0, 1, 2, 3];
  return offsets.map((days) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return {
      id: `d-${days}`,
      label: days === 0 ? t('videoVerification.today') : days === 1 ? t('videoVerification.tomorrow') : `${t('videoVerification.inDays')} ${days} ${t('videoVerification.days')}`,
      date: d,
      display: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    };
  });
}

const TIME_SLOTS = ['09:00', '11:00', '14:00', '16:00'];

export function VideoVerificationScheduleScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { projectId, milestoneId, milestoneTitle } = route.params;
  const { data: sessions = [], isLoading } = useVideoSessionsQuery(projectId, milestoneId);
  const existing = sessions.find((s) => s.status !== 'cancelled');
  const requestSession = useRequestVideoSessionMutation();
  const scheduleSession = useScheduleVideoSessionMutation();
  const requestedRef = useRef(false);

  const [dateOptions] = useState(() => computeDateOptions(t));
  const [selectedDateId, setSelectedDateId] = useState(dateOptions[0].id);
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[0]);
  const [meetingUrl, setMeetingUrl] = useState('');

  useEffect(() => {
    if (!isLoading && !existing && !requestedRef.current) {
      requestedRef.current = true;
      requestSession.mutate(
        { projectId, milestoneId },
        { onError: (err) => showToast({ title: t('videoVerification.requestFailed'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' }) }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, existing]);

  const confirm = async () => {
    if (!meetingUrl.trim() || !existing) return;
    const day = dateOptions.find((d) => d.id === selectedDateId)!.date;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledFor = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes).toISOString();
    try {
      await scheduleSession.mutateAsync({ sessionId: existing.id, scheduledFor, meetingUrl: meetingUrl.trim() });
    } catch (err) {
      showToast({ title: t('videoVerification.scheduleFailed'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  if (existing?.status === 'scheduled') {
    return (
      <Screen header={<Header title={t('videoVerification.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: colors.steel + '18', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarCheck2 size={32} color={colors.steel} />
          </View>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20, textAlign: 'center' }}>
            {t('videoVerification.callScheduled')}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
            {t('videoVerification.callScheduledDescPrefix')} <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink }}>{milestoneTitle}</Text> {t('videoVerification.callScheduledDescSuffix')}{' '}
            {new Date(existing.scheduledFor!).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.
          </Text>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11 }}>{existing.meetingUrl}</Text>
          <PillButton onPress={() => navigation.goBack()} fullWidth>
            {t('videoVerification.backToReview')}
          </PillButton>
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title={t('videoVerification.scheduleTitle')} subtitle={milestoneTitle} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Card style={{ padding: 14, backgroundColor: colors.steel + '12', borderColor: colors.steel + '30', gap: 4 }}>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 18 }}>
            {t('videoVerification.explainer')}
          </Text>
        </Card>

        {isLoading ? (
          <ActivityIndicator color={colors.steel} style={{ marginTop: 20 }} />
        ) : (
          <>
            <Card style={{ padding: 16, gap: 12 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{t('videoVerification.selectDate')}</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {dateOptions.map((d) => {
                  const active = selectedDateId === d.id;
                  return (
                    <Pressable
                      key={d.id}
                      onPress={() => setSelectedDateId(d.id)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: active ? colors.steel : colors.parchmentDark,
                        backgroundColor: active ? colors.steel + '14' : colors.parchment,
                      }}
                    >
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: active ? colors.steel : colors.ink, fontSize: 12 }}>{d.label}</Text>
                      <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 1 }}>{d.display}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            <Card style={{ padding: 16, gap: 12 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{t('videoVerification.selectTime')}</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {TIME_SLOTS.map((time) => {
                  const active = selectedTime === time;
                  return (
                    <Pressable
                      key={time}
                      onPress={() => setSelectedTime(time)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: active ? colors.steel : colors.parchmentDark,
                        backgroundColor: active ? colors.steel + '14' : colors.parchment,
                      }}
                    >
                      <Text style={{ fontFamily: FONT.mono, color: active ? colors.steel : colors.ink, fontSize: 12, fontWeight: '700' }}>{time}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            <Card style={{ padding: 16, gap: 12 }}>
              <TextField
                label={t('videoVerification.meetingLinkLabel')}
                placeholder="https://meet.google.com/..."
                value={meetingUrl}
                onChangeText={setMeetingUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
            </Card>

            <PillButton
              variant="primary"
              onPress={confirm}
              disabled={!meetingUrl.trim() || !existing || scheduleSession.isPending}
              loading={scheduleSession.isPending}
              fullWidth
            >
              {t('videoVerification.confirmCallTime')}
            </PillButton>
          </>
        )}
      </View>
    </Screen>
  );
}
