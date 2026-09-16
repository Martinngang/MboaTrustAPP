import { View, Text, Pressable, ScrollView } from 'react-native';
import { Globe, Wrench, Store, MapPin, ShieldCheck, Check, X } from 'lucide-react-native';
import { BottomSheetModal } from './BottomSheetModal';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useApp, type Role } from '../context/AppContext';

export interface RoleMeta {
  id: NonNullable<Role>;
  label: string;
  title: string;
  sub: string;
  icon: LucideIcon;
  accent: string;
  bgAccent: string;
}

export const ROLE_DEFINITIONS: RoleMeta[] = [
  {
    id: 'funder',
    label: 'Funder',
    title: 'Diaspora Funder',
    sub: 'Fund projects, hire verified contractors, and invest in land from abroad with escrow protection.',
    icon: Globe,
    accent: '#0F7A52',
    bgAccent: 'rgba(15, 122, 82, 0.12)',
  },
  {
    id: 'contractor',
    label: 'Contractor',
    title: 'Local Contractor',
    sub: 'Browse tenders, submit bids, track milestone submissions, and receive milestone payouts.',
    icon: Wrench,
    accent: '#1E3A5F',
    bgAccent: 'rgba(30, 58, 95, 0.12)',
  },
  {
    id: 'quincaillerie',
    label: 'Quincaillerie',
    title: 'Hardware & Materials Supplier',
    sub: 'Manage building material orders, supply quotes, deliver items to project sites, and get paid.',
    icon: Store,
    accent: '#C9971E',
    bgAccent: 'rgba(201, 151, 30, 0.12)',
  },
  {
    id: 'seller',
    label: 'Land Seller',
    title: 'Land & Property Seller',
    sub: 'List verified plots with title documents, review buyer offers, and coordinate site visits.',
    icon: MapPin,
    accent: '#B23A2E',
    bgAccent: 'rgba(178, 58, 46, 0.12)',
  },
  {
    id: 'verifier',
    label: 'Verifier',
    title: 'Independent Field Verifier',
    sub: 'Conduct objective on-site inspections, verify milestone evidence, and file audit reports.',
    icon: ShieldCheck,
    accent: '#2D4A2D',
    bgAccent: 'rgba(45, 74, 45, 0.12)',
  },
];

export function RoleSelectorModal() {
  const { colors } = useTheme();
  const { activeRole, setActiveRole, roleSelectorOpen, setRoleSelectorOpen, roles } = useApp();

  const handleSelectRole = (role: NonNullable<Role>) => {
    setActiveRole(role);
    setRoleSelectorOpen(false);
  };

  return (
    <BottomSheetModal visible={roleSelectorOpen} onClose={() => setRoleSelectorOpen(false)} maxHeightPct={0.85}>
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
            <View>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                Select Active Role
              </Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                Switch workspace perspective and navigation tabs
              </Text>
            </View>
            <Pressable
              onPress={() => setRoleSelectorOpen(false)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
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

          {/* Role List */}
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 10 }}
            keyboardShouldPersistTaps="handled"
          >
            {ROLE_DEFINITIONS.map((def) => {
              const Icon = def.icon;
              const isCurrent = activeRole === def.id;
              const isAssigned = roles.includes(def.id);

              return (
                <Pressable
                  key={def.id}
                  onPress={() => handleSelectRole(def.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isCurrent }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    padding: 16,
                    borderRadius: 18,
                    borderWidth: 2,
                    borderColor: isCurrent ? def.accent : colors.parchmentDark,
                    backgroundColor: isCurrent ? def.bgAccent : colors.surface,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: def.bgAccent,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={22} color={def.accent} />
                  </View>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
                        {def.title}
                      </Text>
                      {isAssigned && (
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                            backgroundColor: colors.forestLight + '20',
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: FONT.mono,
                              color: colors.forest,
                              fontSize: 9,
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                            }}
                          >
                            Assigned
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={{
                        fontFamily: FONT.sans,
                        color: colors.inkMuted,
                        fontSize: 12,
                        marginTop: 3,
                        lineHeight: 16,
                      }}
                      numberOfLines={2}
                    >
                      {def.sub}
                    </Text>
                  </View>

                  {isCurrent ? (
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: def.accent,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={16} color="#fff" strokeWidth={3} />
                    </View>
                  ) : (
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        borderWidth: 1.5,
                        borderColor: colors.parchmentDark,
                      }}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
    </BottomSheetModal>
  );
}
