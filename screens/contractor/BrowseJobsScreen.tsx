import { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Search,
  X,
  MapPin,
  Briefcase,
  ArrowUpDown,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useJobsQuery, useMyBidsQuery } from '../../api/contracts';
import type { MainStackParamList } from '../../navigation/types';

const CATEGORIES = ['All', 'Masonry', 'Electrical', 'Plumbing', 'Roofing', 'Infrastructure', 'Finishing'];

export function BrowseJobsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDesc, setSortDesc] = useState(true);

  const { data: jobs, isLoading } = useJobsQuery();
  const { data: myBids } = useMyBidsQuery();

  const appliedJobIds = new Set((myBids || []).map((b) => b.projectId));

  const filteredJobs = (jobs || [])
    .filter((j) => {
      const matchesCat = selectedCategory === 'All' || j.category.toLowerCase() === selectedCategory.toLowerCase();
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery = !q || j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    })
    .sort((a, b) => (sortDesc ? b.budget - a.budget : a.budget - b.budget));

  return (
    <Screen
      header={
        <Header
          title="Open Tenders & Jobs"
          subtitle={`${filteredJobs.length} available for bidding`}
          back
          action={
            <Pressable
              onPress={() => navigation.navigate('MyBids')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 14,
                backgroundColor: colors.steel,
              }}
            >
              <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>
                My Bids →
              </Text>
            </Pressable>
          }
        />
      }
    >
      <View style={{ padding: 16, gap: 16 }}>
        {/* Search & Sort Row */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View
            style={{
              flex: 1,
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
              placeholder="Search tenders, location..."
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

          {/* Sort Button */}
          <Pressable
            onPress={() => setSortDesc((s) => !s)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: colors.parchment,
              paddingHorizontal: 10,
              paddingVertical: 10,
              borderRadius: 14,
            }}
          >
            <ArrowUpDown size={14} color={colors.inkMuted} />
            <Text style={{ fontFamily: FONT.mono, color: colors.inkMuted, fontSize: 11, fontWeight: '700' }}>
              {sortDesc ? 'Max' : 'Min'}
            </Text>
          </Pressable>
        </View>

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
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
                  borderColor: active ? colors.steel : colors.parchmentDark,
                  backgroundColor: active ? colors.steel + '15' : colors.surface,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT.sansMedium,
                    fontSize: 12,
                    color: active ? colors.steel : colors.inkMuted,
                  }}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Job Cards */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.steel} />
          </View>
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No tenders found"
            description="Try selecting a different trade category or clearing your search."
          />
        ) : (
          filteredJobs.map((job) => {
            const hasApplied = appliedJobIds.has(job.id);
            return (
              <Pressable
                key={job.id}
                onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
                accessibilityRole="button"
              >
                <Card style={{ padding: 16, gap: 10 }}>
                  {/* Top Row: Title + Status Pill */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16, flex: 1 }}>
                      {job.title}
                    </Text>
                    {hasApplied ? (
                      <View
                        style={{
                          backgroundColor: colors.forest + '15',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 10, fontWeight: '700' }}>
                          Applied
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={{
                          backgroundColor: colors.steel + '15',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ fontFamily: FONT.mono, color: colors.steel, fontSize: 10, fontWeight: '700' }}>
                          {job.bidsCount} Bids
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Category & Location */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MapPin size={13} color={colors.inkSubtle} />
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                      {job.location} · {job.category}
                    </Text>
                  </View>

                  {/* Description snippet */}
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
                    {job.description}
                  </Text>

                  {/* Footer: Budget & CTA */}
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
                        Target Budget
                      </Text>
                      <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 16, marginTop: 1 }}>
                        {fmt(job.budget)}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.steel, fontSize: 12 }}>
                        View Tender
                      </Text>
                      <ArrowRight size={14} color={colors.steel} />
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
