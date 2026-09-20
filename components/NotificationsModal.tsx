import { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { BottomSheetModal } from './BottomSheetModal';
import {
  Bell,
  CheckCheck,
  X,
  ChevronLeft,
  Lock,
  Camera,
  CheckCircle,
  Flag,
  RotateCcw,
  ClipboardList,
  PartyPopper,
  Compass,
  MessageSquare,
  Home as HomeIcon,
  Settings,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT, type StatusTone } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  type AppNotification,
  type NotifCategory,
  type NotifIcon,
} from '../api/notifications';

// Same labels, order and colour roles as the web drawer's CATEGORY_META
// (MboaTrustFrontend/src/components/NotificationsDrawer.tsx). Colours are
// theme TOKENS, not hex: these used to be hard-coded light-theme values, so in
// dark mode every chip and accent here drifted from web, which reads the
// theme-aware C.forest / C.amber / C.steel / C.moss / C.seal.
type ColorToken = 'forest' | 'amber' | 'steel' | 'moss' | 'seal';
const CATEGORIES: { id: NotifCategory | 'all'; label: string; token: ColorToken }[] = [
  { id: 'all', label: 'All', token: 'forest' },
  { id: 'funding', label: 'Funding', token: 'forest' },
  { id: 'milestones', label: 'Milestones', token: 'amber' },
  { id: 'marketplace', label: 'Marketplace', token: 'steel' },
  { id: 'verification', label: 'Verification', token: 'moss' },
  { id: 'messages', label: 'Messages', token: 'seal' },
];
const CATEGORY_TOKEN: Record<NotifCategory, ColorToken> = {
  funding: 'forest',
  milestones: 'amber',
  marketplace: 'steel',
  verification: 'moss',
  messages: 'seal',
};
const CATEGORY_LABEL: Record<NotifCategory, string> = {
  funding: 'Funding',
  milestones: 'Milestones',
  marketplace: 'Marketplace',
  verification: 'Verification',
  messages: 'Messages',
};
// RN has no color-mix(); web tints at 14% (chips/tags) and 16% (avatar).
// 0x24 ≈ 14%, 0x29 ≈ 16% as 8-digit hex alpha.
const TINT_14 = '24';
const TINT_16 = '29';

// Icon keys come from the notification mapping (api/notifications.ts), which
// picks them by the same per-type rules as web — replacing a title-text
// heuristic that could disagree with web on the same event.
const NOTIF_ICON: Record<NotifIcon, LucideIcon> = {
  lock: Lock,
  camera: Camera,
  checkCircle: CheckCircle,
  flag: Flag,
  refresh: RotateCcw,
  clipboard: ClipboardList,
  celebrate: PartyPopper,
  home: HomeIcon,
  compass: Compass,
  message: MessageSquare,
  bell: Bell,
};

