import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import {
  FolderKanban,
  Briefcase,
  Store,
  MapPin,
  ShieldCheck,
  Plus,
  ArrowRight,
  TrendingUp,
  FileCheck,
  CreditCard,
  Users,
  Search,
  Sparkles,
  Layers,
  CheckCircle2,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { fmt } from '../components/fmt';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import { useMyProjectsQuery } from '../api/projects';
import { ROLE_DEFINITIONS } from '../components/RoleSelectorModal';

interface QuickActionDef {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

export function HomeScreen() {
  const { colors } = useTheme();
  const { name, user, activeRole, setRoleSelectorOpen } = useApp();
  const navigation = useNavigation<any>();

  const currentRoleMeta = ROLE_DEFINITIONS.find((r) => r.id === activeRole) || ROLE_DEFINITIONS[0];
  const RoleIcon = currentRoleMeta.icon;

  const isFunder = activeRole === 'funder';
  const { data: projects, isLoading } = useMyProjectsQuery(isFunder ? user?._id : undefined);

  // Role-specific stats & quick actions matching web Dashboard.tsx
  const getRoleDashboardData = () => {
    switch (activeRole) {
      case 'funder':
        return {
          eyebrow: 'Funder Workspace',
          subtitle: 'Track your funded projects, review milestone proofs, and release escrow payments with confidence.',
          stats: [
            { label: 'Total Funded', value: 'XAF 14.5M' },
            { label: 'Active Projects', value: String(projects?.length || 1) },
            { label: 'Pending Reviews', value: '2 Milestones' },
          ],
          quickActions: [
            { icon: Plus, label: 'New Project', onPress: () => navigation.navigate('Projects') },
            { icon: Search, label: 'Browse Projects', onPress: () => navigation.navigate('Projects') },
            { icon: FileCheck, label: 'Milestone Review', onPress: () => navigation.navigate('Projects') },
            { icon: CreditCard, label: 'Escrow Deposits', onPress: () => navigation.navigate('Activity') },
          ],
        };
      case 'contractor':
        return {
          eyebrow: 'Contractor Workspace',
          subtitle: 'Bid on verified tenders, submit milestone evidence, and receive direct escrow releases.',
          stats: [
            { label: 'Available Tenders', value: '12 Open' },
            { label: 'Active Bids', value: '2 Pending' },
            { label: 'Total Earnings', value: 'XAF 6.8M' },
          ],
          quickActions: [
            { icon: Search, label: 'Browse Jobs', onPress: () => navigation.navigate('Jobs') },
            { icon: Plus, label: 'Submit Bid', onPress: () => navigation.navigate('Jobs') },
            { icon: FileCheck, label: 'Submit Evidence', onPress: () => navigation.navigate('Jobs') },
            { icon: TrendingUp, label: 'Earnings & Payouts', onPress: () => navigation.navigate('Activity') },
          ],
        };
      case 'quincaillerie':
        return {
          eyebrow: 'Supplier Workspace',
          subtitle: 'Receive building material requests, dispatch deliveries, and get paid directly from project escrow.',
          stats: [
            { label: 'Pending Orders', value: '3 Requested' },
            { label: 'Dispatched', value: '24 Delivered' },
            { label: 'Escrow Revenue', value: 'XAF 4.2M' },
          ],
          quickActions: [
            { icon: Store, label: 'Supply Orders', onPress: () => navigation.navigate('Materials') },
            { icon: Plus, label: 'Add Item', onPress: () => navigation.navigate('Materials') },
            { icon: Layers, label: 'Catalog Pricing', onPress: () => navigation.navigate('Materials') },
            { icon: CreditCard, label: 'Store Payouts', onPress: () => navigation.navigate('Activity') },
          ],
        };
      case 'seller':
        return {
          eyebrow: 'Land Seller Workspace',
          subtitle: 'List verified plots with cadastral titles, manage buyer offers, and coordinate site visits.',
          stats: [
            { label: 'Listed Plots', value: '3 Active' },
            { label: 'Verified Titles', value: '100% Titre Foncier' },
            { label: 'Buyer Inquiries', value: '8 Inquiries' },
          ],
          quickActions: [
            { icon: Plus, label: 'New Listing', onPress: () => navigation.navigate('LandBrowse') },
            { icon: Search, label: 'Marketplace', onPress: () => navigation.navigate('LandBrowse') },
            { icon: ShieldCheck, label: 'Title Deeds', onPress: () => navigation.navigate('LandBrowse') },
            { icon: Users, label: 'Buyer Offers', onPress: () => navigation.navigate('Messages') },
          ],
        };
      case 'verifier':
        return {
          eyebrow: 'Field Verifier Workspace',
          subtitle: 'Conduct objective on-site inspections, certify construction milestones, and protect funder escrow.',
          stats: [
            { label: 'Pending Tasks', value: '2 Queued' },
            { label: 'Inspections Done', value: '18 Sites' },
            { label: 'Trust Rating', value: '99.4%' },
          ],
          quickActions: [
            { icon: ShieldCheck, label: 'Task Queue', onPress: () => navigation.navigate('VerifierTasks') },
            { icon: FileCheck, label: 'Submit Report', onPress: () => navigation.navigate('VerifierTasks') },
            { icon: CheckCircle2, label: 'Completed Audits', onPress: () => navigation.navigate('Activity') },
            { icon: MapPin, label: 'Inspection Map', onPress: () => navigation.navigate('VerifierTasks') },
          ],
        };
      default:
        return {
          eyebrow: 'Workspace',
          subtitle: 'Welcome to MboaTrust platform.',
          stats: [],
          quickActions: [],
        };
    }
  };

  const dashboardData = getRoleDashboardData();

  return (
    <Screen>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Dashboard Hero (Mirrors web DashboardHero) */}
        <View
          style={{
            backgroundColor: colors.forestDark,
            borderRadius: 24,
            padding: 20,
            gap: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          {/* Header Row with Role Switcher */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: FONT.mono,
                color: 'rgba(255,255,255,0.7)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
              }}
            >
              {dashboardData.eyebrow}
            </Text>
            <Pressable
              onPress={() => setRoleSelectorOpen(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.18)',
              }}
            >
              <RoleIcon size={12} color="#fff" />
              <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 10, fontWeight: '700' }}>
                {currentRoleMeta.label}
              </Text>
            </Pressable>
          </View>

          {/* User Name & Subtitle */}
          <View>
            <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 22 }}>
              {name || 'Marie-Claire N.'}
            </Text>
            <Text
              style={{
                fontFamily: FONT.sans,
                color: 'rgba(255,255,255,0.85)',
                fontSize: 12,
                marginTop: 4,
                lineHeight: 17,
              }}
            >
              {dashboardData.subtitle}
            </Text>
          </View>

          {/* 3 Stat Tiles */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {dashboardData.stats.map((stat, idx) => (
              <View
                key={idx}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 16,
                  paddingVertical: 10,
                  paddingHorizontal: 6,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT.serifBold,
                    color: '#fff',
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                  numberOfLines={1}
                >
                  {stat.value}
                </Text>
                <Text
                  style={{
                    fontFamily: FONT.mono,
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 8,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginTop: 2,
                    textAlign: 'center',
                  }}
                  numberOfLines={1}
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions Grid (Mirrors web QuickActionsGrid) */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontFamily: FONT.mono,
              color: colors.inkSubtle,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
            }}
          >
            Quick Actions
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {dashboardData.quickActions.slice(0, 2).map((qa, i) => {
              const QAIcon = qa.icon;
              return (
                <Pressable
                  key={i}
                  onPress={qa.onPress}
                  accessibilityRole="button"
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.parchmentDark,
                    borderRadius: 16,
                    padding: 14,
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <QAIcon size={20} color={colors.forest} />
                  <Text
                    style={{
                      fontFamily: FONT.mono,
                      color: colors.ink,
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      textAlign: 'center',
                    }}
                    numberOfLines={1}
                  >
                    {qa.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {dashboardData.quickActions.slice(2, 4).map((qa, i) => {
              const QAIcon = qa.icon;
              return (
                <Pressable
                  key={i}
                  onPress={qa.onPress}
                  accessibilityRole="button"
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.parchmentDark,
                    borderRadius: 16,
                    padding: 14,
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <QAIcon size={20} color={colors.forest} />
                  <Text
                    style={{
                      fontFamily: FONT.mono,
                      color: colors.ink,
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      textAlign: 'center',
                    }}
                    numberOfLines={1}
                  >
                    {qa.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Needs Attention / Active Role Content */}
        {activeRole === 'funder' && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Your Funded Projects
              </Text>
              <Pressable onPress={() => navigation.navigate('Projects')}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
                  See All →
                </Text>
              </Pressable>
            </View>

            {isLoading ? (
              <ActivityIndicator color={colors.forest} style={{ marginTop: 20 }} />
            ) : projects && projects.length > 0 ? (
              projects.map((p) => (
                <Card key={p.id} style={{ padding: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14, flex: 1 }} numberOfLines={1}>
                      {p.title}
                    </Text>
                    <StatusBadge status={p.status} />
                  </View>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, marginTop: 4 }}>
                    {p.locationName} · {fmt(p.totalAmount)}
                  </Text>
                </Card>
              ))
            ) : (
              <EmptyState
                icon={FolderKanban}
                title="No active projects"
                description="Start a funded project with guaranteed milestone escrow to begin."
              />
            )}
          </View>
        )}

        {activeRole === 'contractor' && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Tenders Ready for Bidding
              </Text>
              <Pressable onPress={() => navigation.navigate('Jobs')}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.steel, fontSize: 12 }}>
                  Browse All →
                </Text>
              </Pressable>
            </View>

            <Card style={{ padding: 14, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                    Residential Foundation & Masonry
                  </Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                    Odza, Yaoundé · Budget: {fmt(4500000)}
                  </Text>
                </View>
                <StatusBadge status="open" />
              </View>
              <Pressable
                onPress={() => navigation.navigate('Jobs')}
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: colors.steel,
                }}
              >
                <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 11 }}>
                  Submit Milestone Bid
                </Text>
              </Pressable>
            </Card>
          </View>
        )}

        {activeRole === 'quincaillerie' && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Recent Material Orders
              </Text>
              <Pressable onPress={() => navigation.navigate('Materials')}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.amber, fontSize: 12 }}>
                  View Orders →
                </Text>
              </Pressable>
            </View>

            <Card style={{ padding: 14, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                    150 Bags Cimencam 42.5R + Rebar
                  </Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                    Villa Yaoundé Site · Total: {fmt(1950000)}
                  </Text>
                </View>
                <StatusBadge status="requested" />
              </View>
              <Pressable
                onPress={() => navigation.navigate('Materials')}
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: colors.amber,
                }}
              >
                <Text style={{ fontFamily: FONT.sansSemiBold, color: '#111', fontSize: 11 }}>
                  Confirm & Dispatch
                </Text>
              </Pressable>
            </Card>
          </View>
        )}

        {activeRole === 'seller' && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Active Land Listings
              </Text>
              <Pressable onPress={() => navigation.navigate('LandBrowse')}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>
                  Marketplace →
                </Text>
              </Pressable>
            </View>

            <Card style={{ padding: 14, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                    1,200 m² Sea View Plot
                  </Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                    Ngoye, Kribi · {fmt(18000000)}
                  </Text>
                </View>
                <StatusBadge status="verified" />
              </View>
              <Pressable
                onPress={() => navigation.navigate('LandBrowse')}
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: colors.seal,
                }}
              >
                <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 11 }}>
                  Manage Dossier
                </Text>
              </Pressable>
            </Card>
          </View>
        )}

        {activeRole === 'verifier' && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Assigned Inspections
              </Text>
              <Pressable onPress={() => navigation.navigate('VerifierTasks')}>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.moss, fontSize: 12 }}>
                  Task Queue →
                </Text>
              </Pressable>
            </View>

            <Card style={{ padding: 14, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                    Concrete Slab Pouring Inspection
                  </Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                    Odza Site, Yaoundé · Scheduled: Today 14:00
                  </Text>
                </View>
                <StatusBadge status="pending" />
              </View>
              <Pressable
                onPress={() => navigation.navigate('VerifierTasks')}
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: colors.moss,
                }}
              >
                <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 11 }}>
                  Start On-Site Audit
                </Text>
              </Pressable>
            </Card>
          </View>
        )}
      </View>
    </Screen>
  );
}
