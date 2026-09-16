import { useRef, useState } from 'react';
import { View, Text, Pressable, Modal, Alert, ActivityIndicator, TextInput } from 'react-native';
import { X } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import {
  useTeamMembersQuery,
  useInviteTeamMemberMutation,
  useUpdateTeamMemberRoleMutation,
  useRemoveTeamMemberMutation,
  useTeamActivityQuery,
  type TeamRole,
  type TeamPermission,
} from '../../api/teamMembers';
import { apiErrorMessage } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/useTranslation';
import type { TranslationKey } from '../../i18n/translations';

// Ported from MboaTrustFrontend/src/screens/TeamManagementScreen.tsx — for
// diaspora-group/association accounts sharing one Mboa Trust account: who
// on the team can fund, approve milestones, or just view — AND (contractor
// accounts only) for delegating milestone-evidence submission to a trusted
// team member. Real backend (GET /team-members/mine, POST /team-members,
// PATCH .../role, DELETE /team-members/:id, GET /team-members/activity).
// Inviting doesn't send an email yet — same caveat web states — and `role`
// here doesn't restrict access elsewhere in the app; `permissions` (the
// contractor-only delegate toggle below) is the one field that actually is
// enforced, by projectController.assertProjectParty's delegate check.
const DELEGATE_PERMISSION: TeamPermission = 'submit_milestones';

function activityLabel(action: string, detail: Record<string, unknown>): string {
  switch (action) {
    case 'member.invited':
      return `Invited ${detail.email || 'a member'}`;
    case 'member.permissionsChanged':
      return `Updated permissions${Array.isArray(detail.permissions) && detail.permissions.length > 0 ? ' (can submit milestones)' : ' (no delegated permissions)'}`;
    case 'member.removed':
      return `Removed ${detail.email || 'a member'}`;
    case 'milestone.submittedOnBehalf':
      return `Submitted milestone evidence${detail.milestoneName ? ` for "${detail.milestoneName}"` : ''} on your behalf`;
    default:
      return action.replace(/[._]/g, ' ');
  }
}
const ROLE_META_KEY: Record<TeamRole, { labelKey: TranslationKey; descriptionKey: TranslationKey }> = {
  owner: { labelKey: 'teamManagement.roleOwner', descriptionKey: 'teamManagement.roleOwnerDesc' },
  approver: { labelKey: 'teamManagement.roleApprover', descriptionKey: 'teamManagement.roleApproverDesc' },
  viewer: { labelKey: 'teamManagement.roleViewer', descriptionKey: 'teamManagement.roleViewerDesc' },
};
const ROLE_ORDER: TeamRole[] = ['owner', 'approver', 'viewer'];
const INVITABLE_ROLES = ROLE_ORDER.filter((r): r is 'approver' | 'viewer' => r !== 'owner');

