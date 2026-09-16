import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { X, Camera, WifiOff } from 'lucide-react-native';
import { BottomSheetModal } from './BottomSheetModal';
import { TextField } from './TextField';
import { PillButton } from './PillButton';
import { ChipGroup } from './ChipGroup';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useToast } from './Toast';
import { apiErrorMessage } from '../api/client';
import { useApp } from '../context/AppContext';
import { useOfflineQueue } from '../context/OfflineQueueContext';
import {
  SUPPORT_CATEGORIES, SUPPORT_CATEGORY_LABELS, SUPPORT_TYPE_LABELS,
  useCreateSupportTicketMutation, type SupportCategory, type SupportTicketType,
} from '../api/support';

const TYPE_OPTIONS: SupportTicketType[] = ['bug_report', 'feedback', 'question', 'contact_support'];

// Mirrors app.json's `expo.version`. Kept as a literal rather than read from
// expo-constants so a support ticket still records a version in contexts
// where the manifest isn't available (bare/dev-client edge cases).
const APP_VERSION = '1.0.0';

interface PickedFile {
  uri: string;
  fileName?: string;
  mimeType?: string;
}

/** The single "Help & feedback" submission surface, reachable from Header's
 * icon on every screen (generic, no preset) and from HelpCenterScreen's
 * three quick-action cards (preset to a type). Mirrors web's
 * FeedbackModal.tsx — same fields, same contextual chip, same reuse of the
 * existing /messages/upload endpoint for attachments. */
export function FeedbackSheet() {
  const { colors } = useTheme();
  const { show: showToast } = useToast();
  const { feedbackSheetOpen, feedbackPreset, setFeedbackSheetOpen } = useApp();
  const { isOnline } = useOfflineQueue();
  const createMutation = useCreateSupportTicketMutation();

  const [type, setType] = useState<SupportTicketType>('feedback');
  const [category, setCategory] = useState<SupportCategory>('other');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [contextVisible, setContextVisible] = useState(true);

  useEffect(() => {
    if (feedbackSheetOpen) {
      setType(feedbackPreset?.type ?? 'feedback');
      setCategory('other');
      setSubject('');
      setDescription('');
      setFiles([]);
      setContextVisible(true);
    }
  }, [feedbackSheetOpen, feedbackPreset]);

  const close = () => setFeedbackSheetOpen(false);

  const addPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setFiles((prev) => [...prev, { uri: asset.uri, fileName: asset.fileName ?? undefined, mimeType: asset.mimeType ?? 'image/jpeg' }]);
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      showToast({ title: 'Missing details', description: 'Please add a subject and a description.', tone: 'error' });
      return;
    }
    try {
      await createMutation.mutateAsync({
        type,
        category,
        subject: subject.trim(),
        description: description.trim(),
        files,
        context: contextVisible && feedbackPreset?.screen
          ? {
              platform: 'mobile',
              screen: feedbackPreset.screen,
              screenLabel: feedbackPreset.screenLabel,
              // Falls back to the route name so mobile submissions are still
              // groupable by area alongside web's derived feature — an empty
              // feature would silently drop them out of that admin cut.
              feature: feedbackPreset.feature ?? feedbackPreset.screen,
              appVersion: APP_VERSION,
            }
          : { platform: 'mobile', appVersion: APP_VERSION },
      });
      showToast({ title: 'Thanks — we got it', description: "We'll follow up in My support requests.", tone: 'success' });
      close();
    } catch (err) {
      showToast({ title: 'Could not submit', description: apiErrorMessage(err, 'Please try again'), tone: 'error' });
    }
  };

  return (
    <BottomSheetModal visible={feedbackSheetOpen} onClose={close} maxHeightPct={0.92}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
          {feedbackPreset?.type ? SUPPORT_TYPE_LABELS[feedbackPreset.type] : 'Help & feedback'}
        </Text>

        {!feedbackPreset?.type && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>What's this about?</Text>
            <ChipGroup
              options={TYPE_OPTIONS.map((t) => SUPPORT_TYPE_LABELS[t])}
              value={SUPPORT_TYPE_LABELS[type]}
              onChange={(label) => {
                const found = TYPE_OPTIONS.find((t) => SUPPORT_TYPE_LABELS[t] === label);
                if (found) setType(found);
              }}
            />
          </View>
        )}

        {contextVisible && feedbackPreset?.screenLabel && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.parchment, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkMuted, fontSize: 11 }}>From: {feedbackPreset.screenLabel}</Text>
            <Pressable onPress={() => setContextVisible(false)} hitSlop={6}>
              <X size={12} color={colors.inkMuted} />
            </Pressable>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Category</Text>
          <ChipGroup
            options={SUPPORT_CATEGORIES.map((c) => SUPPORT_CATEGORY_LABELS[c])}
            value={SUPPORT_CATEGORY_LABELS[category]}
            onChange={(label) => {
              const found = SUPPORT_CATEGORIES.find((c) => SUPPORT_CATEGORY_LABELS[c] === label);
              if (found) setCategory(found);
            }}
          />
        </View>

        <TextField label="Subject" value={subject} onChangeText={setSubject} placeholder="A short summary" />
        <TextField
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="What happened, or what would you like to tell us?"
          multiline
          numberOfLines={4}
          containerStyle={{}}
          style={{ minHeight: 100, textAlignVertical: 'top' }}
        />

        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Screenshots (optional)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {files.map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.parchment, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11 }} numberOfLines={1}>{f.fileName ?? 'Photo'}</Text>
                <Pressable onPress={() => setFiles((prev) => prev.filter((_, j) => j !== i))} hitSlop={6}>
                  <X size={12} color={colors.inkMuted} />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={addPhoto}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.parchmentDark, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Camera size={13} color={colors.inkMuted} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.inkMuted, fontSize: 11 }}>Add screenshot</Text>
            </Pressable>
          </View>
        </View>

        {!isOnline && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, backgroundColor: colors.amber + '15' }}>
            <WifiOff size={14} color={colors.amber} />
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, flex: 1 }}>You're offline — reconnect to submit this.</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <PillButton variant="secondary" onPress={close} fullWidth>Cancel</PillButton>
          </View>
          <View style={{ flex: 1 }}>
            <PillButton variant="primary" onPress={handleSubmit} loading={createMutation.isPending} disabled={createMutation.isPending || !isOnline} fullWidth>
              Submit
            </PillButton>
          </View>
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
}
