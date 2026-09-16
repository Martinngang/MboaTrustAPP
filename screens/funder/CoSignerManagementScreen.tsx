import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Users, CheckCircle2 } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { useMyProjectsQuery, useAddCoSignerMutation } from '../../api/projects';
import { useUserSearchQuery } from '../../api/users';
import { apiErrorMessage } from '../../api/client';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

type RouteProps = RouteProp<MainStackParamList, 'CoSignerManagement'>;

/** A co-signer must be an existing, already-registered account — the
 * backend has no concept of inviting someone who hasn't signed up yet, and
 * a project has exactly one co-signer (Project.coSignerId), not a list.
 * Matches web's real AddCoSignerScreen exactly (its own comment documents
 * the same retired "invite by phone, approve via no-login link" flow this
 * replaces). */
export function CoSignerManagementScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user } = useApp();
  const { show: showToast } = useToast();

  const { data: projects, isLoading } = useMyProjectsQuery(user?._id);
  const project = route.params?.projectId
    ? (projects || []).find((p) => p.id === route.params?.projectId)
    : (projects || [])[0];

  const addCoSigner = useAddCoSignerMutation();
  const [query, setQuery] = useState('');
  const { data: results = [], isFetching } = useUserSearchQuery(query);
  const [added, setAdded] = useState<string | null>(null);

  const select = async (userId: string, name: string) => {
    if (!project) return;
    try {
      await addCoSigner.mutateAsync({ projectId: project.id, coSignerId: userId });
      setAdded(name);
    } catch (err) {
      showToast({ title: t('coSigner.failedToAdd'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  if (isLoading) {
    return (
      <Screen header={<Header title={t('coSigner.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </Screen>
    );
  }

  if (!project) {
    return (
      <Screen header={<Header title={t('coSigner.title')} back />}>
        <View style={{ padding: 16 }}>
          <EmptyState icon={Users} title={t('coSigner.noProjectFound')} description={t('coSigner.postTenderFirst')} />
        </View>
      </Screen>
    );
  }

  if (added) {
    return (
      <Screen header={<Header title={t('coSigner.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={32} color="#fff" />
          </View>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20, textAlign: 'center' }}>
            {t('coSigner.added')}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
            {added} {t('coSigner.addedDescPart1')} {project.title}. {t('coSigner.addedDescPart2')}
          </Text>
          <PillButton onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })} fullWidth>
            {t('coSigner.backToProject')}
          </PillButton>
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title={t('coSigner.title')} subtitle={project.title} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Card style={{ padding: 14, backgroundColor: colors.steel + '15', borderColor: colors.steel + '40' }}>
          <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 12, lineHeight: 17 }}>
            {t('coSigner.explainer')}
          </Text>
        </Card>

        {project.coSignerId ? (
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              {t('coSigner.currentCoSigner')}
            </Text>
            <Card style={{ padding: 14 }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                {project.coSignerName || t('coSigner.coSignerFallback')}
              </Text>
            </Card>
          </View>
        ) : null}

        <TextField
          label={t('coSigner.searchLabel')}
          placeholder="e.g. Chief Njoya, +237677..., or name@email.com"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          returnKeyType="search"
        />

        {query.trim().length >= 2 && (
          <View style={{ gap: 8 }}>
            {isFetching ? (
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>{t('coSigner.searching')}</Text>
            ) : results.length === 0 ? (
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>
                {t('coSigner.noMatchingAccount')}
              </Text>
            ) : (
              results.map((u) => (
                <Pressable
                  key={u.id}
                  onPress={() => select(u.id, u.fullName)}
                  disabled={addCoSigner.isPending}
                  style={{
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.parchmentDark,
                    backgroundColor: colors.surface,
                    padding: 14,
                    opacity: addCoSigner.isPending ? 0.5 : 1,
                  }}
                >
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{u.fullName}</Text>
                  {(u.phoneNumber || u.email || u.roles.length > 0) && (
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, marginTop: 2 }}>
                      {u.phoneNumber || u.email || u.roles.join(', ')}
                    </Text>
                  )}
                </Pressable>
              ))
            )}
          </View>
        )}
      </View>
    </Screen>
  );
}
