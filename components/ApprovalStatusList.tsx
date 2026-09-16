import { View, Text } from 'react-native';
import { StatusBadge } from './StatusBadge';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';

export interface Approver {
  name: string;
  status: 'approved' | 'pending';
}

// Ported from MboaTrustFrontend/src/components/ApprovalStatusList.tsx — shows
// each required approver and their sign-off state for a multi-signature
// milestone release.
export function ApprovalStatusList({ approvers }: { approvers: Approver[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {approvers.map((a) => (
        <View
          key={a.name}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.parchmentDark,
            backgroundColor: colors.surface,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: a.status === 'approved' ? colors.forest : colors.inkSubtle,
              }}
            >
              <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 12 }}>{a.name[0]}</Text>
            </View>
            <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>{a.name}</Text>
          </View>
          <StatusBadge status={a.status} />
        </View>
      ))}
    </View>
  );
}
