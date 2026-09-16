import './global.css';

import { useCallback, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './theme/ThemeProvider';
import { useAppFonts } from './theme/useAppFonts';
import { AppProvider, useApp } from './context/AppContext';
import { OfflineQueueProvider } from './context/OfflineQueueContext';
import { FeeConfigProvider } from './context/FeeConfigContext';
import { RootNavigator } from './navigation/RootNavigator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { GlobalLoadingBar } from './components/GlobalLoadingBar';
import { StripeRootWrapper } from './components/StripeRootWrapper';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

// Navigation's own light/dark theme (link/border/background colors used by
// the nav container itself, header defaults, etc.) kept in sync with our
// ThemeProvider so a screen transition never flashes the wrong background
// behind it while animating.
function NavigationRoot() {
  const { colors, mode } = useTheme();
  const { destination } = useApp();
  const navTheme = {
    dark: mode === 'dark',
    colors: {
      primary: colors.forest,
      background: colors.cream,
      card: colors.surface,
      text: colors.ink,
      border: colors.parchmentDark,
      notification: colors.seal,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium: { fontFamily: 'System', fontWeight: '500' as const },
      bold: { fontFamily: 'System', fontWeight: '700' as const },
      heavy: { fontFamily: 'System', fontWeight: '900' as const },
    },
  };

  return (
    // RootNavigator conditionally mounts an entirely different top-level
    // Stack (AuthStack/OnboardingStack/MainStack/AdminGateScreen) based on
    // `destination`, but NavigationContainer itself never unmounts across
    // that swap — it's declared once here. Without a key tied to
    // `destination`, NavigationContainer's own internal navigation-state
    // tree survives the swap and gets handed to whichever new Stack just
    // mounted; since a few route names deliberately exist in more than one
    // stack (QuincaillerieRegister, VerifierRegister), the new Stack was
    // rehydrating that leftover state and landing directly on the old
    // route instead of its own initialRouteName — e.g. finishing
    // Quincaillerie/Verifier registration during onboarding landed back on
    // the registration form instead of Home. Keying on `destination` forces
    // a fully fresh navigation-state tree on every real transition.
    <NavigationContainer key={destination} theme={navTheme}>
      <RootNavigator />
      <GlobalLoadingBar />
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  const fontsReady = useAppFonts();

  const onLayoutRootView = useCallback(async () => {
    if (fontsReady) await SplashScreen.hideAsync();
  }, [fontsReady]);

  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady]);

  if (!fontsReady) return null;

  const app = (
    <AppProvider>
      <FeeConfigProvider>
        <OfflineQueueProvider>
          <NavigationRoot />
        </OfflineQueueProvider>
      </FeeConfigProvider>
    </AppProvider>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <ToastProvider>
                <StripeRootWrapper>{app}</StripeRootWrapper>
              </ToastProvider>
            </QueryClientProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
