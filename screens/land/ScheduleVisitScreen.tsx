import { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
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
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useScheduleVisitMutation } from '../../api/land';
import type { MainStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<MainStackParamList, 'ScheduleVisit'>;

const DATES = [
  { id: 'd-1', label: 'Tomorrow', date: 'Aug 30, 2026' },
  { id: 'd-2', label: 'In 2 Days', date: 'Aug 31, 2026' },
  { id: 'd-3', label: 'Next Saturday', date: 'Sep 05, 2026' },
];

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning Slot', time: '09:00 - 12:00' },
  { id: 'afternoon', label: 'Afternoon Slot', time: '14:00 - 17:00' },
];

export function ScheduleVisitScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const visitMutation = useScheduleVisitMutation();

  const { listingId, title = 'Land Plot' } = route.params;

  const [selectedDate, setSelectedDate] = useState(DATES[0].date);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0].label);
  const [phone, setPhone] = useState('677123456');
  const [notes, setNotes] = useState('Would like to inspect boundary marker posts and road access with site agent.');

  const handleBookVisit = async () => {
    if (!phone.trim()) {
      showToast({ title: 'Phone Required', description: 'Please provide your contact phone number.', tone: 'error' });
      return;
    }

    try {
      await visitMutation.mutateAsync({
        listingId,
        date: selectedDate,
        timeSlot: selectedSlot,
        visitorPhone: phone.trim(),
        notes: notes.trim(),
      });

      showToast({
        title: 'Visit Requested!',
        description: `Site visit scheduled for ${selectedDate} (${selectedSlot}).`,
        tone: 'success',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({ title: 'Error', description: err?.message || 'Could not schedule visit.', tone: 'error' });
    }
  };

  return (
    <Screen header={<Header title="Schedule Site Visit" subtitle={title} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Target Plot Card */}
        <Card style={{ padding: 14, backgroundColor: colors.seal + '15', borderColor: colors.seal + '35', gap: 4 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.seal, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
            Property to Inspect
          </Text>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
            {title}
          </Text>
        </Card>

        {/* Date Selector */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
            Select Preferred Visit Date
          </Text>

          <View style={{ gap: 8 }}>
            {DATES.map((d) => {
              const active = selectedDate === d.date;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => setSelectedDate(d.date)}
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
                      {d.date}
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
            Select Time Slot
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
            label="Your Contact Phone (+237)"
            placeholder="677123456"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <TextField
            label="Special Requests / Meeting Point"
            placeholder="e.g. Meet at Total station junction..."
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
            An independent field verifier can accompany your visit to verify cadastral boundary markers on site.
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
          Confirm Site Visit Request
        </PillButton>
      </View>
    </Screen>
  );
}
