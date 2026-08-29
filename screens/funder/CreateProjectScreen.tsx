import { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Plus,
  Trash2,
  Check,
  ChevronRight,
  ShieldCheck,
  Video,
  Users,
  MapPin,
  Sparkles,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useCreateProjectMutation } from '../../api/projects';
import type { MainStackParamList } from '../../navigation/types';

const CATEGORIES = ['Water & Sanitation', 'Education', 'Healthcare', 'Infrastructure', 'Agriculture'];

const REGIONS_TOWNS: Record<string, string[]> = {
  Centre: ['Yaoundé', 'Mbalmayo', 'Obala', 'Bafia'],
  Littoral: ['Douala', 'Edéa', 'Nkongsamba', 'Yabassi'],
  Sud: ['Kribi', 'Ebolowa', 'Sangmélima', 'Ambam'],
  Ouest: ['Bafoussam', 'Dschang', 'Foumban', 'Bangangté'],
  'Nord-Ouest': ['Bamenda', 'Kumbo', 'Wum'],
  'Sud-Ouest': ['Buea', 'Limbe', 'Kumba'],
  Nord: ['Garoua', 'Guider', 'Pitoa'],
  Extrême_Nord: ['Maroua', 'Kousséri', 'Yagoua'],
};

interface MilestoneDraft {
  id: string;
  name: string;
  amount: string;
  description: string;
  requiresVideo: boolean;
  requiresCosigner: boolean;
}

