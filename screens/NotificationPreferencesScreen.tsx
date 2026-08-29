import { useState } from 'react';
import { View, Text, Switch, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Bell,
  MessageSquare,
  Smartphone,
  ShieldCheck,
  Wallet,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { PillButton } from '../components/PillButton';
import { useToast } from '../components/Toast';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';

export function NotificationPreferencesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { show: showToast } = useToast();

  const [escrowAlerts, setEscrowAlerts] = useState(true);
  const [chatAlerts, setChatAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(false);

  const handleSave = () => {
    showToast({
      title: 'Preferences Saved',
      description: 'Your notification channels have been updated.',
      tone: 'success',
    });
    navigation.goBack();
  };

  return (
    <Screen header={<Header title="Notification Alerts" subtitle="SMS, WhatsApp & Push" back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Card style={{ padding: 16, gap: 14 }}>
          {/* Item 1 */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                Escrow & Payment Alerts
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                Instant notifications when milestones are funded or released
              </Text>
            </View>
            <Switch
              value={escrowAlerts}
              onValueChange={setEscrowAlerts}
              trackColor={{ false: colors.parchmentDark, true: colors.forest }}
            />
          </View>

          {/* Item 2 */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.parchmentDark }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                Chat & Direct Messages
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                Notifications for replies and contractor updates
              </Text>
            </View>
            <Switch
              value={chatAlerts}
              onValueChange={setChatAlerts}
              trackColor={{ false: colors.parchmentDark, true: colors.forest }}
            />
          </View>

          {/* Item 3 */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.parchmentDark }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                SMS Backup Alerts
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                Receive essential security & escrow codes via SMS
              </Text>
            </View>
            <Switch
              value={smsAlerts}
              onValueChange={setSmsAlerts}
              trackColor={{ false: colors.parchmentDark, true: colors.forest }}
            />
          </View>

          {/* Item 4 */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.parchmentDark }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                WhatsApp Delivery Reports
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                Receive material waybills and inspection summaries on WhatsApp
              </Text>
            </View>
            <Switch
              value={whatsappAlerts}
              onValueChange={setWhatsappAlerts}
              trackColor={{ false: colors.parchmentDark, true: colors.forest }}
            />
          </View>
        </Card>

        <PillButton variant="primary" onPress={handleSave} fullWidth>
          Save Notification Settings
        </PillButton>
      </View>
    </Screen>
  );
}
