import { View, Text } from 'react-native';
import { Landmark } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { PillButton } from '../../components/PillButton';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

// Mobile-only entry point (web's marketing LandingScreen is a full desktop
// page that doesn't translate to a phone) — a focused brand moment with the
// two real doors into the app: start onboarding, or sign in to an existing
// account.
export function WelcomeScreen({ navigation }: Props) {
  const { colors } = useTheme();

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        <View />

        <View style={{ alignItems: 'center', gap: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: colors.forestDark, alignItems: 'center', justifyContent: 'center' }}>
            <Landmark size={32} color={colors.amber} />
          </View>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 28, textAlign: 'center' }}>Mboa Trust</Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 300 }}>
            Verified projects, contractors, and land — before your money moves.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <PillButton onPress={() => navigation.navigate('Language')} fullWidth>
            Get started
          </PillButton>
          <PillButton onPress={() => navigation.navigate('Login')} variant="secondary" fullWidth>
            I already have an account
          </PillButton>
        </View>
      </View>
    </Screen>
  );
}
