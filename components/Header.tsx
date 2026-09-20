import { useState } from 'react';
import { View, Text, Image, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronDown, Bell, Search, Sun, Moon, Plus, LifeBuoy, MoreHorizontal } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { ConnectivityIndicator } from './ConnectivityIndicator';
import { useNotificationsQuery } from '../api/notifications';
import { ROLE_DEFINITIONS } from './RoleSelectorModal';

// "ProjectDetail" -> "Project Detail" — no manual per-route label map needed.
function humanizeRouteName(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, '$1 $2');
}

const QUICK_CREATE_LABELS: Record<string, string> = {
  funder: 'Project',
  contractor: 'Bid',
  quincaillerie: 'Material',
  seller: 'Listing',
  verifier: 'Report',
};

export interface HeaderProps {
  title?: string;
  /** Small inline element rendered right after the title (e.g. an "AI" pill). */
  titleBadge?: React.ReactNode;
  /** Rendered between the back button and the title on sub-screens — e.g. a
   * chat thread's contact avatar, matching the web chat header. */
  leading?: React.ReactNode;
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
  titleBadge,
  leading,
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
  const route = useRoute();
  const {
    activeRole,
    name,
    avatarUrl,
    setNotificationsOpen,
    setRoleSelectorOpen,
    setQuickActionOpen,
    setFeedbackSheetOpen,
  } = useApp();

  const { data: notifData } = useNotificationsQuery(true);
  const unreadCount = notifData?.unreadCount ?? 0;

  const insets = useSafeAreaInsets();
  const [moreOpen, setMoreOpen] = useState(false);
  const isSubScreen = Boolean(back || (title && title !== 'Home' && title !== 'MboaTrust'));
  // Measured rather than assumed, so the overflow menu still lands just under
  // the bar when the user's system font scale makes the header taller.
  // The header always sits at the very top of the screen (Screen drops its
  // own top inset whenever a Header renders), so its height is its bottom edge.
  const [headerHeight, setHeaderHeight] = useState(0);

  // ── Responsive collapse ────────────────────────────────────────────────
  // Mirrors the web TopBar's intent (src/components/shell/TopBar.tsx: the
  // quick-create pill collapses to a 32px icon below `lg`, secondary controls
  // step aside rather than overlap), but decided by MEASUREMENT, not a fixed
  // breakpoint. A breakpoint can't hold here: the row's real width depends on
  // the role label ("FUNDER" vs "QUINCAILLERIE"), the quick-create label, the
  // user's system font scale, and the connectivity indicator — an 8px dot
  // online that grows into an "Offline" / "3 pending" pill. A 400dp rule was
  // tried first and still painted "+ Project" over the wordmark at 412dp.
  //
  // Tiers, each keeping every action reachable:
  //   0  everything inline
  //   1  quick-create → icon only
  //   2  search / theme / help → overflow menu
  //   3  role pill → compact chip (icon only, still opens the role switcher)
  //   4  role switcher → overflow menu
  //   5  wordmark hidden, logo kept
  // The brand wordmark is deliberately the LAST thing to go. An earlier
  // ordering hid it at 390dp (iPhone 12–16, the most common width) over a
  // 5px shortfall while ~100px sat empty mid-bar.
  const [rowWidth, setRowWidth] = useState(0);
  const [connWidth, setConnWidth] = useState(8);
  const [natural, setNatural] = useState<{ brand?: number; role?: number; qc?: number }>({});
  const measure = (key: 'brand' | 'role' | 'qc') => (e: { nativeEvent: { layout: { width: number } } }) => {
    const w = Math.ceil(e.nativeEvent.layout.width);
    setNatural((prev) => (prev[key] === w ? prev : { ...prev, [key]: w }));
  };

  const GAP = 8;
  const ICON = 32;
  const ROLE_ICON_ONLY_W = 30; // 12 icon + 16 padding + 2 border (no chevron in compact form)
  const MIN_TITLE_W = 120; // a sub-screen title should never be squeezed below this
  const secondaryCount = (showSearch ? 1 : 0) + (showThemeToggle ? 1 : 0) + 1; // + help

