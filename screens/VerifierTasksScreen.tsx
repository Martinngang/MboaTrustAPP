import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ShieldCheck, MapPin, Camera, Clock, CheckCircle2 } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';

interface VerificationTask {
  id: string;
  taskNumber: string;
  projectName: string;
  milestoneTitle: string;
  location: string;
  scheduledDate: string;
  status: string;
  evidenceItems: number;
}

const DEMO_TASKS: VerificationTask[] = [
  {
    id: 'task-1',
    taskNumber: 'VER-2026-041',
    projectName: 'Villa Yaoundé Phase 2',
    milestoneTitle: 'Reinforced Concrete Slab Pouring',
    location: 'Odza, Yaoundé',
    scheduledDate: 'Today, 14:00',
    status: 'pending',
    evidenceItems: 4,
  },
  {
    id: 'task-2',
    taskNumber: 'VER-2026-039',
    projectName: 'Kribi Residential Plot',
    milestoneTitle: 'Boundary Demarcation & Geodetic Pillars',
    location: 'Ngoye, Kribi',
    scheduledDate: 'Tomorrow, 09:30',
    status: 'in_progress',
    evidenceItems: 6,
  },
  {
    id: 'task-3',
    taskNumber: 'VER-2026-032',
    projectName: 'Douala Commercial Block',
    milestoneTitle: 'Foundation Excavation & Compaction Test',
    location: 'Bonapriso, Douala',
    scheduledDate: 'Completed 25 Aug',
    status: 'verified',
    evidenceItems: 8,
  },
];

export function VerifierTasksScreen() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'verified'>('all');

  const filtered = DEMO_TASKS.filter((t) => (filter === 'all' ? true : t.status === filter));

  return (
    <Screen>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Title */}
        <View>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20 }}>
            Verification Tasks
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
            Objective field audits & milestone proof validations
          </Text>
        </View>

        {/* Filter Chips */}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'pending', label: 'Pending' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'verified', label: 'Completed' },
          ].map((tab) => {
            const active = filter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setFilter(tab.id as any)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? colors.moss : colors.parchmentDark,
                  backgroundColor: active ? colors.moss + '18' : colors.surface,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT.sansMedium,
                    fontSize: 12,
                    color: active ? colors.moss : colors.inkMuted,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tasks List */}
        {filtered.map((task) => (
          <Card key={task.id} style={{ padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ fontFamily: FONT.mono, color: colors.moss, fontSize: 11, fontWeight: '700' }}>
                  {task.taskNumber}
                </Text>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 15, marginTop: 2 }}>
                  {task.projectName}
                </Text>
                <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, marginTop: 1 }}>
                  Milestone: {task.milestoneTitle}
                </Text>
              </View>
              <StatusBadge status={task.status} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MapPin size={13} color={colors.inkSubtle} />
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                  {task.location}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Clock size={13} color={colors.inkSubtle} />
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                  {task.scheduledDate}
                </Text>
              </View>
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Camera size={14} color={colors.inkSubtle} />
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                  {task.evidenceItems} inspection items
                </Text>
              </View>

              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: colors.moss,
                }}
              >
                <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>
                  {task.status === 'verified' ? 'View Report' : 'Perform Audit'}
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
