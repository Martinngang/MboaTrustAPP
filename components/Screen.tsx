import { View, ScrollView, RefreshControl, StatusBar, KeyboardAvoidingView, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import { NotificationsModal } from './NotificationsModal';
import { RoleSelectorModal } from './RoleSelectorModal';
import { QuickActionModal } from './QuickActionModal';
import { FeedbackSheet } from './FeedbackSheet';

export const TAB_BAR_HEIGHT = 62;

export interface ScreenProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  includeTabBarPadding?: boolean;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  /** Pass both to enable pull-to-refresh (wire `refreshing` to a React
   * Query `isRefetching`/`isFetching` flag and `onRefresh` to its `refetch`).
   * No-op when `scroll` is false, since RefreshControl needs a ScrollView. */
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function Screen({
  children,
  header,
  scroll = true,
  style,
  contentContainerStyle,
  includeTabBarPadding = true,
  edges = ['top', 'left', 'right'],
  refreshing,
  onRefresh,
}: ScreenProps) {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  // Screen is shared by every screen in the app — authenticated (MainStack)
  // and pre-authenticated (Splash/AuthStack/OnboardingStack) alike. It must
  // never assume "authenticated" as its default: the authenticated Header
  // (role switcher, quick-create, notifications bell, avatar → Profile) and
  // the three global modals below all read/act on account state that
  // doesn't exist yet during Login/Signup/Role/Profile-setup, and the
  // avatar's "navigate to Profile" target isn't even a route in those
  // stacks. Gating on `destination === 'home'` — the one state where
  // MainStack is actually mounted — means a screen that simply omits
  // `header` gets the right behavior automatically in every stack, instead
  // of every pre-auth screen having to remember to opt out individually.
  const { destination } = useApp();
  const isAuthenticated = destination === 'home';

  // Calculate bottom inset padding to ensure last item is never hidden behind the fixed bottom tab bar
  const bottomPadding = includeTabBarPadding ? TAB_BAR_HEIGHT + insets.bottom + 20 : Math.max(insets.bottom, 16);

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: colors.cream }, style]}
      edges={edges}
    >
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Fixed Persistent Header (rendered outside scrollable content) — only
          defaults to the authenticated app header inside the authenticated
          stack; pre-auth screens that don't pass `header` correctly get none. */}
      {header !== undefined ? header : isAuthenticated ? <Header /> : null}

      {/* Screen Body with Keyboard Avoidance and Scroll Support — 'undefined'
          on Android made this a no-op, so a focused field's on-screen
          keyboard could cover a form's action button (e.g. Login's "Sign
          in") with nothing to push it back into view. 'height' is Android's
          own correct default behavior for this (resizes the view instead of
          padding it, which is what 'padding' does on iOS). */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              {
                flexGrow: 1,
                paddingBottom: bottomPadding,
              },
              contentContainerStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.forest} colors={[colors.forest]} />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View
            style={[
              {
                flex: 1,
                paddingBottom: bottomPadding,
              },
              contentContainerStyle,
            ]}
          >
            {children}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Global Authenticated Shell Modals — same isAuthenticated gate as the
          header above; these read account/role state that isn't ready pre-auth. */}
      {isAuthenticated && (
        <>
          <NotificationsModal />
          <RoleSelectorModal />
          <QuickActionModal />
          <FeedbackSheet />
        </>
      )}
    </SafeAreaView>
  );
}
