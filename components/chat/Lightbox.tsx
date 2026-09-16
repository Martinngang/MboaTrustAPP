import { View, Image, Pressable, Modal } from 'react-native';
import { X } from 'lucide-react-native';

// Ported from MboaTrustFrontend/src/screens/MessagingScreens.tsx's
// LightboxModal — full-screen tap-to-dismiss preview for an image message.
export function Lightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  return (
    <Modal visible={Boolean(url)} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' }} onPress={onClose}>
        {url && <Image source={{ uri: url }} style={{ width: '92%', height: '75%' }} resizeMode="contain" />}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          style={{ position: 'absolute', top: 54, right: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={18} color="#fff" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
