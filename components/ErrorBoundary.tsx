import { Component, type ReactNode } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TriangleAlert } from 'lucide-react-native';
import { PillButton } from './PillButton';
import { lightColors } from '../theme/tokens';
import { FONT } from '../theme/tokens';

// Global crash net — mounted once around the whole navigation tree in
// App.tsx. React error boundaries can't use hooks (they must be class
// components), so this can't reach useTheme(); it hardcodes the light
// palette, which is fine for what is meant to be a rare, full-screen "well,
// that broke" fallback rather than a themed part of the normal app. Web has
// no equivalent (a browser tab reload recovers from most render crashes);
// a crashed RN screen has no such implicit reload, so this is required, not
// optional, on mobile — "Try again" just remounts the tree by resetting state.
interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: lightColors.cream }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: lightColors.parchment, alignItems: 'center', justifyContent: 'center' }}>
              <TriangleAlert size={28} color={lightColors.seal} />
            </View>
            <Text style={{ fontFamily: FONT.serifBold, color: lightColors.ink, fontSize: 18, textAlign: 'center' }}>
              Something went wrong
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: lightColors.inkSubtle, fontSize: 13, textAlign: 'center' }}>
              {this.state.error.message || 'An unexpected error occurred.'}
            </Text>
            <PillButton onPress={this.reset}>Try again</PillButton>
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}
