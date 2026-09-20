import { isValidElement, useContext } from 'react';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
// No StatusBar here on purpose: App.tsx owns the single expo-status-bar
// instance. Two StatusBar components mounted at once fight over barStyle,
// and the last one to mount wins non-deterministically on Android.
import { View, ScrollView, RefreshControl, KeyboardAvoidingView, Platform, type StyleProp, type ViewStyle } from 'react-native';
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
  /** Set when a custom (non-`Header`) `header` pads `useSafeAreaInsets().top`
   * itself, so it can extend its own background under the status bar
   * instead of sitting below a cream strip. `<Header/>` never needs this —
   * it's detected automatically. */
  headerHandlesTopInset?: boolean;
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
  headerHandlesTopInset = false,
}: ScreenProps) {
  const { colors } = useTheme();
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

  // Reserve room for the floating (position:absolute) bottom tab bar — but
  // only when this screen is actually INSIDE the tab navigator.
  // BottomTabBarHeightContext is provided by the tab navigator and is
  // undefined anywhere else. `includeTabBarPadding` defaults to true and no
  // screen ever opted out, so every stack screen pushed on top of the tabs
  // (ChatThread, ProjectDetail, every form…) reserved ~82px for a tab bar that
  // isn't there — an oversized gap on scrolling screens, and a visible dead
  // band under anything pinned to the bottom, like the chat composer.
  const insideTabs = useContext(BottomTabBarHeightContext) !== undefined;
  const reserveTabBar = includeTabBarPadding && insideTabs;
  const bottomPadding = reserveTabBar ? TAB_BAR_HEIGHT + insets.bottom + 20 : Math.max(insets.bottom, 16);

  // The app Header paints the status-bar area itself (with its own
  // `colors.surface`, matching the web TopBar's
  // `paddingTop: max(1rem, env(safe-area-inset-top))`). Letting SafeAreaView
  // also claim the top edge would fill that strip with `colors.cream` instead
  // — in dark mode a near-black #0A0A0D band above a #1B1C21 bar, which is
  // exactly the "separate dark strip" this removes — and would double the
  // top padding on top of Header's own inset.
  //
  // So the top edge is dropped whenever a Header is what's on top: the
  // default one, or a `<Header …/>` passed explicitly (most detail screens
  // do that to set a title/back button). A custom non-Header top section can
  // opt in with `headerHandlesTopInset` once it pads `insets.top` itself.
  // Anything else — the pre-auth stacks, or a custom header that hasn't
  // opted in — keeps the inset here as before.
  const headerIsAppHeader = isValidElement(header) && header.type === Header;
  const headerOwnsTopInset =
    (header === undefined && isAuthenticated) || headerIsAppHeader || headerHandlesTopInset;
  const effectiveEdges = headerOwnsTopInset ? edges.filter((e) => e !== 'top') : edges;

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: colors.cream }, style]}
      edges={effectiveEdges}
    >

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
