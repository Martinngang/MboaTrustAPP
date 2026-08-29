import { View, Text, Pressable } from 'react-native';
import {
  Sun,
  Moon,
  Smartphone,
  Wrench,
  ShieldCheck,
  Store,
  Settings as SettingsIcon,
  ChevronRight,
  Sparkles,
  CheckCircle,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { StatusBadge } from '../components/StatusBadge';
import { PillButton } from '../components/PillButton';
import { useTheme, type ThemePreference } from '../theme/ThemeProvider';
import { FONT, type ThemeColors } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import type { MainStackParamList } from '../navigation/types';
import { ROLE_DEFINITIONS } from '../components/RoleSelectorModal';

const ROLE_LABEL: Record<string, string> = {
  funder: 'Diaspora Funder',
  contractor: 'Local Contractor',
  seller: 'Land / Property Seller',
  quincaillerie: 'Materials Supplier',
  verifier: 'Independent Verifier',
};

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Smartphone },
];

export function ProfileScreen() {
  const { colors, preference, setPreference } = useTheme();
  const { user, name, avatarUrl, roles, activeRole, setRoleSelectorOpen, logout } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const isContractor = roles.includes('contractor');
  const isVerifier = roles.includes('verifier');
  const isQuincaillerie = roles.includes('quincaillerie');

  const currentRoleMeta = ROLE_DEFINITIONS.find((r) => r.id === activeRole) || ROLE_DEFINITIONS[0];
  const CurrentRoleIcon = currentRoleMeta.icon;

  return (
    <Screen>
      <View style={{ padding: 16, gap: 18 }}>
        {/* User Identity Header */}
        <Card style={{ padding: 16, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar name={name} avatarUrl={avatarUrl} size={58} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                {name || 'Mboa Trust User'}
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                {user?.email || user?.phoneNumber || 'Verified Account'}
              </Text>
              <View style={{ alignSelf: 'flex-start', marginTop: 6 }}>
                <StatusBadge status={user?.kycStatus || 'verified'} />
              </View>
            </View>
          </View>
        </Card>

        {/* Active Role & Switcher Card */}
        <Card style={{ padding: 16, backgroundColor: currentRoleMeta.bgAccent, borderColor: currentRoleMeta.accent + '35', gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: currentRoleMeta.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CurrentRoleIcon size={18} color="#fff" />
              </View>
              <View>
                <Text style={{ fontFamily: FONT.mono, color: currentRoleMeta.accent, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
                  Current Workspace View
                </Text>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                  {currentRoleMeta.title}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setRoleSelectorOpen(true)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 10,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: currentRoleMeta.accent + '40',
              }}
            >
              <Text style={{ fontFamily: FONT.sansSemiBold, color: currentRoleMeta.accent, fontSize: 12 }}>
                Switch Role
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Settings Navigation Shortcut */}
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          accessibilityRole="button"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.parchmentDark,
            backgroundColor: colors.surface,
          }}
        >
          <SettingsIcon size={20} color={colors.forest} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
              App Settings & Preferences
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
              Appearance, notifications, language, payouts & security
            </Text>
          </View>
          <ChevronRight size={18} color={colors.inkSubtle} />
        </Pressable>

        {/* Grow Your Account / Self-Service Upgrades */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Account Roles & Certifications
          </Text>
          <MenuRow
            icon={Wrench}
            label={isContractor ? 'Contractor profile completed' : 'Become a contractor'}
            sub="Bid on projects and receive milestone payouts"
            onPress={() => navigation.navigate('ContractorOnboarding')}
            colors={colors}
          />
          <MenuRow
            icon={ShieldCheck}
            label={isVerifier ? 'Verifier registration active' : 'Become a Field Verifier'}
            sub="Inspect construction sites & certify milestones"
            onPress={() => navigation.navigate('VerifierRegister')}
            colors={colors}
          />
        </View>

        {/* Appearance Quick Toggle */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Appearance
          </Text>
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
                    backgroundColor: active ? colors.forest + '14' : colors.surface,
                  }}
                >
                  <Icon size={18} color={active ? colors.forest : colors.inkSubtle} />
                  <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? colors.forest : colors.inkSubtle }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Sign Out Button */}
        <PillButton variant="secondary" onPress={logout} fullWidth>
          Log out
        </PillButton>
      </View>
    </Screen>
  );
}

function MenuRow({
  icon: Icon,
  label,
  sub,
  onPress,
  colors,
}: {
  icon: typeof Wrench;
  label: string;
  sub?: string;
  onPress: () => void;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.parchmentDark,
        backgroundColor: colors.surface,
      }}
    >
      <Icon size={18} color={colors.forest} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>{label}</Text>
        {sub && <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11, marginTop: 1 }}>{sub}</Text>}
      </View>
      <ChevronRight size={16} color={colors.inkSubtle} />
    </Pressable>
  );
}