  const measured =
    rowWidth > 0 &&
    (isSubScreen || natural.brand !== undefined) &&
    (isSubScreen || !showRoleBadge || natural.role !== undefined) &&
    (!!action || !showQuickCreate || natural.qc !== undefined);

  const rightWidthAt = (lvl: number) => {
    const items: number[] = [];
    if (showQuickCreate) items.push(lvl >= 1 ? ICON : natural.qc ?? ICON);
    items.push(connWidth);
    if (lvl >= 2) items.push(ICON);
    else for (let i = 0; i < secondaryCount; i++) items.push(ICON);
    if (showNotifications) items.push(ICON);
    if (showAvatar) items.push(ICON + 2);
    return items.reduce((a, b) => a + b, 0) + GAP * (items.length - 1);
  };
  const leftWidthAt = (lvl: number) => {
    if (isSubScreen) return (back ? 34 + 10 : 0) + MIN_TITLE_W;
    let w = lvl >= 5 ? 28 : natural.brand ?? 28;
    if (showRoleBadge && lvl < 4) w += 10 + (lvl >= 3 ? ROLE_ICON_ONLY_W : natural.role ?? ROLE_ICON_ONLY_W);
    return w;
  };

  // Until the first measurement lands, render collapsed (tier 2) — erring
  // tight for one frame is invisible; erring wide would flash an overlap.
  let level = 2;
  if (measured && !action) {
    level = 5;
    for (let lvl = 0; lvl <= 5; lvl++) {
      if (leftWidthAt(lvl) + GAP + rightWidthAt(lvl) <= rowWidth) {
        level = lvl;
        break;
      }
    }
  }
  const compact = level >= 1;
  const showInlineSecondary = level < 2;
  const roleIconOnly = level === 3;
  const roleInBar = level < 4;
  const showWordmark = level < 5;

  const currentRoleMeta = ROLE_DEFINITIONS.find((r) => r.id === activeRole) || ROLE_DEFINITIONS[0];
  const RoleIcon = currentRoleMeta.icon;

  const toggleTheme = () => {
    setPreference(mode === 'dark' ? 'light' : 'dark');
  };