export function TeamManagementScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { show: showToast } = useToast();
  const { activeRole } = useApp();
  const isContractor = activeRole === 'contractor';
  const { data: members, isLoading } = useTeamMembersQuery();
  const { data: activity = [] } = useTeamActivityQuery(isContractor);
  const invite = useInviteTeamMemberMutation();
  const updateRole = useUpdateTeamMemberRoleMutation();
  const remove = useRemoveTeamMemberMutation();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'approver' | 'viewer'>('viewer');
  const [canSubmitMilestones, setCanSubmitMilestones] = useState(false);
  const emailRef = useRef<TextInput>(null);

  const submitInvite = async () => {
    if (!name.trim() || !email.trim()) return;
    try {
      await invite.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        role,
        permissions: canSubmitMilestones ? [DELEGATE_PERMISSION] : [],
      });
      showToast({
        title: t('teamManagement.memberAdded'),
        description: `${name.trim()} ${t('teamManagement.addedAsRole')} ${t(ROLE_META_KEY[role].labelKey)}. ${t('teamManagement.noEmailSent')}`,
        tone: 'success',
      });
      setInviteOpen(false);
      setName('');
      setEmail('');
      setRole('viewer');
      setCanSubmitMilestones(false);
    } catch (err) {
      showToast({ title: t('teamManagement.failedToInvite'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  const handleRoleChange = async (id: string, newRole: 'approver' | 'viewer') => {
    try {
      await updateRole.mutateAsync({ id, role: newRole });
    } catch (err) {
      showToast({ title: t('teamManagement.failedToUpdateRole'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  const toggleDelegatePermission = async (id: string, permissions: TeamPermission[]) => {
    const has = permissions.includes(DELEGATE_PERMISSION);
    try {
      await updateRole.mutateAsync({ id, permissions: has ? permissions.filter((p) => p !== DELEGATE_PERMISSION) : [...permissions, DELEGATE_PERMISSION] });
    } catch (err) {
      showToast({ title: t('teamManagement.failedToUpdateRole'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  const handleRemove = (id: string, name: string) => {
    Alert.alert(t('teamManagement.removePersonTitle'), `${name} ${t('teamManagement.willBeRemoved')}`, [
      { text: t('teamManagement.cancel'), style: 'cancel' },
      {
        text: t('teamManagement.remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync(id);
            showToast({ title: t('teamManagement.removed'), tone: 'success' });
          } catch (err) {
            showToast({ title: t('teamManagement.failedToRemove'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
          }
        },
      },
    ]);
  };

  return (
    <Screen
      header={
        <Header
          title={t('teamManagement.title')}
          subtitle={`${members?.length ?? 0} ${t('teamManagement.people')}`}
          back
          action={
            <Pressable onPress={() => setInviteOpen(true)} accessibilityRole="button">
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>{t('teamManagement.invite')}</Text>
            </Pressable>
          }
        />
      }
    >
      <View style={{ padding: 16, gap: 16 }}>
        <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
          {t('teamManagement.explainer')}
        </Text>

        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : (
          (members || []).map((m) => (
            <Card key={m.id} style={{ padding: 14, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 14 }}>{m.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }} numberOfLines={1}>{m.name}</Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }} numberOfLines={1}>{m.email}</Text>
                </View>
                {m.role === 'owner' ? (
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>{t('teamManagement.roleOwner')}</Text>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {INVITABLE_ROLES.map((r) => (
                      <Pressable
                        key={r}
                        onPress={() => handleRoleChange(m.id, r)}
                        accessibilityRole="button"
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                          backgroundColor: m.role === r ? colors.forest : colors.parchment,
                        }}
                      >
                        <Text style={{ fontFamily: FONT.sansMedium, fontSize: 10, color: m.role === r ? '#fff' : colors.inkMuted }}>
                          {t(ROLE_META_KEY[r].labelKey)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {m.role !== 'owner' && (
                  <Pressable onPress={() => handleRemove(m.id, m.name)} accessibilityRole="button">
                    <X size={15} color={colors.seal} />
                  </Pressable>
                )}
              </View>
              {isContractor && m.role !== 'owner' && m.status === 'active' && (
                <Pressable
                  onPress={() => toggleDelegatePermission(m.id, m.permissions)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: m.permissions.includes(DELEGATE_PERMISSION) }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      borderWidth: 1.5,
                      borderColor: m.permissions.includes(DELEGATE_PERMISSION) ? colors.forest : colors.parchmentDark,
                      backgroundColor: m.permissions.includes(DELEGATE_PERMISSION) ? colors.forest : 'transparent',
                    }}
                  />
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
                    {t('teamManagement.canSubmitMilestones')}
                  </Text>
                </Pressable>
              )}
            </Card>
          ))
        )}

        <View style={{ gap: 8, marginTop: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('teamManagement.rolePermissions')}</Text>
          {ROLE_ORDER.map((r) => (
            <View key={r} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.parchmentDark, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
              <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>{t(ROLE_META_KEY[r].labelKey)}</Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, flex: 1, textAlign: 'right' }}>{t(ROLE_META_KEY[r].descriptionKey)}</Text>
            </View>
          ))}
        </View>

        {isContractor && (
          <View style={{ gap: 8, marginTop: 8 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('teamManagement.activityHistory')}
            </Text>
            {activity.length === 0 ? (
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, fontStyle: 'italic' }}>
                {t('teamManagement.noActivityYet')}
              </Text>
            ) : (
              activity.map((row) => (
                <View key={row.id} style={{ borderWidth: 1, borderColor: colors.parchmentDark, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
                  <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12 }}>{activityLabel(row.action, row.detail)}</Text>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 2 }}>
                    {row.actorName} · {new Date(row.createdAt).toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </View>

      <Modal visible={inviteOpen} transparent animationType="slide" onRequestClose={() => setInviteOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>{t('teamManagement.inviteModalTitle')}</Text>
              <Pressable onPress={() => setInviteOpen(false)} accessibilityRole="button" hitSlop={6}>
                <X size={20} color={colors.inkMuted} />
              </Pressable>
            </View>

            <TextField
              label={t('teamManagement.nameLabel')}
              placeholder="e.g. Patrick Ndifor"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            <TextField
              ref={emailRef}
              label={t('teamManagement.emailLabel')}
              placeholder="patrick@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={submitInvite}
            />

            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t('teamManagement.roleLabel')}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {INVITABLE_ROLES.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setRole(r)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: role === r }}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      alignItems: 'center',
                      borderColor: role === r ? colors.forest : colors.parchmentDark,
                      backgroundColor: role === r ? colors.forest + '14' : colors.surface,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 12, color: role === r ? colors.forest : colors.inkMuted }}>
                      {t(ROLE_META_KEY[r].labelKey)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {isContractor && (
              <Pressable
                onPress={() => setCanSubmitMilestones((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: canSubmitMilestones }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    borderWidth: 1.5,
                    borderColor: canSubmitMilestones ? colors.forest : colors.parchmentDark,
                    backgroundColor: canSubmitMilestones ? colors.forest : 'transparent',
                  }}
                />
                <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 13 }}>
                  {t('teamManagement.canSubmitMilestones')}
                </Text>
              </Pressable>
            )}

            <PillButton variant="primary" onPress={submitInvite} loading={invite.isPending} disabled={!name.trim() || !email.trim() || invite.isPending} fullWidth>
              {t('teamManagement.sendInvitation')}
            </PillButton>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
