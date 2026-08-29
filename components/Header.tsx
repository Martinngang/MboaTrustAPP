import { View, Text, Pressable } from 'react-native';
import { ChevronLeft, ChevronDown, Bell, Search, Sun, Moon, Sparkles, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { useNotificationsQuery } from '../api/notifications';
import { ROLE_DEFINITIONS } from './RoleSelectorModal';

const QUICK_CREATE_LABELS: Record<string, string> = {
  funder: 'Project',
  contractor: 'Bid',
  quincaillerie: 'Material',
  seller: 'Listing',
  verifier: 'Report',
};

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  action?: React.ReactNode;
  showRoleBadge?: boolean;
  showQuickCreate?: boolean;
  showSearch?: boolean;
  showThemeToggle?: boolean;
  showNotifications?: boolean;
  showAvatar?: boolean;
}

export function Header({
  title,
  subtitle,
  back,
  onBack,
  action,
  showRoleBadge = true,
  showQuickCreate = true,
  showSearch = true,
  showThemeToggle = true,
  showNotifications = true,
  showAvatar = true,
}: HeaderProps) {
  const { colors, mode, preference, setPreference } = useTheme();
  const navigation = useNavigation<any>();
  const {
    activeRole,
    name,
    avatarUrl,
    setNotificationsOpen,
    setRoleSelectorOpen,
    setQuickActionOpen,
  } = useApp();

  const { data: notifData } = useNotificationsQuery(true);
  const unreadCount = notifData?.unreadCount ?? 0;

  const currentRoleMeta = ROLE_DEFINITIONS.find((r) => r.id === activeRole) || ROLE_DEFINITIONS[0];
  const RoleIcon = currentRoleMeta.icon;

  const toggleTheme = () => {
    setPreference(mode === 'dark' ? 'light' : 'dark');
  };

  const isSubScreen = Boolean(back || (title && title !== 'Home' && title !== 'MboaTrust'));

  const handleQuickCreate = () => {
    switch (activeRole) {
      case 'funder':
        navigation.navigate('Projects');
        break;
      case 'contractor':
        navigation.navigate('Jobs');
        break;
      case 'quincaillerie':
        navigation.navigate('Materials');
        break;
      case 'seller':
        navigation.navigate('LandBrowse');
        break;
      case 'verifier':
        navigation.navigate('VerifierTasks');
        break;
      default:
        setQuickActionOpen(true);
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.parchmentDark,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {/* Left: Sub-screen Back & Title OR Brand & Role Switcher */}
        {isSubScreen ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            {back && (
              <Pressable
                onPress={onBack ?? (() => navigation.goBack())}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={{
                  width: 34,
                  height: 34,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 17,
                  backgroundColor: colors.parchment,
                }}
              >
                <ChevronLeft size={20} color={colors.ink} />
              </Pressable>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 17 }}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle && (
                <Text
                  style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11, marginTop: 1 }}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            {/* Brand Logo */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  backgroundColor: colors.forest,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={16} color="#fff" />
              </View>
              <Text
                style={{
                  fontFamily: FONT.serifBold,
                  color: colors.ink,
                  fontSize: 18,
                  letterSpacing: -0.3,
                }}
              >
                Mboa<Text style={{ color: colors.forest }}>Trust</Text>
              </Text>
            </View>

            {/* Role Pill */}
            {showRoleBadge && (
              <Pressable
                onPress={() => setRoleSelectorOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={`Role: ${currentRoleMeta.label}. Tap to change.`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 20,
                  backgroundColor: currentRoleMeta.bgAccent,
                  borderWidth: 1,
                  borderColor: currentRoleMeta.accent + '40',
                }}
              >
                <RoleIcon size={12} color={currentRoleMeta.accent} />
                <Text
                  style={{
                    fontFamily: FONT.mono,
                    color: currentRoleMeta.accent,
                    fontSize: 10,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                  numberOfLines={1}
                >
                  {currentRoleMeta.label}
                </Text>
                <ChevronDown size={11} color={currentRoleMeta.accent} />
              </Pressable>
            )}
          </View>
        )}

        {/* Right Side: Quick Create + Search + Theme + Notifications + Avatar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {action ? (
            action
          ) : (
            <>
              {/* Quick Create Button (Mirrors TopBar's quick-create) */}
              {showQuickCreate && (
                <Pressable
                  onPress={handleQuickCreate}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel={`Create new ${QUICK_CREATE_LABELS[activeRole] || 'item'}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    paddingHorizontal: 9,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: colors.forest,
                  }}
                >
                  <Plus size={14} color="#fff" strokeWidth={2.5} />
                  <Text
                    style={{
                      fontFamily: FONT.sansSemiBold,
                      color: '#fff',
                      fontSize: 11,
                    }}
                  >
                    {QUICK_CREATE_LABELS[activeRole] || 'New'}
                  </Text>
                </Pressable>
              )}

              {/* Quick Search */}
              {showSearch && (
                <Pressable
                  onPress={() => setQuickActionOpen(true)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Search"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.parchment,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Search size={15} color={colors.inkMuted} />
                </Pressable>
              )}

              {/* Theme Switcher */}
              {showThemeToggle && (
                <Pressable
                  onPress={toggleTheme}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch theme`}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.parchment,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {mode === 'dark' ? (
                    <Sun size={15} color={colors.amber} />
                  ) : (
                    <Moon size={15} color={colors.inkMuted} />
                  )}
                </Pressable>
              )}

              {/* Notification Bell */}
              {showNotifications && (
                <Pressable
                  onPress={() => setNotificationsOpen(true)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Notifications, ${unreadCount} unread`}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.parchment,
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <Bell size={15} color={colors.inkMuted} />
                  {unreadCount > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        backgroundColor: colors.seal,
                        minWidth: 14,
                        height: 14,
                        borderRadius: 7,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 2,
                        borderWidth: 1.5,
                        borderColor: colors.surface,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONT.mono,
                          color: '#fff',
                          fontSize: 8,
                          fontWeight: '800',
                        }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </Pressable>
              )}

              {/* User Avatar */}
              {showAvatar && (
                <Pressable
                  onPress={() => navigation.navigate('Profile')}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel="Profile"
                  style={{ marginLeft: 2 }}
                >
                  <Avatar name={name} avatarUrl={avatarUrl} size={32} />
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
}
