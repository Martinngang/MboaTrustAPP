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
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT, type StatusTone } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  type AppNotification,
  type NotifCategory,
} from '../api/notifications';
import { StatusBadge } from './StatusBadge';

const CATEGORIES: { id: NotifCategory | 'all'; label: string; color: string }[] = [
  { id: 'all', label: 'All', color: '#0F7A52' },
  { id: 'funding', label: 'Funding', color: '#0F7A52' },
  { id: 'milestones', label: 'Milestones', color: '#C9971E' },
  { id: 'marketplace', label: 'Marketplace', color: '#1E3A5F' },
  { id: 'verification', label: 'Verification', color: '#2D4A2D' },
  { id: 'messages', label: 'Messages', color: '#B23A2E' },
];

function getCategoryIcon(category: NotifCategory, title: string): LucideIcon {
  if (category === 'funding') return Lock;
  if (category === 'verification') return Compass;
  if (category === 'messages') return MessageSquare;
  if (category === 'marketplace') {
    if (title.toLowerCase().includes('bid')) return ClipboardList;
    if (title.toLowerCase().includes('celebrate') || title.toLowerCase().includes('awarded')) return PartyPopper;
    return HomeIcon;
  }
  if (title.toLowerCase().includes('proof') || title.toLowerCase().includes('evidence')) return Camera;
  if (title.toLowerCase().includes('dispute') || title.toLowerCase().includes('flag')) return Flag;
  if (title.toLowerCase().includes('corrections') || title.toLowerCase().includes('counter')) return RotateCcw;
  return CheckCircle;
}

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
              paddingHorizontal: 20,
              paddingVertical: 16,
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                  Notifications
                </Text>
                {unreadCount > 0 && (
                  <View
                    style={{
                      backgroundColor: colors.seal,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 10, fontWeight: '700' }}>
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {!selectedNotif && unreadCount > 0 && (
                <Pressable
                  onPress={() => markAllRead.mutate()}
                  hitSlop={8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: colors.forest + '15',
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Mark all as read"
                >
                  <CheckCheck size={14} color={colors.forest} />
                  <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, fontWeight: '600' }}>
                    Mark Read
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close notifications"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.parchment,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} color={colors.inkMuted} />
              </Pressable>
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
                const Icon = getCategoryIcon(selectedNotif.category, selectedNotif.title);
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
                  <StatusBadge status={selectedNotif.stat.label.toLowerCase()} />
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
              >
                {CATEGORIES.map((cat) => {
                  const active = activeCategory === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setActiveCategory(cat.id)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: active ? colors.forest : colors.parchmentDark,
                        backgroundColor: active ? colors.forest + '15' : colors.surface,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONT.sansMedium,
                          fontSize: 12,
                          color: active ? colors.forest : colors.inkMuted,
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
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}
                keyboardShouldPersistTaps="handled"
              >
                {isLoading ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <ActivityIndicator color={colors.forest} />
                  </View>
                ) : filteredNotifications.length === 0 ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center', gap: 8 }}>
                    <Bell size={32} color={colors.inkSubtle} opacity={0.5} />
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 13 }}>
                      No notifications in this category
                    </Text>
                  </View>
                ) : (
                  filteredNotifications.map((n) => {
                    const Icon = getCategoryIcon(n.category, n.title);
                    return (
                      <Pressable
                        key={n.id}
                        onPress={() => handleOpenDetail(n)}
                        accessibilityRole="button"
                        style={{
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: 14,
                          borderRadius: 16,
                          backgroundColor: colors.surface,
                          borderWidth: 1,
                          borderColor: colors.parchmentDark,
                          borderLeftWidth: n.unread ? 4 : 1,
                          borderLeftColor: n.unread ? colors.forest : colors.parchmentDark,
                        }}
                      >
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            backgroundColor: colors.forest + '15',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon size={18} color={colors.forest} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text
                              style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13, flex: 1 }}
                              numberOfLines={1}
                            >
                              {n.title}
                            </Text>
                            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>
                              {n.time}
                            </Text>
                          </View>
                          <Text
                            style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, marginTop: 2 }}
                            numberOfLines={2}
                          >
                            {n.body}
                          </Text>
                          {n.stat && (
                            <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                              <StatusBadge status={n.stat.label.toLowerCase()} />
                            </View>
                          )}
                        </View>
                        {n.unread && (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: colors.forest,
                              marginTop: 4,
                            }}
                          />
                        )}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}
    </BottomSheetModal>
  );
}
