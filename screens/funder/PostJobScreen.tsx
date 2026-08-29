import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Briefcase,
  Wrench,
  Zap,
  Droplet,
  Home as HomeIcon,
  Paintbrush,
  ShieldCheck,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useCreateTenderMutation } from '../../api/tenders';
import type { MainStackParamList } from '../../navigation/types';

const TRADE_SPECIALTIES = [
  { id: 'masonry', name: 'Masonry & Concrete', icon: Wrench },
  { id: 'electrical', name: 'Electrical & Solar', icon: Zap },
  { id: 'plumbing', name: 'Plumbing & Hydraulic', icon: Droplet },
  { id: 'roofing', name: 'Roofing & Framing', icon: HomeIcon },
  { id: 'finishing', name: 'Tiling & Painting', icon: Paintbrush },
];

export function PostJobScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const tenderMutation = useCreateTenderMutation();

  const [title, setTitle] = useState('');
  const [trade, setTrade] = useState(TRADE_SPECIALTIES[0].name);
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('Odza, Yaoundé');
  const [budget, setBudget] = useState('4500000');
  const [durationDays, setDurationDays] = useState('30');

  const handleSubmitTender = async () => {
    if (!title.trim() || !description.trim()) {
      showToast({ title: 'Missing Information', description: 'Please provide tender title and description.', tone: 'error' });
      return;
    }
    const numBudget = Number(budget) || 0;
    if (numBudget <= 0) {
      showToast({ title: 'Invalid Budget', description: 'Please enter a valid budget amount in XAF.', tone: 'error' });
      return;
    }

    try {
      await tenderMutation.mutateAsync({
        title: title.trim(),
        category: trade,
        tradeSpecialty: trade,
        description: description.trim(),
        locationName: locationName.trim(),
        budget: numBudget,
        durationDays: Number(durationDays) || 30,
      });

      showToast({
        title: 'Tender Published!',
        description: 'Verified contractors can now submit milestone bids.',
        tone: 'success',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({
        title: 'Publication Failed',
        description: err?.message || 'Could not publish tender. Please try again.',
        tone: 'error',
      });
    }
  };

  return (
    <Screen header={<Header title="Post Contractor Tender" back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Info Banner */}
        <Card style={{ padding: 14, backgroundColor: colors.steel + '15', borderColor: colors.steel + '40', gap: 6 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.steel, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
            Escrow-Protected Contractor Tender
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12, lineHeight: 17 }}>
            Verified local contractors will bid on your requirements. You review their portfolio, rating, and prices before accepting.
          </Text>
        </Card>

        {/* Trade Specialty */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
            Trade Specialty Required
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {TRADE_SPECIALTIES.map((t) => {
              const active = trade === t.name;
              const Icon = t.icon;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTrade(t.name)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 12,
                    backgroundColor: active ? colors.steel : colors.parchment,
                  }}
                >
                  <Icon size={16} color={active ? '#fff' : colors.ink} />
                  <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? '#fff' : colors.ink }}>
                    {t.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Card>

        {/* Tender Form */}
        <Card style={{ padding: 16, gap: 14 }}>
          <TextField
            label="Tender Title"
            placeholder="e.g. Multi-Storey Building Reinforced Masonry"
            value={title}
            onChangeText={setTitle}
          />

          <TextField
            label="Site Location"
            placeholder="e.g. Odza, Yaoundé (Centre)"
            value={locationName}
            onChangeText={setLocationName}
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Target Budget (XAF)"
                placeholder="4500000"
                value={budget}
                onChangeText={(v) => setBudget(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="Duration (Days)"
                placeholder="30"
                value={durationDays}
                onChangeText={(v) => setDurationDays(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TextField
            label="Scope of Work & Requirements"
            placeholder="Describe site conditions, technical specifications, material preferences, and deliverables..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </Card>

        {/* Submit Button */}
        <PillButton
          variant="primary"
          onPress={handleSubmitTender}
          loading={tenderMutation.isPending}
          disabled={tenderMutation.isPending}
          fullWidth
        >
          Publish Tender for Contractor Bids
        </PillButton>
      </View>
    </Screen>
  );
}