export function NotificationsModal() {
  const { colors } = useTheme();
  const { notificationsOpen, setNotificationsOpen } = useApp();
  const [activeCategory, setActiveCategory] = useState<NotifCategory | 'all'>('all');
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);

  const { data, isLoading, refetch } = useNotificationsQuery(notificationsOpen);
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  const notifications = data?.items || [];
  const unreadCount = data?.unreadCount ?? 0;

  const filteredNotifications = notifications.filter(
    (n) => activeCategory === 'all' || n.category === activeCategory
  );
  // Grouped exactly like the web drawer: a "New" section, an "Earlier"
  // divider only when both groups exist, then the read items.
  const unreadItems = filteredNotifications.filter((n) => n.unread);
  const readItems = filteredNotifications.filter((n) => !n.unread);
  const navigation = useNavigation<any>();
  const openPreferences = () => {
    setSelectedNotif(null);
    setNotificationsOpen(false);
    navigation.navigate('NotificationPreferences');
  };

  const handleOpenDetail = (notif: AppNotification) => {
    setSelectedNotif(notif);
    if (notif.unread) {
      markRead.mutate(notif.id);
    }
  };

  const handleClose = () => {
    setSelectedNotif(null);
    setNotificationsOpen(false);
  };

  return (
    <BottomSheetModal visible={notificationsOpen} onClose={handleClose} maxHeightPct={0.9} minHeight={450}>
      {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              // px-4 py-4, matching the web drawer header
              paddingHorizontal: 16,
              paddingVertical: 16,
              gap: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.parchmentDark,
            }}
          >
            {selectedNotif ? (
              <Pressable
                onPress={() => setSelectedNotif(null)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                accessibilityRole="button"
                accessibilityLabel="Back to list"
              >
                <ChevronLeft size={20} color={colors.forest} />
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 14 }}>
                  All Notifications
                </Text>
              </Pressable>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
                  Notifications
                </Text>
                {unreadCount > 0 && (
                  <View
                    style={{
                      backgroundColor: colors.seal,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 999,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 10, fontWeight: '700' }}>
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Same three 32px icon controls as the web drawer, in the same
                order: mark-all-read (only when there's something unread),
                notification settings, close. The web drawer has no fill on
                these — only a parchment hover — so on touch they're a pressed
                state rather than a permanent filled circle. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {!selectedNotif && unreadCount > 0 && (
                <HeaderIconButton label="Mark all read" onPress={() => markAllRead.mutate()} colors={colors}>
                  <CheckCheck size={15} color={colors.inkMuted} />
                </HeaderIconButton>
              )}
              {!selectedNotif && (
                <HeaderIconButton label="Notification settings" onPress={openPreferences} colors={colors}>
                  <Settings size={15} color={colors.inkMuted} />
                </HeaderIconButton>
              )}
              <HeaderIconButton label="Close notifications" onPress={handleClose} colors={colors}>
                <X size={15} color={colors.inkMuted} />
              </HeaderIconButton>
            </View>
          </View>

          {/* Body */}
          {selectedNotif ? (
            /* Notification Detail View */
            <ScrollView
              contentContainerStyle={{ padding: 20, gap: 16 }}
              keyboardShouldPersistTaps="handled"
            >
              {(() => {
                const Icon = NOTIF_ICON[selectedNotif.icon];
                return (
                  <View style={{ alignItems: 'center', paddingVertical: 16, gap: 12 }}>
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 20,
                        backgroundColor: colors.forest + '18',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={28} color={colors.forest} />
                    </View>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18, textAlign: 'center' }}>
                      {selectedNotif.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View
                        style={{
                          backgroundColor: colors.parchment,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: FONT.mono,
                            color: colors.inkSubtle,
                            fontSize: 10,
                            textTransform: 'uppercase',
                          }}
                        >
                          {selectedNotif.category}
                        </Text>
                      </View>
                      <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11 }}>
                        {selectedNotif.time}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              <View
                style={{
                  backgroundColor: colors.parchment,
                  borderRadius: 16,
                  padding: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.forest,
                }}
              >
                <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 14, lineHeight: 20 }}>
                  {selectedNotif.body}
                </Text>
              </View>

              {selectedNotif.stat && (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: colors.parchmentDark,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>
                    Status / Value
                  </Text>
                  <StatPill stat={selectedNotif.stat} />
                </View>
              )}

              <Pressable
                onPress={handleClose}
                style={{
                  backgroundColor: colors.forest,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  marginTop: 10,
                }}
              >
                <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 14 }}>
                  Dismiss
                </Text>
              </Pressable>
            </ScrollView>
          ) : (
            /* Notification List View */
            <View style={{ flex: 1 }}>
              {/* Category Filter Chips */}
              {/* flexGrow/flexShrink 0 is the fix for the stretched / clipped
                  chips. RN's ScrollView defaults to flexGrow:1, so this
                  horizontal row and the list below were splitting the sheet's
                  height between them, and the chips (row children stretch on
                  the cross axis by default) filled it: tall ~100px boxes in
                  the web preview, squeezed and clipped on a shorter phone
                  sheet. Same bug, two symptoms. It's the web drawer's
                  `flex-shrink-0` row. */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0, flexShrink: 0 }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 6, alignItems: 'center' }}
              >
                {CATEGORIES.map((cat) => {
                  const active = activeCategory === cat.id;
                  const tone = colors[cat.token];
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setActiveCategory(cat.id)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      // web: rounded-full border px-3 py-1.5 text-[11px] font-semibold,
                      // active = the category's own colour at 14% fill
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: active ? tone : colors.parchmentDark,
                        backgroundColor: active ? tone + TINT_14 : colors.surface,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONT.sansSemiBold,
                          fontSize: 11,
                          color: active ? tone : colors.inkMuted,
                        }}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Notification Cards */}
              <ScrollView
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24, gap: 8 }}
                keyboardShouldPersistTaps="handled"
              >
                {isLoading ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <ActivityIndicator color={colors.forest} />
                  </View>
                ) : filteredNotifications.length === 0 ? (
                  // web: plain text, py-16 text-sm inkSubtle
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 14, textAlign: 'center', paddingVertical: 64 }}>
                    No notifications in this category
                  </Text>
                ) : (
                  <>
                    {unreadItems.length > 0 && (
                      <Text style={sectionLabelStyle(colors)}>New</Text>
                    )}
                    {unreadItems.map((n) => (
                      <NotifCard key={n.id} n={n} colors={colors} onOpen={() => handleOpenDetail(n)} />
                    ))}
                    {unreadItems.length > 0 && readItems.length > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
                        <View style={{ flex: 1, height: 1, backgroundColor: colors.parchmentDark }} />
                        <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                          Earlier
                        </Text>
                        <View style={{ flex: 1, height: 1, backgroundColor: colors.parchmentDark }} />
                      </View>
                    )}
                    {readItems.map((n) => (
                      <NotifCard key={n.id} n={n} colors={colors} onOpen={() => handleOpenDetail(n)} />
                    ))}
                  </>
                )}
              </ScrollView>
            </View>
          )}
    </BottomSheetModal>
  );
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

