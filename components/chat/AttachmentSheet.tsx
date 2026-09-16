import { View, Text, Pressable, Modal } from 'react-native';
import { Image as ImageIcon, FileText } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';

// Mobile equivalent of web's single `<input type="file" accept="image/*,
// video/*,audio/*,.pdf,.doc,.docx,.txt">` — a native file picker doesn't
// exist as one dialog on RN, so this offers the two pickers that cover the
// same ground (photo/video library vs. any document) as a bottom sheet.
export function AttachmentSheet({
  visible,
  onClose,
  onPickMedia,
  onPickDocument,
}: {
  visible: boolean;
  onClose: () => void;
  onPickMedia: () => void;
  onPickDocument: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            paddingTop: 10,
            paddingBottom: 30,
            paddingHorizontal: 16,
            gap: 6,
          }}
        >
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.parchmentDark, alignSelf: 'center', marginBottom: 10 }} />

          <Pressable
            onPress={() => {
              onClose();
              onPickMedia();
            }}
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 10 }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={19} color={colors.forest} />
            </View>
            <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 14 }}>Photo or video</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              onClose();
              onPickDocument();
            }}
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 10 }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={19} color={colors.forest} />
            </View>
            <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 14 }}>Document</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
