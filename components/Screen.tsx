import { View, ScrollView, StatusBar, KeyboardAvoidingView, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Header } from './Header';
import { NotificationsModal } from './NotificationsModal';
import { RoleSelectorModal } from './RoleSelectorModal';
import { QuickActionModal } from './QuickActionModal';

export const TAB_BAR_HEIGHT = 62;

export interface ScreenProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  includeTabBarPadding?: boolean;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}

export function Screen({
  children,
  header,
  scroll = true,
  style,
  contentContainerStyle,
  includeTabBarPadding = true,
  edges = ['top', 'left', 'right'],
}: ScreenProps) {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();

  // Calculate bottom inset padding to ensure last item is never hidden behind the fixed bottom tab bar
  const bottomPadding = includeTabBarPadding ? TAB_BAR_HEIGHT + insets.bottom + 20 : Math.max(insets.bottom, 16);

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: colors.cream }, style]}
      edges={edges}
    >
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Fixed Persistent Header (rendered outside scrollable content) */}
      {header !== undefined ? header : <Header />}

      {/* Screen Body with Keyboard Avoidance and Scroll Support */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

      {/* Global Authenticated Shell Modals */}
      <NotificationsModal />
      <RoleSelectorModal />
      <QuickActionModal />
    </SafeAreaView>
  );
}