const sectionLabelStyle = (colors: ThemeColors) => ({
  // web: font-mono text-[10px] font-bold uppercase tracking-widest, pt-2
  fontFamily: FONT.mono,
  color: colors.inkSubtle,
  fontSize: 10,
  fontWeight: '700' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: 1.5,
  paddingTop: 8,
  paddingHorizontal: 2,
});

/** 32px round icon control, matching the web drawer's header buttons. */
function HeaderIconButton({
  label,
  onPress,
  colors,
  children,
}: {
  label: string;
  onPress: () => void;
  colors: ThemeColors;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? colors.parchment : 'transparent',
      })}
    >
      {children}
    </Pressable>
  );
}

/** Mirrors the web drawer's NotifCard: 40px tinted avatar in the category's
 * colour, title + category tag, body, optional stat, and a right-hand column
 * with the time stacked over a 6px unread dot. */
function NotifCard({ n, colors, onOpen }: { n: AppNotification; colors: ThemeColors; onOpen: () => void }) {
  const tone = colors[CATEGORY_TOKEN[n.category]];
  const Icon = NOTIF_ICON[n.icon];
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${n.unread ? 'Unread. ' : ''}${n.title}. ${n.body}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 12,
        borderRadius: 16,
        backgroundColor: pressed ? colors.parchment : colors.surface,
        borderWidth: 1,
        borderColor: colors.parchmentDark,
        borderLeftWidth: n.unread ? 3 : 1,
        borderLeftColor: n.unread ? colors.forest : colors.parchmentDark,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 16,
          backgroundColor: tone + TINT_16,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} color={tone} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>{n.title}</Text>
          <View style={{ borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: tone + TINT_14 }}>
            <Text style={{ fontFamily: FONT.mono, color: tone, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {CATEGORY_LABEL[n.category]}
            </Text>
          </View>
        </View>
        {!!n.body && (
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11.5, lineHeight: 15 }}>{n.body}</Text>
        )}
        {n.stat && (
          <View style={{ alignSelf: 'flex-start' }}>
            <StatPill stat={n.stat} />
          </View>
        )}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6, paddingTop: 2, flexShrink: 0 }}>
        <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9.5 }}>{n.time}</Text>
        {n.unread && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.forest }} />}
      </View>
    </Pressable>
  );
}

/** Mirrors the web drawer's NotifStatPill: coloured by the notification's own
 * `tone`. This used to go through StatusBadge with the LABEL as the status,
 * so an amount like "XAF 250 000" — not a status StatusBadge knows — fell
 * back to neutral grey, where web shows it as a green success pill. */
function StatPill({ stat }: { stat: NonNullable<AppNotification['stat']> }) {
  const { statusTones } = useTheme();
  const tone = statusTones[stat.tone] ?? statusTones.neutral;
  return (
    <View style={{ alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: tone.bg }}>
      <Text style={{ fontFamily: FONT.mono, color: tone.text, fontSize: 10, fontWeight: '700' }}>{stat.label}</Text>
    </View>
  );
}
