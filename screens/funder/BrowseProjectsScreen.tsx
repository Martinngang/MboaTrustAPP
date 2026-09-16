import { useState } from 'react';
import { View, Text, Pressable, TextInput, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, X, MapPin, Plus, FolderKanban, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useProjectsQuery, type Project } from '../../api/projects';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

const CATEGORIES = ['All', 'Water & Sanitation', 'Education', 'Healthcare', 'Infrastructure', 'Agriculture'];

export function BrowseProjectsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: projects, isLoading, refetch, isRefetching } = useProjectsQuery();

  const filteredProjects = (projects || []).filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <Screen
      refreshing={isRefetching}
      onRefresh={refetch}
      header={
        <Header
          title={t('browseProjects.title')}
          back
          action={
            <Pressable
              onPress={() => navigation.navigate('PostJob')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 14,
                backgroundColor: colors.forest,
              }}
            >
              <Plus size={14} color="#fff" strokeWidth={2.5} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>
                {t('browseProjects.newProject')}
              </Text>
            </Pressable>
          }
        />
      }
    >
      <View style={{ padding: 16, gap: 16 }}>
        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.parchmentDark,
            paddingHorizontal: 12,
            paddingVertical: 8,
            gap: 8,
          }}
        >
          <Search size={18} color={colors.inkSubtle} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('browseProjects.searchPlaceholder')}
            placeholderTextColor={colors.inkSubtle}
            style={{
              flex: 1,
              fontFamily: FONT.sans,
              color: colors.ink,
              fontSize: 13,
              padding: 0,
            }}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
              <X size={16} color={colors.inkSubtle} />
            </Pressable>
          ) : null}
        </View>

        {/* Category Filter Chips */}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
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
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Project Cards */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={t('browseProjects.noProjectsFound')}
            description={
              projects && projects.length > 0
                ? t('browseProjects.adjustFilters')
                : t('browseProjects.beTheFirst')
            }
          />
        ) : (
          filteredProjects.map((project) => {
            const progress = project.totalAmount > 0 ? Math.min(100, Math.round((project.raised / project.totalAmount) * 100)) : 0;
            return (
              <Pressable
                key={project.id}
                onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
                accessibilityRole="button"
              >
                <Card style={{ overflow: 'hidden' }}>
                  {/* Thumbnail Banner */}
                  <View style={{ height: 140, backgroundColor: colors.parchment, position: 'relative' }}>
                    <Image
                      source={{ uri: project.imageUrl }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    <View
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 10, textTransform: 'uppercase' }}>
                        {project.category}
                      </Text>
                    </View>
                    <View style={{ position: 'absolute', top: 10, right: 10 }}>
                      <StatusBadge status={project.status} />
                    </View>
                  </View>

                  {/* Body Content */}
                  <View style={{ padding: 14, gap: 10 }}>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }} numberOfLines={2}>
                      {project.title}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} color={colors.inkSubtle} />
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                        {project.location}
                      </Text>
                    </View>

                    {/* Funding Progress Bar */}
                    <View style={{ gap: 4 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11 }}>
                          {fmt(project.raised)} {t('browseProjects.raised')}
                        </Text>
                        <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 11, fontWeight: '700' }}>
                          {progress}%
                        </Text>
                      </View>
                      <View style={{ height: 6, backgroundColor: colors.parchmentDark, borderRadius: 3, overflow: 'hidden' }}>
                        <View
                          style={{
                            height: '100%',
                            width: `${progress}%`,
                            backgroundColor: colors.forest,
                            borderRadius: 3,
                          }}
                        />
                      </View>
                    </View>

                    {/* Footer Info */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: 8,
                        borderTopWidth: 1,
                        borderTopColor: colors.parchmentDark,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <ShieldCheck size={14} color={colors.forest} />
                        <Text style={{ fontFamily: FONT.sansMedium, color: colors.forest, fontSize: 12 }}>
                          {project.milestones.length} {t('browseProjects.milestonesEscrowed')}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>
                          {t('browseProjects.details')}
                        </Text>
                        <ArrowRight size={14} color={colors.forest} />
                      </View>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}
      </View>
    </Screen>
  );
}
