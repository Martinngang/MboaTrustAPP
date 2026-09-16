import { useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  Phone,
  ShieldCheck,
  UserCheck,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import {
  useVisitRequestsQuery,
  useRequestVisitMutation,
  useConfirmVisitMutation,
  useCancelVisitMutation,
} from '../../api/landVisits';
import { useLandListingDetailQuery } from '../../api/land';
import { apiErrorMessage } from '../../api/client';
import { useApp } from '../../context/AppContext';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'ScheduleVisit'>;

// The real VisitRequest is a buyer *proposing* one or more candidate dates
// (`proposedDates: Date[]`) for the seller to confirm one of later — not a
// single confirmed date+time-slot the buyer picks unilaterally, and there's
// no visitorPhone field. This used to also hardcode 3 literal calendar
// dates ("Aug 30, 2026", "Aug 31, 2026", "Sep 05, 2026"), which would have
// started showing dates in the past the moment those specific days went by,
// regardless of when the screen was actually opened — dates are now
// computed relative to today. The time-slot preference and contact phone
// are folded into `notes`, the one real free-text field, rather than lost.
function computeDateOptions(t: (k: any) => string) {
  const now = new Date();
  const offsets = [1, 3, 6];
  return offsets.map((days) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return {
      id: `d-${days}`,
      label: days === 1 ? t('scheduleVisit.tomorrow') : `${t('scheduleVisit.inDays')} ${days} ${t('scheduleVisit.days')}`,
      iso: d.toISOString(),
      display: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
  });
}

export function ScheduleVisitScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const { user } = useApp();
  const visitMutation = useRequestVisitMutation();

  const { listingId, title = 'Land Plot' } = route.params;

  // Fetched to know whether the current viewer is the seller — determines
  // whether this screen shows the buyer's request form or the seller's
  // manage-requests view (ported from
  // MboaTrustFrontend/src/screens/AdditionalScreens.tsx's
  // LandScheduleVisitScreen, which previously had no mobile equivalent:
  // useConfirmVisitMutation/useCancelVisitMutation existed, fully wired,
  // and were never used anywhere).
  const { data: land, isLoading: isLoadingLand } = useLandListingDetailQuery(listingId);
  const isSeller = Boolean(user?._id) && land?.sellerId === user?._id;
  const { data: visits = [], isLoading: isLoadingVisits } = useVisitRequestsQuery({ listingId });
  const confirmVisit = useConfirmVisitMutation();
  const cancelVisit = useCancelVisitMutation();
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [confirmDateFor, setConfirmDateFor] = useState<string | null>(null);

  const [dateOptions] = useState(() => computeDateOptions(t));
  const TIME_SLOTS = [
    { id: 'morning', label: t('scheduleVisit.morning'), time: '09:00 - 12:00' },
    { id: 'afternoon', label: t('scheduleVisit.afternoon'), time: '14:00 - 17:00' },
  ];

  const [selectedDates, setSelectedDates] = useState<string[]>([dateOptions[0].iso]);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0].label);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const notesRef = useRef<TextInput>(null);

  const toggleDate = (iso: string) => {
    setSelectedDates((prev) => (prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso]));
  };

  const doConfirm = async (visitId: string, confirmedDate: string) => {
    setActingOn(visitId);
    try {
      await confirmVisit.mutateAsync({ visitId, confirmedDate });
      setConfirmDateFor(null);
    } catch (err) {
      showToast({ title: t('scheduleVisit.error'), description: apiErrorMessage(err, t('scheduleVisit.confirmFailed')), tone: 'error' });
    } finally {
      setActingOn(null);
    }
  };

  const doCancel = async (visitId: string) => {
    setActingOn(visitId);
    try {
      await cancelVisit.mutateAsync(visitId);
    } catch (err) {
      showToast({ title: t('scheduleVisit.error'), description: apiErrorMessage(err, t('scheduleVisit.cancelFailed')), tone: 'error' });
    } finally {
      setActingOn(null);
    }
  };

  const handleBookVisit = async () => {
    if (selectedDates.length === 0) {
      showToast({ title: t('scheduleVisit.pickDate'), description: t('scheduleVisit.selectAtLeastOne'), tone: 'error' });
      return;
    }

    const detailLines = [
      notes.trim(),
      `${t('scheduleVisit.preferredTime')} ${selectedSlot} (${TIME_SLOTS.find((s) => s.label === selectedSlot)?.time})`,
      phone.trim() ? `${t('scheduleVisit.contactPhone')} ${phone.trim()}` : '',
    ].filter(Boolean);

    try {
      await visitMutation.mutateAsync({
        listingId,
        proposedDates: selectedDates,
        notes: detailLines.join(' · '),
      });

      showToast({
        title: t('scheduleVisit.visitRequested'),
        description: t('scheduleVisit.sellerWillConfirm'),
        tone: 'success',
      });
      navigation.goBack();
    } catch (err) {
      showToast({ title: t('scheduleVisit.error'), description: apiErrorMessage(err, t('scheduleVisit.couldNotSchedule')), tone: 'error' });
    }
  };

  if (isLoadingLand) {
    return (
      <Screen header={<Header title={t('scheduleVisit.title')} subtitle={title} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.seal} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title={isSeller ? t('scheduleVisit.visitRequestsTitle') : t('scheduleVisit.title')} subtitle={title} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Target Plot Card */}
        <Card style={{ padding: 14, backgroundColor: colors.seal + '15', borderColor: colors.seal + '35', gap: 4 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.seal, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
            {t('scheduleVisit.propertyToInspect')}
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
            {title}
          </Text>
        </Card>

        {/* Existing Visit Requests — seller manages (pick a date to confirm,
            or decline); buyer sees status and can cancel. */}
        {!isLoadingVisits && visits.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              {isSeller ? t('scheduleVisit.requestedVisits') : t('scheduleVisit.yourVisitRequests')}
            </Text>
            {visits.map((v) => {
              const busy = actingOn === v.id;
              return (
                <Card key={v.id} style={{ padding: 14, gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                      {isSeller ? v.requestedByName : t('scheduleVisit.you')}
                    </Text>
                    <StatusBadge status={v.status} />
                  </View>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11 }}>
                    {v.status === 'confirmed' && v.confirmedDate
                      ? `${t('scheduleVisit.confirmedLabel')} ${new Date(v.confirmedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : `${t('scheduleVisit.proposedLabel')} ${v.proposedDates.map((d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })).join(', ')}`}
                  </Text>
                  {v.notes ? (
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>{v.notes}</Text>
                  ) : null}

                  {isSeller && v.status === 'requested' && (
                    confirmDateFor === v.id ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                        {v.proposedDates.map((d) => (
                          <Pressable
                            key={d}
                            onPress={() => doConfirm(v.id, d)}
                            disabled={busy}
                            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: colors.seal, backgroundColor: colors.seal + '12' }}
                          >
                            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>
                              {new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </Text>
                          </Pressable>
                        ))}
                        <Pressable onPress={() => setConfirmDateFor(null)} disabled={busy} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.inkSubtle, fontSize: 12 }}>{t('scheduleVisit.cancelAction')}</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                        <PillButton onPress={() => setConfirmDateFor(v.id)} disabled={busy}>
                          {t('scheduleVisit.pickADate')}
                        </PillButton>
                        <PillButton variant="ghost" onPress={() => doCancel(v.id)} disabled={busy} loading={busy}>
                          {t('scheduleVisit.declineAction')}
                        </PillButton>
                      </View>
                    )
                  )}
                  {!isSeller && ['requested', 'confirmed'].includes(v.status) && (
                    <View style={{ marginTop: 4 }}>
                      <PillButton variant="ghost" onPress={() => doCancel(v.id)} disabled={busy} loading={busy}>
                        {t('scheduleVisit.cancelAction')}
                      </PillButton>
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        )}

        {!isSeller && (
        <>
        {/* Date Selector */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
            {t('scheduleVisit.proposeDates')}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
            {t('scheduleVisit.sellerWillConfirmWhichever')}
          </Text>

          <View style={{ gap: 8 }}>
            {dateOptions.map((d) => {
              const active = selectedDates.includes(d.iso);
              return (
                <Pressable
                  key={d.id}
                  onPress={() => toggleDate(d.iso)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: active ? colors.seal : colors.parchmentDark,
                    backgroundColor: active ? colors.seal + '12' : colors.parchment,
                  }}
                >
                  <View>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                      {d.label}
                    </Text>
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>
                      {d.display}
                    </Text>
                  </View>
                  {active && (
                    <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: colors.seal, alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Time Slot Picker */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
            {t('scheduleVisit.selectTimeSlot')}
          </Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {TIME_SLOTS.map((slot) => {
              const active = selectedSlot === slot.label;
              return (
                <Pressable
                  key={slot.id}
                  onPress={() => setSelectedSlot(slot.label)}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: active ? colors.seal : colors.parchmentDark,
                    backgroundColor: active ? colors.seal + '12' : colors.parchment,
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                    {slot.label}
                  </Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11 }}>
                    {slot.time}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Contact Phone & Notes */}
        <Card style={{ padding: 16, gap: 12 }}>
          <TextField
            label={t('scheduleVisit.contactPhoneLabel')}
            placeholder="677123456"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => notesRef.current?.focus()}
          />

          <TextField
            ref={notesRef}
            label={t('scheduleVisit.specialRequestsLabel')}
            placeholder={t('scheduleVisit.meetingPointPlaceholder')}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </Card>

        {/* Verifier Assistance Banner */}
        <Card style={{ padding: 14, backgroundColor: colors.forest + '12', borderColor: colors.forest + '30', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <UserCheck size={20} color={colors.forest} />
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, flex: 1, lineHeight: 17 }}>
            {t('scheduleVisit.verifierAssistance')}
          </Text>
        </Card>

        {/* Book Visit Button */}
        <PillButton
          variant="primary"
          onPress={handleBookVisit}
          loading={visitMutation.isPending}
          disabled={visitMutation.isPending}
          fullWidth
        >
          {t('scheduleVisit.confirmButton')}
        </PillButton>
        </>
        )}
      </View>
    </Screen>
  );
}
