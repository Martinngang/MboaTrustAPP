import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  FolderKanban,
  Briefcase,
  Store,
  MapPin,
  ShieldCheck,
  MessageSquare,
  Activity,
  User,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { ProjectsScreen } from '../screens/ProjectsScreen';
import { JobsScreen } from '../screens/JobsScreen';
import { MaterialsScreen } from '../screens/MaterialsScreen';
import { LandBrowseScreen } from '../screens/LandBrowseScreen';
import { VerifierTasksScreen } from '../screens/VerifierTasksScreen';
import { ActivityScreen } from '../screens/ActivityScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useApp, type Role } from '../context/AppContext';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabItemConfig {
  name: keyof MainTabParamList;
  component: React.ComponentType<any>;
  label: string;
  icon: LucideIcon;
}

const ROLE_TABS: Record<NonNullable<Role>, TabItemConfig[]> = {
  funder: [
    { name: 'Home', component: HomeScreen, label: 'Home', icon: Home },
    { name: 'Projects', component: ProjectsScreen, label: 'Projects', icon: FolderKanban },
    { name: 'Messages', component: MessagesScreen, label: 'Messages', icon: MessageSquare },
    { name: 'Activity', component: ActivityScreen, label: 'Activity', icon: Activity },
    { name: 'Profile', component: ProfileScreen, label: 'Profile', icon: User },
  ],
  contractor: [
    { name: 'Home', component: HomeScreen, label: 'Home', icon: Home },
    { name: 'Jobs', component: JobsScreen, label: 'Jobs', icon: Briefcase },
    { name: 'Messages', component: MessagesScreen, label: 'Messages', icon: MessageSquare },
    { name: 'Activity', component: ActivityScreen, label: 'Earnings', icon: Activity },
    { name: 'Profile', component: ProfileScreen, label: 'Profile', icon: User },
  ],
  quincaillerie: [
    { name: 'Home', component: HomeScreen, label: 'Home', icon: Home },
    { name: 'Materials', component: MaterialsScreen, label: 'Materials', icon: Store },
    { name: 'Messages', component: MessagesScreen, label: 'Messages', icon: MessageSquare },
    { name: 'Activity', component: ActivityScreen, label: 'Orders', icon: Activity },
    { name: 'Profile', component: ProfileScreen, label: 'Profile', icon: User },
  ],
  seller: [
    { name: 'Home', component: HomeScreen, label: 'Home', icon: Home },
    { name: 'LandBrowse', component: LandBrowseScreen, label: 'Land', icon: MapPin },
    { name: 'Messages', component: MessagesScreen, label: 'Messages', icon: MessageSquare },
    { name: 'Activity', component: ActivityScreen, label: 'Listings', icon: Activity },
    { name: 'Profile', component: ProfileScreen, label: 'Profile', icon: User },
  ],
  verifier: [
    { name: 'Home', component: HomeScreen, label: 'Home', icon: Home },
    { name: 'VerifierTasks', component: VerifierTasksScreen, label: 'Tasks', icon: ShieldCheck },
    { name: 'Messages', component: MessagesScreen, label: 'Messages', icon: MessageSquare },
    { name: 'Activity', component: ActivityScreen, label: 'Audits', icon: Activity },
    { name: 'Profile', component: ProfileScreen, label: 'Profile', icon: User },
  ],
};

function CustomBottomTabBar({ state, descriptors, navigation, tabs }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.parchmentDark,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 6,
        height: 60 + Math.max(insets.bottom, 8),
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tabConfig = tabs.find((t: TabItemConfig) => t.name === route.name) || tabs[index];
        const Icon = tabConfig?.icon || Home;
        const label = tabConfig?.label || route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={label}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 4,
              gap: 3,
            }}
          >
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 12,
                paddingVertical: 3,
                borderRadius: 14,
                backgroundColor: isFocused ? colors.forest + '16' : 'transparent',
              }}
            >
              <Icon
                size={20}
                color={isFocused ? colors.forest : colors.inkSubtle}
                strokeWidth={isFocused ? 2.4 : 1.8}
              />
            </View>
            <Text
              style={{
                fontFamily: isFocused ? FONT.sansSemiBold : FONT.sansMedium,
                fontSize: 10,
                color: isFocused ? colors.forest : colors.inkSubtle,
                textTransform: 'uppercase',
                letterSpacing: 0.3,
              }}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MainTabs() {
  const { activeRole } = useApp();
  const currentTabs = ROLE_TABS[activeRole] || ROLE_TABS.funder;

  return (
    <Tab.Navigator
      key={activeRole}
      tabBar={(props) => <CustomBottomTabBar {...props} tabs={currentTabs} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {currentTabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
        />
      ))}
    </Tab.Navigator>
  );
}