  // Shared by the visible row and the hidden measurer below, so what gets
  // measured is exactly what would be drawn at full width.
  const renderBrand = (withWordmark: boolean) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Image source={require('../assets/brand-mark.png')} style={{ width: 22, height: 22 }} resizeMode="contain" />
      </View>
      {withWordmark && (
        <Text numberOfLines={1} style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18, letterSpacing: -0.3 }}>
          Mboa<Text style={{ color: colors.forest }}>Trust</Text>
        </Text>
      )}
    </View>
  );

  const rolePillStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: currentRoleMeta.bgAccent,
    borderWidth: 1,
    borderColor: currentRoleMeta.accent + '40',
  };
  const rolePillBody = (iconOnly: boolean) => (
    <>
      <RoleIcon size={12} color={currentRoleMeta.accent} />
      {!iconOnly && (
        <Text
          numberOfLines={1}
          style={{
            fontFamily: FONT.mono,
            color: currentRoleMeta.accent,
            fontSize: 10,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            flexShrink: 1,
          }}
        >
          {currentRoleMeta.label}
        </Text>
      )}
      {!iconOnly && <ChevronDown size={11} color={currentRoleMeta.accent} />}
    </>
  );

  const quickCreateStyle = (iconOnly: boolean) =>
    iconOnly
      ? { width: 32, height: 32, borderRadius: 16, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: colors.forest }
      : {
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          gap: 3,
          paddingHorizontal: 9,
          paddingVertical: 6,
          borderRadius: 16,
          backgroundColor: colors.forest,
        };
  const quickCreateBody = (iconOnly: boolean) => (
    <>
      <Plus size={iconOnly ? 16 : 14} color="#fff" strokeWidth={2.5} />
      {!iconOnly && (
        <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 11 }}>
          {QUICK_CREATE_LABELS[activeRole] || 'New'}
        </Text>
      )}
    </>
  );

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
      onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      style={{
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.parchmentDark,
        paddingHorizontal: 16,
        // The header paints the status-bar area itself, exactly as the web
        // TopBar does with `paddingTop: max(1rem, env(safe-area-inset-top))`.
        // Previously Screen's SafeAreaView owned the top inset and filled it
        // with `colors.cream` while the header below it was `colors.surface`
        // — in dark mode that put a near-black #0A0A0D strip above a #1B1C21
        // bar, which read as a separate dark band rather than one surface.
        // Screen now excludes the 'top' edge when this header renders.
        paddingTop: insets.top + 10,
        paddingBottom: 12,
      }}
    >
      {/* Hidden measurer — the full-width forms of the three variable-width
          pieces, laid out off-flow at opacity 0 so their natural widths are
          always known even while the visible row shows the collapsed forms
          (a collapsed pill can't tell you how wide it would be expanded).
          Each sits in its own absolute box so none is squeezed by the
          others. Non-interactive and hidden from assistive tech — these
          are plain Views, never Pressables, so they add no duplicate
          "Role…" / "Create new…" controls to the accessibility tree. */}
      {/* left:0 + right:0 matters: an absolute child is measured AT MOST its
          container's width, so a zero-width container would squeeze the text
          and report a falsely narrow "natural" width. */}
      <View pointerEvents="none" aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: 0, opacity: 0 }}>
        {!isSubScreen && (
          <View style={{ position: 'absolute', left: 0, top: 0 }} onLayout={measure('brand')}>
            {renderBrand(true)}
          </View>
        )}
        {!isSubScreen && showRoleBadge && (
          <View style={{ position: 'absolute', left: 0, top: 0 }} onLayout={measure('role')}>
            <View style={rolePillStyle}>{rolePillBody(false)}</View>
          </View>
        )}
        {!action && showQuickCreate && (
          <View style={{ position: 'absolute', left: 0, top: 0 }} onLayout={measure('qc')}>
            <View style={quickCreateStyle(false)}>{quickCreateBody(false)}</View>
          </View>
        )}
      </View>

      <View
        onLayout={(e) => setRowWidth(Math.floor(e.nativeEvent.layout.width))}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
      >
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
            {leading}
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 17, flexShrink: 1 }}
                  numberOfLines={1}
                >
                  {title}
                </Text>
                {titleBadge}
              </View>
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
          // overflow:hidden + minWidth:0 is the hard guarantee: whatever the
          // tier maths decides, this cluster can shrink and clip but can never
          // paint underneath the right-hand controls, which is what produced
          // the "+ Project" drawn over the wordmark.
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, overflow: 'hidden' }}>
            {renderBrand(showWordmark)}

            {/* Role Pill — compact chip at tier 3, moves into the overflow
                menu at tier 4 (see the "Switch role" item below) */}
            {showRoleBadge && roleInBar && (
              <Pressable
                onPress={() => setRoleSelectorOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={`Role: ${currentRoleMeta.label}. Tap to change.`}
                style={{ ...rolePillStyle, flexShrink: 1, minWidth: 0 }}
              >
                {rolePillBody(roleIconOnly)}
              </Pressable>
            )}
          </View>
        )}

        {/* Right Side: Quick Create + Search + Theme + Notifications + Avatar */}
        {/* gap 8 matches the web TopBar's `gap-2` on the same cluster. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {action ? (
            action
          ) : (
            <>
              {/* Quick Create — labelled pill when there's room, 32px icon
                  button when there isn't, the same collapse the web TopBar
                  does between its `lg:inline-flex` pill and `lg:hidden` icon. */}
              {showQuickCreate && (
                <Pressable
                  onPress={handleQuickCreate}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel={`Create new ${QUICK_CREATE_LABELS[activeRole] || 'item'}`}
                  style={quickCreateStyle(compact)}
                >
                  {quickCreateBody(compact)}
                </Pressable>
              )}

              {/* Measured live, not cached: it's an 8px dot online but grows
                  into an "Offline" / "3 pending" pill, and the tiers have to
                  re-flow the moment that happens. */}
              <View onLayout={(e) => setConnWidth(Math.ceil(e.nativeEvent.layout.width))}>
                <ConnectivityIndicator />
              </View>

              {/* Quick Search */}
              {showSearch && showInlineSecondary && (
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
              {showThemeToggle && showInlineSecondary && (
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

              {/* Help & feedback — reachable from every screen, captures the
                  current route name as context at the moment it's tapped. */}
              {showInlineSecondary && (
                <Pressable
                  onPress={() => setFeedbackSheetOpen(true, { screen: route.name, screenLabel: humanizeRouteName(route.name) })}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Help & feedback"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.parchment,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LifeBuoy size={15} color={colors.inkMuted} />
                </Pressable>
              )}

              {/* Overflow — only appears when the secondary controls above
                  had to be collapsed, so nothing is ever merely hidden. */}
              {!showInlineSecondary && (
                <Pressable
                  onPress={() => setMoreOpen(true)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="More actions"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.parchment,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MoreHorizontal size={15} color={colors.inkMuted} />
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
                  {/* Same as the web NotificationBell (MobileLayout.tsx): bell
                      drawn in ink, and a 16px seal badge sitting just OUTSIDE
                      the corner (`-right-0.5 -top-0.5 h-4 min-w-[16px]
                      text-[9px] font-bold`), not tucked inside the circle. */}
                  <Bell size={15} color={colors.ink} />
                  {unreadCount > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        backgroundColor: colors.seal,
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONT.mono,
                          color: '#fff',
                          fontSize: 9,
                          fontWeight: '700',
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

      {/* Overflow sheet — anchored under the header rather than centred, so it
          reads as a menu belonging to the bar (the web TopBar's avatar
          dropdown does the same with `absolute right-0 top-11`). Styling is
          deliberately the same system: surface fill, parchmentDark hairline
          border, 12px radius. */}
      {/* statusBarTranslucent/navigationBarTranslucent are load-bearing, not
          cosmetic: without them an Android Modal lays out from *below* the
          status bar, so the `insets.top + 52` anchor below would land a full
          status-bar-height too low (iOS modals always start at the true top,
          which is what that maths assumes). They also let the scrim dim the
          whole screen instead of stopping short of both system bars. */}
      <Modal
        visible={moreOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setMoreOpen(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={() => setMoreOpen(false)}>
          <View
            style={{
              position: 'absolute',
              // 6px below the bar's hairline — the same small gap the web
              // TopBar's dropdown leaves under its trigger (`top-11`).
              top: (headerHeight || insets.top + 56) + 6,
              right: 12,
              minWidth: 196,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.parchmentDark,
              backgroundColor: colors.surface,
              paddingVertical: 4,
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8,
            }}
          >
            {showRoleBadge && !roleInBar && (
              <MoreMenuItem
                icon={<RoleIcon size={16} color={currentRoleMeta.accent} />}
                label={`Switch role · ${currentRoleMeta.label}`}
                colors={colors}
                onPress={() => {
                  setMoreOpen(false);
                  setRoleSelectorOpen(true);
                }}
              />
            )}
            {showSearch && (
              <MoreMenuItem
                icon={<Search size={16} color={colors.inkMuted} />}
                label="Search"
                colors={colors}
                onPress={() => {
                  setMoreOpen(false);
                  setQuickActionOpen(true);
                }}
              />
            )}
            {showThemeToggle && (
              <MoreMenuItem
                icon={mode === 'dark' ? <Sun size={16} color={colors.amber} /> : <Moon size={16} color={colors.inkMuted} />}
                label={mode === 'dark' ? 'Light mode' : 'Dark mode'}
                colors={colors}
                onPress={() => {
                  setMoreOpen(false);
                  toggleTheme();
                }}
              />
            )}
            <MoreMenuItem
              icon={<LifeBuoy size={16} color={colors.inkMuted} />}
              label="Help & feedback"
              colors={colors}
              onPress={() => {
                setMoreOpen(false);
                setFeedbackSheetOpen(true, { screen: route.name, screenLabel: humanizeRouteName(route.name) });
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/** One row of the overflow menu — matches the web dropdown's row rhythm
 * (icon + label, generous hit area, no dividers between peers). */
function MoreMenuItem({
  icon,
  label,
  onPress,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        backgroundColor: pressed ? colors.parchment : 'transparent',
      })}
    >
      {icon}
      <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}
