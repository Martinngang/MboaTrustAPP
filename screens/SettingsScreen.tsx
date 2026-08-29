import { useState } from 'react';
import { View, Text, Pressable, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Sun,
  Moon,
  Smartphone,
  Bell,
  Globe,
  CreditCard,
  Shield,
  Trash2,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { PillButton } from '../components/PillButton';
import { useTheme, type ThemePreference } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Smartphone },
];

export function SettingsScreen() {
  const { colors, preference, setPreference } = useTheme();
  const { logout, user } = useApp();
  const navigation = useNavigation();
  const { show: showToast } = useToast();

  // Notification Preferences toggles
  const [milestoneNotifs, setMilestoneNotifs] = useState(true);
  const [paymentNotifs, setPaymentNotifs] = useState(true);
  const [messageNotifs, setMessageNotifs] = useState(true);
  const [language, setLanguage] = useState<'en' | 'fr'>('en');

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your Mboa Trust account? This action cannot be undone and will close all pending escrow transactions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            showToast({ title: 'Account deletion requested', description: 'Contacting server...', tone: 'warning' });
            await logout();
          },
        },
      ]
    );
  };

  return (
    <Screen header={<Header title="Settings" back />}>
      <View style={{ padding: 16, gap: 20 }}>
        {/* Appearance Section */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Appearance & Theme
          </Text>
          <Card style={{ padding: 14 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {THEME_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = preference === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setPreference(opt.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 12,
                      borderRadius: 14,
                      borderWidth: 2,
                      borderColor: active ? colors.forest : colors.parchmentDark,
                      backgroundColor: active ? colors.forest + '15' : colors.surface,
                    }}
                  >
                    <Icon size={18} color={active ? colors.forest : colors.inkSubtle} />
                    <Text
                      style={{
                        fontFamily: FONT.sansMedium,
                        fontSize: 12,
                        color: active ? colors.forest : colors.inkSubtle,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Notifications Section */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Notification Preferences
          </Text>
          <Card style={{ padding: 14, gap: 14 }}>
            <ToggleRow
              label="Milestones & Inspections"
              sub="Evidence uploads, approvals, field audits"
              value={milestoneNotifs}
              onValueChange={setMilestoneNotifs}
              colors={colors}
            />
            <View style={{ height: 1, backgroundColor: colors.parchmentDark }} />
            <ToggleRow
              label="Escrow & Payout Alerts"
              sub="Fund lock confirmations, milestone releases"
              value={paymentNotifs}
              onValueChange={setPaymentNotifs}
              colors={colors}
            />
            <View style={{ height: 1, backgroundColor: colors.parchmentDark }} />
            <ToggleRow
              label="Direct Chat Messages"
              sub="Real-time messages from project collaborators"
              value={messageNotifs}
              onValueChange={setMessageNotifs}
              colors={colors}
            />
          </Card>
        </View>

        {/* Language & Regional */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Language & Region
          </Text>
          <Card style={{ padding: 14, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Globe size={18} color={colors.forest} />
                <View>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>Language</Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>English / Français</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {(['en', 'fr'] as const).map((l) => (
                  <Pressable
                    key={l}
                    onPress={() => setLanguage(l)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                      backgroundColor: language === l ? colors.forest : colors.parchment,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONT.mono,
                        fontSize: 11,
                        color: language === l ? '#fff' : colors.inkMuted,
                        textTransform: 'uppercase',
                        fontWeight: '700',
                      }}
                    >
                      {l}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Card>
        </View>

        {/* Payout & Security */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Payouts & Identity Verification
          </Text>
          <Card style={{ padding: 14, gap: 12 }}>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              onPress={() => (navigation as any).navigate('PayoutMethods')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <CreditCard size={18} color={colors.forest} />
                <View>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>Mobile Money Accounts</Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>MTN MoMo & Orange Money</Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.inkSubtle} />
            </Pressable>
            <View style={{ height: 1, backgroundColor: colors.parchmentDark }} />
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              onPress={() => (navigation as any).navigate('Kyc')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Shield size={18} color={colors.forest} />
                <View>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>Identity Verification (KYC)</Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>CNI & Passport Verification</Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.inkSubtle} />
            </Pressable>
          </Card>
        </View>

        {/* Account Actions */}
        <View style={{ gap: 12, marginTop: 8 }}>
          <PillButton variant="secondary" onPress={logout} fullWidth>
            Sign Out of MboaTrust
          </PillButton>

          <Pressable
            onPress={handleDeleteAccount}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 12,
            }}
          >
            <Trash2 size={15} color={colors.seal} />
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 13 }}>
              Delete Account
            </Text>
          </Pressable>
        </View>

        {/* Build Info */}
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11 }}>
            MboaTrust Mobile v1.0.0 (Build 2026.08)
          </Text>
        </View>
      </View>
    </Screen>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onValueChange,
  colors,
}: {
  label: string;
  sub: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  colors: any;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{label}</Text>
        <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 1 }}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.parchmentDark, true: colors.forest }}
        thumbColor="#fff"
      />
    </View>
  );
}
