import { useEffect, useRef } from 'react';
import { Animated, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.6;

/**
 * Shared bottom-sheet chrome for every modal in the app (Notifications,
 * Role selector, Quick action search). Previously each modal hand-rolled
 * its own `Modal + backdrop + rounded sheet`, with no drag-to-dismiss and no
 * keyboard awareness — on a real device, QuickActionModal's auto-focused
 * search input meant the keyboard could overlap the bottom of the results
 * list (a Modal renders in its own native layer, so the screen's own
 * KeyboardAvoidingView never reaches it). This centralizes the fix: a real
 * swipe-down-to-dismiss gesture with a visible grabber handle (the
 * standard iOS/Android bottom-sheet affordance), and a KeyboardAvoidingView
 * so a focused input inside lifts the sheet instead of being covered.
 */
export function BottomSheetModal({
  visible,
  onClose,
  children,
  maxHeightPct = 0.85,
  minHeight,
  contentStyle,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeightPct?: number;
  minHeight?: number;
  contentStyle?: ViewStyle;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 240 }),
      ]).start();
    }
  }, [visible, translateY, backdropOpacity]);

  const closeWithAnimation = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 600, duration: 180, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const snapBack = () => {
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 240 }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY) {
          closeWithAnimation();
        } else {
          snapBack();
        }
      },
      onPanResponderTerminate: snapBack,
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeWithAnimation} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', opacity: backdropOpacity }}>
          <Pressable style={{ flex: 1 }} onPress={closeWithAnimation} accessibilityRole="button" accessibilityLabel="Dismiss" />
        </Animated.View>

        <Animated.View
          style={[
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopWidth: 1,
              borderColor: colors.parchmentDark,
              maxHeight: `${maxHeightPct * 100}%`,
              minHeight,
              transform: [{ translateY }],
            },
            contentStyle,
          ]}
        >
          <View {...panResponder.panHandlers} style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.parchmentDark }} />
          </View>

          {/* KeyboardAvoidingView adjusts the sheet's own layout when a
              focused input inside it triggers the keyboard — Modal content
              sits outside the screen's own KeyboardAvoidingView (it renders
              in a separate native layer), so without this the keyboard
              would simply overlay the bottom of the sheet. Web has no
              on-screen keyboard to avoid, so it skips straight to the
              padded content. */}
          {Platform.OS === 'web' ? (
            <View style={{ paddingBottom: Math.max(insets.bottom, 20), flex: 1 }}>{children}</View>
          ) : (
            <KeyboardAvoidingView
              style={{ flex: 1, paddingBottom: Math.max(insets.bottom, 20) }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              {children}
            </KeyboardAvoidingView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
