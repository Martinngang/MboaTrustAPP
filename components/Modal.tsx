import { Modal as RNModal, View, Pressable, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

// Covers both shapes web uses across its various overlays (e.g.
// MessagingScreens.tsx's NewChatModal/LightboxModal — centered card, vs a
// bottom-anchored action sheet) with one component and a `placement` prop,
// rather than two near-identical implementations. Built on RN's own Modal
// (no extra native dependency) — sufficient for a fade/overlay dialog; a
// gesture-driven drag-to-dismiss sheet can layer on top of this later if a
// specific screen needs it.
export function Modal({
  visible,
  onClose,
  children,
  placement = 'center',
  style,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  placement?: 'center' | 'bottom';
  style?: ViewStyle;
}) {
  const { colors } = useTheme();

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {/* Deliberately no accessibilityRole="button" here — on web that
          renders an actual <button>, which cannot legally contain the real
          buttons inside the card below (invalid nested-button HTML, and
          Chrome auto-closes/reparents it, breaking child click targeting).
          This backdrop's only job is tap-to-dismiss; the real interactive
          content is the card and everything inside it. */}
      <Pressable
        onPress={onClose}
        accessibilityLabel="Close"
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: placement === 'bottom' ? 'flex-end' : 'center',
          alignItems: placement === 'bottom' ? 'stretch' : 'center',
          padding: placement === 'bottom' ? 0 : 20,
        }}
      >
        {/* Stops the inner card's own taps from bubbling to the overlay's onClose. */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            {
              backgroundColor: colors.cream,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderBottomLeftRadius: placement === 'bottom' ? 0 : 24,
              borderBottomRightRadius: placement === 'bottom' ? 0 : 24,
              width: placement === 'bottom' ? '100%' : '100%',
              maxWidth: placement === 'bottom' ? undefined : 400,
              padding: 20,
            },
            style,
          ]}
        >
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
