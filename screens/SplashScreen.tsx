import { View, Text, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';

// Shown while AppContext is resolving the initial Firebase auth state (see
// AppContext's authChecked) — mobile-only concern web doesn't have (a
// browser tab just shows nothing/blank momentarily; a native app needs an
// explicit branded frame or the transition from OS splash to first content
// looks like a flash/glitch).
export function SplashScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.forestDark, gap: 20 }}>
      <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <Image source={require('../assets/brand-mark.png')} style={{ width: 56, height: 56 }} resizeMode="contain" />
      </View>
      <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 24 }}>Mboa Trust</Text>
      <ActivityIndicator color={colors.amber} />
    </View>
  );
}