export function CreateProjectScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const createMutation = useCreateProjectMutation();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Basics
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');

  // Step 2: Location
  const [region, setRegion] = useState('Centre');
  const [town, setTown] = useState('Yaoundé');

  // Step 3: Milestones
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    {
      id: 'm-1',
      name: 'Foundation & Earthworks',
      amount: '2500000',
      description: 'Site clearing, excavation, and concrete foundation slab',
      requiresVideo: true,
      requiresCosigner: false,
    },
    {
      id: 'm-2',
      name: 'Main Structural Elevation & Walls',
      amount: '3500000',
      description: 'Bricklaying, reinforced columns, and lintel casting',
      requiresVideo: true,
      requiresCosigner: false,
    },
    {
      id: 'm-3',
      name: 'Roofing & Final Handover',
      amount: '2000000',
      description: 'Roof truss installation, sheeting, and final inspection',
      requiresVideo: true,
      requiresCosigner: true,
    },
  ]);

  const addMilestone = () => {
    const newId = `m-${Date.now()}`;
    setMilestones((prev) => [
      ...prev,
      {
        id: newId,
        name: `Milestone ${prev.length + 1}`,
        amount: '1000000',
        description: '',
        requiresVideo: false,
        requiresCosigner: false,
      },
    ]);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length <= 1) {
      showToast({ title: 'Minimum Milestone Required', description: 'A project must have at least 1 milestone.', tone: 'warning' });
      return;
    }
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMilestone = (id: string, updates: Partial<MilestoneDraft>) => {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const totalAmount = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const escrowFee = Math.round(totalAmount * 0.035); // 3.5% Escrow Protection Fee

  const handleNext = () => {
    if (step === 1) {
      if (!title.trim()) {
        showToast({ title: 'Missing Title', description: 'Please enter a project title.', tone: 'error' });
        return;
      }
      if (!description.trim()) {
        showToast({ title: 'Missing Description', description: 'Please describe the project objectives.', tone: 'error' });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      const invalid = milestones.some((m) => !m.name.trim() || Number(m.amount) <= 0);
      if (invalid) {
        showToast({ title: 'Invalid Milestones', description: 'All milestones must have a valid title and amount.', tone: 'error' });
        return;
      }
      setStep(4);
    } else if (step === 4) {
      submitProject();
    }
  };

  const submitProject = async () => {
    try {
      const project = await createMutation.mutateAsync({
        title: title.trim(),
        category,
        description: description.trim(),
        locationName: `${town}, ${region} Region`,
        totalAmount,
        milestones: milestones.map((m) => ({
          name: m.name.trim(),
          amount: Number(m.amount),
          description: m.description.trim(),
          requiresVideo: m.requiresVideo,
          requiresCosigner: m.requiresCosigner,
        })),
      });

      showToast({ title: 'Project Created!', description: 'Your project is registered in escrow.', tone: 'success' });
      navigation.replace('ProjectDetail', { projectId: project.id });
    } catch (err: any) {
      showToast({
        title: 'Project Creation Failed',
        description: err?.message || 'Could not save project. Please try again.',
        tone: 'error',
      });
    }
  };

  return (
    <Screen header={<Header title="Create Funded Project" back onBack={() => (step > 1 ? setStep((s) => (s - 1) as any) : navigation.goBack())} />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Step Stepper Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {[
            { num: 1, label: 'Basics' },
            { num: 2, label: 'Location' },
            { num: 3, label: 'Milestones' },
            { num: 4, label: 'Review' },
          ].map((s, idx) => (
            <View key={s.num} style={{ flexDirection: 'row', alignItems: 'center', flex: idx < 3 ? 1 : undefined }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: step >= s.num ? colors.forest : colors.parchmentDark,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {step > s.num ? (
                  <Check size={14} color="#fff" strokeWidth={3} />
                ) : (
                  <Text style={{ fontFamily: FONT.mono, color: step >= s.num ? '#fff' : colors.inkSubtle, fontSize: 11, fontWeight: '700' }}>
                    {s.num}
                  </Text>
                )}
              </View>
              {idx < 3 && (
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: step > s.num ? colors.forest : colors.parchmentDark,
                    marginHorizontal: 6,
                  }}
                />
              )}
            </View>
          ))}
        </View>

        {/* Step 1: Basics */}
        {step === 1 && (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                Step 1: Project Information
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                Define what you are funding from abroad
              </Text>
            </View>

            <Card style={{ padding: 16, gap: 14 }}>
              <TextField
                label="Project Title"
                placeholder="e.g. Modern Residential Villa Construction"
                value={title}
                onChangeText={setTitle}
              />

              <View style={{ gap: 6 }}>
                <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>
                  Category
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {CATEGORIES.map((cat) => {
                    const active = category === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setCategory(cat)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: active ? colors.forest : colors.parchment,
                        }}
                      >
                        <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? '#fff' : colors.ink }}>
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <TextField
                label="Description & Scope"
                placeholder="Detailed objectives, expected deliverables, and construction specs..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </Card>
          </View>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                Step 2: Project Location
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                Specify the site region & municipality in Cameroon
              </Text>
            </View>

            <Card style={{ padding: 16, gap: 14 }}>
              <View style={{ gap: 6 }}>
                <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>
                  Region
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {Object.keys(REGIONS_TOWNS).map((r) => {
                    const active = region === r;
                    return (
                      <Pressable
                        key={r}
                        onPress={() => {
                          setRegion(r);
                          setTown(REGIONS_TOWNS[r][0]);
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: active ? colors.forest : colors.parchment,
                        }}
                      >
                        <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? '#fff' : colors.ink }}>
                          {r}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>
                  Town / City
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(REGIONS_TOWNS[region] || []).map((t) => {
                    const active = town === t;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => setTown(t)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: active ? colors.forest : colors.parchmentDark,
                          backgroundColor: active ? colors.forest + '15' : colors.surface,
                        }}
                      >
                        <Text style={{ fontFamily: FONT.sansMedium, fontSize: 13, color: active ? colors.forest : colors.ink }}>
                          {t}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <MapPin size={16} color={colors.forest} />
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                  Selected: {town}, {region} Region
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* Step 3: Milestones Builder */}
        {step === 3 && (
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                  Step 3: Escrow Milestones
                </Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                  Funds are released in tranches upon verified proof
                </Text>
              </View>
              <Pressable
                onPress={addMilestone}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: colors.forest,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 10,
                }}
              >
                <Plus size={14} color="#fff" />
                <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>Add</Text>
              </Pressable>
            </View>

            {milestones.map((m, idx) => (
              <Card key={m.id} style={{ padding: 14, gap: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                    Milestone {idx + 1}
                  </Text>
                  {milestones.length > 1 && (
                    <Pressable onPress={() => removeMilestone(m.id)} hitSlop={6}>
                      <Trash2 size={16} color={colors.seal} />
                    </Pressable>
                  )}
                </View>

                <TextField
                  label="Milestone Title"
                  placeholder="e.g. Foundation Slab"
                  value={m.name}
                  onChangeText={(val) => updateMilestone(m.id, { name: val })}
                />

                <TextField
                  label="Amount (XAF)"
                  placeholder="e.g. 2500000"
                  value={m.amount}
                  onChangeText={(val) => updateMilestone(m.id, { amount: val.replace(/[^0-9]/g, '') })}
                  keyboardType="numeric"
                />

                <TextField
                  label="Deliverable Description"
                  placeholder="What evidence or proof is required?"
                  value={m.description}
                  onChangeText={(val) => updateMilestone(m.id, { description: val })}
                />

                {/* Option Toggles */}
                <View style={{ flexDirection: 'row', gap: 12, paddingTop: 4 }}>
                  <Pressable
                    onPress={() => updateMilestone(m.id, { requiresVideo: !m.requiresVideo })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        borderWidth: 1.5,
                        borderColor: m.requiresVideo ? colors.forest : colors.inkSubtle,
                        backgroundColor: m.requiresVideo ? colors.forest : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {m.requiresVideo && <Check size={12} color="#fff" strokeWidth={3} />}
                    </View>
                    <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12 }}>
                      Video Verification
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => updateMilestone(m.id, { requiresCosigner: !m.requiresCosigner })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        borderWidth: 1.5,
                        borderColor: m.requiresCosigner ? colors.forest : colors.inkSubtle,
                        backgroundColor: m.requiresCosigner ? colors.forest : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {m.requiresCosigner && <Check size={12} color="#fff" strokeWidth={3} />}
                    </View>
                    <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12 }}>
                      Co-Signer Signoff
                    </Text>
                  </Pressable>
                </View>
              </Card>
            ))}

            {/* Total Budget Bar */}
            <Card style={{ padding: 14, backgroundColor: colors.forest + '15', borderColor: colors.forest + '40' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                  Total Project Target:
                </Text>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 18 }}>
                  {fmt(totalAmount)}
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* Step 4: Review & Platform Escrow Fee Breakdown */}
        {step === 4 && (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                Step 4: Review & Confirm
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                Verify budget and escrow milestones before publishing
              </Text>
            </View>

            <Card style={{ padding: 16, gap: 12 }}>
              <View>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                  Project Summary
                </Text>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 17, marginTop: 2 }}>
                  {title}
                </Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                  {category} · {town}, {region}
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: colors.parchmentDark }} />

              <View style={{ gap: 6 }}>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                  Milestones ({milestones.length})
                </Text>
                {milestones.map((m, i) => (
                  <View key={m.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 13 }}>
                      {i + 1}. {m.name}
                    </Text>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                      {fmt(Number(m.amount))}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={{ height: 1, backgroundColor: colors.parchmentDark }} />

              {/* Fee Breakdown */}
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>
                    Net Construction Budget
                  </Text>
                  <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>
                    {fmt(totalAmount)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>
                    Escrow Protection & Verification (3.5%)
                  </Text>
                  <Text style={{ fontFamily: FONT.sansMedium, color: colors.forest, fontSize: 13 }}>
                    {fmt(escrowFee)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
                    Total Project Budget
                  </Text>
                  <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 17 }}>
                    {fmt(totalAmount + escrowFee)}
                  </Text>
                </View>
              </View>
            </Card>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
              <ShieldCheck size={18} color={colors.forest} />
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, flex: 1 }}>
                All milestone payments remain locked in escrow until you approve submitted verification evidence.
              </Text>
            </View>
          </View>
        )}

        {/* Action Button */}
        <PillButton
          variant="primary"
          onPress={handleNext}
          loading={createMutation.isPending}
          disabled={createMutation.isPending}
          fullWidth
        >
          {step === 4 ? 'Launch Project in Escrow' : 'Continue to Next Step'}
        </PillButton>
      </View>
    </Screen>
  );
}
