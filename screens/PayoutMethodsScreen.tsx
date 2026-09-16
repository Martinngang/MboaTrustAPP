import { useRef, useState } from 'react';
import { View, Text, Pressable, Modal, Alert, TextInput } from 'react-native';
import { Smartphone, Plus, Trash2, CheckCircle2, ShieldCheck, X } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { PillButton } from '../components/PillButton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import { useAddPayoutMethodMutation, useRemovePayoutMethodMutation, useSetDefaultPayoutMethodMutation, type PayoutMethod } from '../api/payoutMethods';
import { apiErrorMessage } from '../api/client';
import { useTranslation } from '../i18n/useTranslation';

const MAX_METHODS = 5;

export function PayoutMethodsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useApp();
  const { show: showToast } = useToast();

  const addMutation = useAddPayoutMethodMutation();
  const removeMutation = useRemovePayoutMethodMutation();
  const defaultMutation = useSetDefaultPayoutMethodMutation();

  const payoutMethods: PayoutMethod[] = user?.payoutMethods || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [provider, setProvider] = useState<'mtn_momo' | 'orange_money'>('mtn_momo');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [label, setLabel] = useState('');
  const phoneRef = useRef<TextInput>(null);

  const handleAdd = async () => {
    if (!phoneNumber.trim()) {
      showToast({ title: t('payout.phoneRequired'), description: t('payout.phoneRequiredDesc'), tone: 'error' });
      return;
    }
    try {
      await addMutation.mutateAsync({
        label: label.trim() || (provider === 'mtn_momo' ? t('payout.momoAccount') : t('payout.omAccount')),
        provider,
        phoneNumber: phoneNumber.trim(),
      });
      showToast({ title: t('payout.saved'), tone: 'success' });
      setModalOpen(false);
      setPhoneNumber('');
      setLabel('');
    } catch (err) {
      showToast({ title: t('payout.failedToAdd'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await defaultMutation.mutateAsync(id);
      showToast({ title: t('payout.defaultUpdated'), tone: 'success' });
    } catch (err) {
      showToast({ title: t('payout.updateFailed'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  const handleRemove = (id: string) => {
    Alert.alert(t('payout.removeTitle'), t('payout.removeConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('payout.remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMutation.mutateAsync(id);
            showToast({ title: t('payout.removed'), tone: 'neutral' });
          } catch (err) {
            showToast({ title: t('payout.removalFailed'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
          }
        },
      },
    ]);
  };

  return (
    <Screen header={<Header title={t('payout.title')} subtitle={t('payout.subtitle')} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Card style={{ padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <ShieldCheck size={18} color={colors.forest} style={{ marginTop: 1 }} />
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, flex: 1, lineHeight: 17 }}>
            {t('payout.infoBanner')}
          </Text>
        </Card>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('payout.savedAccounts')} ({payoutMethods.length}/{MAX_METHODS})
          </Text>
          {payoutMethods.length < MAX_METHODS && (
            <Pressable onPress={() => setModalOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Plus size={13} color={colors.forest} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>{t('payout.addAccount')}</Text>
            </Pressable>
          )}
        </View>

        {payoutMethods.length === 0 ? (
          <EmptyState
            icon={Smartphone}
            title={t('payout.noAccountTitle')}
            description={t('payout.noAccountDesc')}
            action={
              <PillButton onPress={() => setModalOpen(true)} fullWidth>
                {t('payout.addAccountButton')}
              </PillButton>
            }
          />
        ) : (
          <View style={{ gap: 10 }}>
            {payoutMethods.map((pm) => (
              <Card
                key={pm._id}
                style={{
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderColor: pm.isDefault ? colors.forest : colors.parchmentDark,
                  borderWidth: pm.isDefault ? 1.5 : 1,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: pm.provider === 'mtn_momo' ? '#FFCC00' : '#FF6600',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: FONT.mono, fontSize: 10, fontWeight: '700', color: pm.provider === 'mtn_momo' ? '#111' : '#fff' }}>
                    {pm.provider === 'mtn_momo' ? 'MoMo' : 'OM'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }} numberOfLines={1}>
                      {pm.label || (pm.provider === 'mtn_momo' ? t('payout.momoLabel') : t('payout.omLabel'))}
                    </Text>
                    {pm.isDefault && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.forest + '18', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <CheckCircle2 size={10} color={colors.forest} />
                        <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 9, fontWeight: '700' }}>{t('payout.default')}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 11, marginTop: 2 }}>{pm.phoneNumber}</Text>
                </View>
                {!pm.isDefault && (
                  <Pressable
                    onPress={() => handleSetDefault(pm._id)}
                    style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: colors.parchmentDark }}
                  >
                    <Text style={{ fontFamily: FONT.sansMedium, color: colors.inkMuted, fontSize: 11 }}>{t('payout.setDefault')}</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => handleRemove(pm._id)} hitSlop={6}>
                  <Trash2 size={16} color={colors.seal} />
                </Pressable>
              </Card>
            ))}
          </View>
        )}
      </View>

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>{t('payout.addAccountButton')}</Text>
              <Pressable onPress={() => setModalOpen(false)} hitSlop={6}>
                <X size={20} color={colors.inkMuted} />
              </Pressable>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>{t('payout.provider')}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['mtn_momo', 'orange_money'] as const).map((p) => {
                  const active = provider === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setProvider(p)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        alignItems: 'center',
                        borderColor: active ? colors.forest : colors.parchmentDark,
                        backgroundColor: active ? colors.forest + '15' : colors.surface,
                      }}
                    >
                      <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 12, color: active ? colors.forest : colors.inkMuted }}>
                        {p === 'mtn_momo' ? t('payout.momoLabel') : t('payout.omLabel')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <TextField
              label={t('payout.accountLabelOptional')}
              placeholder={t('payout.accountLabelPlaceholder')}
              value={label}
              onChangeText={setLabel}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            <TextField
              ref={phoneRef}
              label={t('payout.phoneNumberLabel')}
              placeholder="677123456"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoComplete="tel"
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />

            <PillButton variant="primary" onPress={handleAdd} loading={addMutation.isPending} disabled={addMutation.isPending} fullWidth>
              {t('payout.savePayoutAccount')}
            </PillButton>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
