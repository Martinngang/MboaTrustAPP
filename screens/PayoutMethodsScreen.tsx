import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Smartphone,
  Building,
  Check,
  Plus,
  ShieldCheck,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { PillButton } from '../components/PillButton';
import { useToast } from '../components/Toast';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';

export function PayoutMethodsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { show: showToast } = useToast();

  const [selectedMethod, setSelectedMethod] = useState<'mtn_momo' | 'orange_money'>('mtn_momo');
  const [mtnPhone, setMtnPhone] = useState('677123456');
  const [orangePhone, setOrangePhone] = useState('699887766');

  const handleSave = () => {
    showToast({
      title: 'Payout Methods Saved',
      description: 'Your default mobile money payout accounts have been updated.',
      tone: 'success',
    });
    navigation.goBack();
  };

  return (
    <Screen header={<Header title="Payout Methods" subtitle="Mobile Money & Bank settlement" back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Method 1: MTN MoMo */}
        <Card style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#FFCC00', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={20} color="#111" />
              </View>
              <View>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                  MTN Mobile Money
                </Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11 }}>
                  Cameroon (+237)
                </Text>
              </View>
            </View>

            {selectedMethod === 'mtn_momo' && (
              <View style={{ backgroundColor: colors.forest + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, fontWeight: '700' }}>
                  DEFAULT
                </Text>
              </View>
            )}
          </View>

          <TextField
            label="MTN MoMo Account Number"
            placeholder="677123456"
            value={mtnPhone}
            onChangeText={setMtnPhone}
            keyboardType="phone-pad"
          />
        </Card>

        {/* Method 2: Orange Money */}
        <Card style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#FF6600', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={20} color="#fff" />
              </View>
              <View>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                  Orange Money
                </Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11 }}>
                  Cameroon (+237)
                </Text>
              </View>
            </View>
          </View>

          <TextField
            label="Orange Money Account Number"
            placeholder="699887766"
            value={orangePhone}
            onChangeText={setOrangePhone}
            keyboardType="phone-pad"
          />
        </Card>

        <PillButton variant="primary" onPress={handleSave} fullWidth>
          Save Payout Settings
        </PillButton>
      </View>
    </Screen>
  );
}
