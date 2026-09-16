import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Trash2, Check } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { TextField } from '../components/TextField';
import { PillButton } from '../components/PillButton';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useToast } from '../components/Toast';
import { useApp } from '../context/AppContext';
import { api, apiErrorMessage } from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translations';

type DeleteOption = 'deactivate' | 'delete';

// Ported 1:1 from MboaTrustFrontend/src/screens/SharedScreens.tsx's
// DeleteAccountScreen — same two real options (soft deactivate vs. hard
// delete), same backend calls (PATCH /users/me/deactivate,
// DELETE /users/me with {confirm:'DELETE'}), same confirmation gating.
// Replaces the previous mobile Settings screen's "Delete Account" button,
// which showed a native confirm alert claiming permanent deletion but only
// ever called logout() — no request to the backend was ever made.
export function DeleteAccountScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { show: showToast } = useToast();
  const { logout } = useApp();
  const navigation = useNavigation();
  const [option, setOption] = useState<DeleteOption>('deactivate');
  const [understood, setUnderstood] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);

  const canSubmit = option === 'deactivate' ? understood : understood && confirmText.trim() === 'DELETE';

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      if (option === 'deactivate') {
        await api.patch('/users/me/deactivate');
      } else {
        await api.delete('/users/me', { data: { confirm: 'DELETE' } });
      }
      await logout();
    } catch (err) {
      showToast({
        title: option === 'deactivate' ? t('deleteAccount.couldNotDeactivate') : t('deleteAccount.couldNotDelete'),
        description: apiErrorMessage(err, t('menu.pleaseTryAgain')),
        tone: 'error',
      });
      setBusy(false);
    }
  };

  return (
    <Screen header={<Header title={t('deleteAccount.title')} back />}>
      <View style={{ padding: 20, gap: 18 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(['deactivate', 'delete'] as const).map((opt) => {
            const active = option === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => {
                  setOption(opt);
                  setUnderstood(false);
                  setConfirmText('');
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                style={{
                  flex: 1,
                  borderRadius: 14,
                  borderWidth: 2,
                  padding: 14,
                  borderColor: active ? colors.seal : colors.parchmentDark,
                  backgroundColor: active ? colors.seal + '14' : colors.surface,
                }}
              >
                <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 14, color: active ? colors.seal : colors.ink }}>
                  {opt === 'deactivate' ? t('deleteAccount.deactivate') : t('deleteAccount.deleteEverything')}
                </Text>
                <Text style={{ fontFamily: FONT.mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4, color: active ? colors.seal : colors.inkSubtle }}>
                  {opt === 'deactivate' ? t('deleteAccount.reversibleByAdmin') : t('deleteAccount.permanentCannotUndo')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.seal + '33', backgroundColor: colors.seal + '0F', padding: 18, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Trash2 size={18} color={colors.seal} />
            <Text style={{ fontFamily: FONT.serifBold, color: colors.seal, fontSize: 15 }}>
              {option === 'deactivate' ? t('deleteAccount.willDeactivateTitle') : t('deleteAccount.willDeleteTitle')}
            </Text>
          </View>
          {(option === 'deactivate'
            ? (['deleteAccount.deactivateBullet1', 'deleteAccount.deactivateBullet2', 'deleteAccount.deactivateBullet3'] as const)
            : (['deleteAccount.deleteBullet1', 'deleteAccount.deleteBullet2', 'deleteAccount.deleteBullet3'] as const)
          ).map((lineKey, i) => (
            <Text key={i} style={{ fontFamily: FONT.sans, color: colors.seal, fontSize: 13, lineHeight: 19 }}>
              • {t(lineKey)}
            </Text>
          ))}
        </View>

        <Pressable
          onPress={() => setUnderstood((u) => !u)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: understood }}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              borderWidth: 2,
              marginTop: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderColor: understood ? colors.forest : colors.parchmentDark,
              backgroundColor: understood ? colors.forest : 'transparent',
            }}
          >
            {understood && <Check size={12} color="#fff" strokeWidth={3} />}
          </View>
          <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 13, flex: 1, lineHeight: 19 }}>
            {option === 'deactivate' ? t('deleteAccount.understandDeactivate') : t('deleteAccount.understandDelete')}
          </Text>
        </Pressable>

        {option === 'delete' && (
          <TextField label={t('deleteAccount.typeDeleteLabel')} value={confirmText} onChangeText={setConfirmText} placeholder="DELETE" autoCapitalize="characters" autoCorrect={false} returnKeyType="done" />
        )}

        <PillButton variant="danger" onPress={submit} disabled={!canSubmit || busy} loading={busy} fullWidth>
          {option === 'deactivate' ? t('deleteAccount.deactivateButton') : t('deleteAccount.deleteButton')}
        </PillButton>
        <PillButton variant="secondary" onPress={() => navigation.goBack()} fullWidth>
          {t('common.cancel')}
        </PillButton>
      </View>
    </Screen>
  );
}
