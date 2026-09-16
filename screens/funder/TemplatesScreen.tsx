import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Puzzle } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { fmt } from '../../components/fmt';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useProjectTemplatesQuery, useDeleteProjectTemplateMutation, type ProjectTemplateRecord } from '../../api/projectTemplates';
import { apiErrorMessage } from '../../api/client';
import { useTranslation } from '../../i18n/useTranslation';

// Ported from MboaTrustFrontend/src/screens/TemplatesScreen.tsx — a
// management view (view + delete) of saved milestone-breakdown templates.
// Real backend-backed (GET/DELETE /project-templates), same as web — and
// like web, nothing in either app currently offers a "save this as a
// template" action anywhere, so an empty list here is expected until that
// creation flow exists (a separate, pre-existing gap on web too, not
// something unique to this port).
function templateTotal(tpl: ProjectTemplateRecord): number {
  return tpl.milestones.reduce((s, m) => s + m.amount, 0);
}

export function TemplatesScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { show: showToast } = useToast();
  const { data: templates, isLoading } = useProjectTemplatesQuery();
  const deleteMutation = useDeleteProjectTemplateMutation();

  const handleDelete = (tpl: ProjectTemplateRecord) => {
    Alert.alert(t('templates.deleteTitle'), `"${tpl.name}" ${t('templates.deleteDescSuffix')}`, [
      { text: t('templates.cancel'), style: 'cancel' },
      {
        text: t('templates.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(tpl.id);
            showToast({ title: t('templates.deleted'), tone: 'success' });
          } catch (err) {
            showToast({ title: t('templates.failedToDelete'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
          }
        },
      },
    ]);
  };

  return (
    <Screen header={<Header title={t('templates.title')} subtitle={`${templates?.length ?? 0} ${t('templates.saved')}`} back />}>
      <View style={{ padding: 16, gap: 14 }}>
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : !templates || templates.length === 0 ? (
          <EmptyState
            icon={Puzzle}
            title={t('templates.noTemplatesYet')}
            description={t('templates.noTemplatesDesc')}
          />
        ) : (
          templates.map((tpl) => (
            <Card key={tpl.id} style={{ padding: 16, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15, flex: 1 }}>{tpl.name}</Text>
                <Pressable onPress={() => handleDelete(tpl)} accessibilityRole="button">
                  <Text style={{ fontFamily: FONT.mono, color: colors.seal, fontSize: 11 }}>{t('templates.delete')}</Text>
                </Pressable>
              </View>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                {tpl.category} · {tpl.milestones.length} {t('templates.milestones')}
              </Text>
              <View style={{ gap: 4 }}>
                {tpl.milestones.map((m, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12 }}>{m.title}</Text>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 12 }}>{fmt(m.amount)}</Text>
                  </View>
                ))}
              </View>
              <View style={{ paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.parchmentDark, alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: FONT.serifBold, color: colors.forest, fontSize: 15 }}>{fmt(templateTotal(tpl))}</Text>
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}
