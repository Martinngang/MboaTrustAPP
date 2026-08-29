import { useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Search,
  X,
  PlusCircle,
  FolderKanban,
  Briefcase,
  Store,
  MapPin,
  ShieldCheck,
  MessageSquare,
  Activity,
  User,
  Settings as SettingsIcon,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import type { MainStackParamList, MainTabParamList } from '../navigation/types';

interface ActionItem {
  icon: typeof FolderKanban;
  title: string;
  sub: string;
  onPress: () => void;
  accent?: string;
}

export function QuickActionModal() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { quickActionOpen, setQuickActionOpen, activeRole } = useApp();
  const [query, setQuery] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList & MainTabParamList>>();

  const handleClose = () => {
    setQuery('');
    setQuickActionOpen(false);
  };

  const navigateToTab = (tab: keyof MainTabParamList) => {
    handleClose();
    (navigation as any).navigate('MainTabs', { screen: tab });
  };

  const navigateToStack = (screen: keyof MainStackParamList) => {
    handleClose();
    navigation.navigate(screen as any);
  };

  // Role-specific quick actions
  const getRoleActions = (): ActionItem[] => {
    switch (activeRole) {
      case 'funder':
        return [
          {
            icon: PlusCircle,
            title: 'Post New Contractor Job / Tender',
            sub: 'Publish request for bids and milestone pricing',
            onPress: () => navigateToStack('PostJob'),
            accent: '#0F7A52',
          },
          {
            icon: FolderKanban,
            title: 'Create Construction Project',
            sub: 'Setup 4-step escrow milestone budget',
            onPress: () => navigateToStack('CreateProject'),
            accent: '#0F7A52',
          },
          {
            icon: FolderKanban,
            title: 'Browse Active Projects',
            sub: 'Discover diaspora funded initiatives',
            onPress: () => navigateToStack('BrowseProjects'),
            accent: '#0F7A52',
          },
        ];
      case 'contractor':
        return [
          {
            icon: Briefcase,
            title: 'Browse Available Jobs & Tenders',
            sub: 'Find open project milestones and submit bids',
            onPress: () => navigateToStack('BrowseJobs'),
            accent: '#1E3A5F',
          },
          {
            icon: Briefcase,
            title: 'My Submitted Proposals & Bids',
            sub: 'Track awarded contracts & submission status',
            onPress: () => navigateToStack('MyBids'),
            accent: '#1E3A5F',
          },
          {
            icon: Activity,
            title: 'Withdraw Earnings & MoMo Payouts',
            sub: 'Request mobile money transfer for released escrow',
            onPress: () => navigateToStack('EarningsWithdraw'),
            accent: '#1E3A5F',
          },
        ];
      case 'quincaillerie':
        return [
          {
            icon: Store,
            title: 'Material Orders & Waybills',
            sub: 'Fulfill site supply orders and attach waybill photos',
            onPress: () => navigateToStack('MaterialOrders'),
            accent: '#C9971E',
          },
          {
            icon: Store,
            title: 'Product Catalog & Pricing',
            sub: 'Manage building materials and stock levels',
            onPress: () => navigateToStack('InventoryCatalog'),
            accent: '#C9971E',
          },
          {
            icon: Activity,
            title: 'Store Settlements & Payouts',
            sub: 'View completed order escrow releases',
            onPress: () => navigateToStack('QuincailleriePayouts'),
            accent: '#C9971E',
          },
        ];
      case 'seller':
        return [
          {
            icon: PlusCircle,
            title: 'Publish New Land Listing',
            sub: 'Upload Titre Foncier deed & plot specifications',
            onPress: () => navigateToStack('CreateListing'),
            accent: '#B23A2E',
          },
          {
            icon: MapPin,
            title: 'My Land Plots & Buyer Offers',
            sub: 'Review purchase proposals with escrow terms',
            onPress: () => navigateToStack('MyLandListings'),
            accent: '#B23A2E',
          },
          {
            icon: MapPin,
            title: 'Browse Cadastral Marketplace',
            sub: 'Explore verified parcels in Cameroon',
            onPress: () => navigateToStack('BrowseLand'),
            accent: '#B23A2E',
          },
        ];
      case 'verifier':
        return [
          {
            icon: ShieldCheck,
            title: 'Inspection Audit Queue',
            sub: 'Perform site checks and submit verification reports',
            onPress: () => navigateToStack('VerifierDashboard'),
            accent: '#2D4A2D',
          },
          {
            icon: ShieldCheck,
            title: 'Expert Verifier Profile & Licenses',
            sub: 'Manage ONGC credentials & covered regions',
            onPress: () => navigateToStack('VerifierProfile'),
            accent: '#2D4A2D',
          },
        ];
      default:
        return [];
    }
  };

  const commonActions: ActionItem[] = [
    {
      icon: FolderKanban,
      title: 'Construction Cost Estimator',
      sub: 'Calculate cement, rebar, sand & gravel quantities',
      onPress: () => navigateToStack('MaterialCostEstimator'),
    },
    {
      icon: MessageSquare,
      title: 'Direct Messages',
      sub: 'Chat with funders, contractors, sellers & verifiers',
      onPress: () => navigateToTab('Messages'),
    },
    {
      icon: Activity,
      title: 'Activity Log & Transactions',
      sub: 'Audit trail of platform activities & updates',
      onPress: () => navigateToTab('Activity'),
    },
    {
      icon: User,
      title: 'My Profile & Roles',
      sub: 'View KYC verification and credentials',
      onPress: () => navigateToTab('Profile'),
    },
    {
      icon: SettingsIcon,
      title: 'App Settings & Preferences',
      sub: 'Appearance, notifications, language & payouts',
      onPress: () => navigateToStack('Settings'),
    },
  ];

  const allActions = [...getRoleActions(), ...commonActions];
  const filteredActions = query.trim()
    ? allActions.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.sub.toLowerCase().includes(query.toLowerCase())
      )
    : allActions;

  return (
    <Modal
      visible={quickActionOpen}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss quick search"
        />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderColor: colors.parchmentDark,
            paddingBottom: Math.max(insets.bottom, 20),
            maxHeight: '85%',
          }}
        >
          {/* Search Header Input */}
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.parchmentDark,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.parchment,
                borderRadius: 14,
                paddingHorizontal: 12,
                paddingVertical: 8,
                gap: 8,
              }}
            >
              <Search size={18} color={colors.inkSubtle} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search actions, features, screens..."
                placeholderTextColor={colors.inkSubtle}
                autoFocus
                style={{
                  flex: 1,
                  fontFamily: FONT.sans,
                  color: colors.ink,
                  fontSize: 14,
                  padding: 0,
                }}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={6}>
                  <X size={16} color={colors.inkSubtle} />
                </Pressable>
              ) : null}
            </View>
            <Pressable
              onPress={handleClose}
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

          {/* Quick Actions List */}
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 8 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text
              style={{
                fontFamily: FONT.mono,
                color: colors.inkSubtle,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 4,
              }}
            >
              {query ? 'Search Results' : 'Suggested Actions'}
            </Text>

            {filteredActions.map((item, index) => {
              const Icon = item.icon;
              const accent = item.accent || colors.forest;
              return (
                <Pressable
                  key={index}
                  onPress={item.onPress}
                  accessibilityRole="button"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.parchmentDark,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: accent + '18',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} color={accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>
                      {item.title}
                    </Text>
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, marginTop: 1 }}>
                      {item.sub}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.inkSubtle} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
