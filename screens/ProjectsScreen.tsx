import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FolderKanban, Plus, MapPin, ShieldCheck, ArrowUpRight } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { fmt } from '../components/fmt';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import { useMyProjectsQuery } from '../api/projects';
import type { MainStackParamList } from '../navigation/types';

const FILTER_TABS = ['All', 'Active', 'Under Review', 'Completed'] as const;

export function ProjectsScreen() {
  const { colors } = useTheme();
  const { user } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [activeFilter, setActiveFilter] = useState<(typeof FILTER_TABS)[number]>('All');

  const { data: projects, isLoading } = useMyProjectsQuery(user?._id);

  const filtered = (projects || []).filter((p) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Active') return p.status === 'active' || p.status === 'in_progress';
    if (activeFilter === 'Under Review') return p.status === 'under_review' || p.status === 'pending';
    if (activeFilter === 'Completed') return p.status === 'completed' || p.status === 'released';
    return true;
  });

  return (
    <Screen>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Title Bar with Quick Action */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20 }}>
              Funder Projects
            </Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
              Track construction milestones & protected escrow
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('CreateProject')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 14,
              backgroundColor: colors.forest,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Plus size={14} color="#fff" strokeWidth={3} />
            <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>
              New Project
            </Text>
          </Pressable>
        </View>

        {/* Filter Chips */}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {FILTER_TABS.map((tab) => {
            const active = activeFilter === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveFilter(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
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
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Projects List */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects found"
            description={
              projects && projects.length > 0
                ? 'No projects match the selected filter.'
                : 'Projects you initiate or fund from abroad will be tracked here.'
            }
          />
        ) : (
          filtered.map((project) => (
            <Pressable
              key={project.id}
              onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
              accessibilityRole="button"
            >
              <Card style={{ padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15 }}>
                      {project.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <MapPin size={12} color={colors.inkSubtle} />
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                        {project.locationName || 'Cameroon'}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={project.status} />
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: colors.parchmentDark,
                  }}
                >
                  <View>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                      Total Budget
                    </Text>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 15, marginTop: 2 }}>
                      {fmt(project.totalAmount || 0)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={14} color={colors.forest} />
                    <Text style={{ fontFamily: FONT.sansMedium, color: colors.forest, fontSize: 12 }}>
                      Escrow Locked
                    </Text>
                    <ArrowUpRight size={14} color={colors.forest} />
                  </View>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}
