import { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { ShieldCheck, Check, Upload, CheckCircle2, XCircle } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { PillButton } from '../components/PillButton';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { fmt } from '../components/fmt';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useMyKycStatusQuery, useUploadKycDocumentMutation, useSubmitKycMutation, KYC_LARGE_TXN_THRESHOLD, type KycResult } from '../api/kyc';
import { apiErrorMessage } from '../api/client';
import type { MainStackParamList } from '../navigation/types';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translations';

const ID_TYPES: { label: string; key: TranslationKey }[] = [
  { label: 'National ID card', key: 'kyc.idTypeNational' },
  { label: 'Passport', key: 'kyc.idTypePassport' },
  { label: 'Residence permit', key: 'kyc.idTypeResidence' },
];

const STATUS_KEY: Record<string, TranslationKey> = {
  pending: 'kyc.statusPending',
  verified: 'kyc.statusVerified',
  rejected: 'kyc.statusRejected',
};

/** Two real steps, not three — the backend's Smile Identity Basic KYC job
 * verifies an ID number against the issuing authority's records; it has no
 * selfie/facial-match capability, so a "liveness selfie" step doesn't
 * correspond to anything the backend can actually check. */
export function KycScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { data: status, isLoading } = useMyKycStatusQuery();
  const uploadDocument = useUploadKycDocumentMutation();
  const submitKyc = useSubmitKycMutation();

  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<'id' | 'review' | 'done'>('id');
  const [idType, setIdType] = useState(ID_TYPES[0].label);
  const [idNumber, setIdNumber] = useState('');
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentPreviewUri, setDocumentPreviewUri] = useState<string | null>(null);
  const [result, setResult] = useState<KycResult | null>(null);

  const pickDocument = async () => {
    const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permStatus !== 'granted') {
      showToast({ title: t('kyc.permissionRequired'), description: t('kyc.cameraRollAccess'), tone: 'error' });
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (picked.canceled || !picked.assets?.[0]) return;

    const asset = picked.assets[0];
    setDocumentPreviewUri(asset.uri);
    try {
      const url = await uploadDocument.mutateAsync({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType });
      setDocumentUrl(url);
    } catch (err) {
      showToast({ title: t('kyc.uploadFailed'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
      setDocumentPreviewUri(null);
    }
  };

  const finish = async () => {
    try {
      const kycResult = await submitKyc.mutateAsync({ idType, idNumber: idNumber.trim(), documentUrl: documentUrl ?? undefined });
      setResult(kycResult);
      setStep('done');
    } catch (err) {
      showToast({ title: t('kyc.verificationFailedToSubmit'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  if (showForm && step === 'done' && result) {
    return (
      <Screen header={<Header title={t('kyc.verifyIdentityTitle')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: result.verified ? colors.forest : colors.seal,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {result.verified ? <CheckCircle2 size={32} color="#fff" /> : <XCircle size={32} color="#fff" />}
          </View>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20, textAlign: 'center' }}>
            {result.verified ? t('kyc.identityVerifiedTitle') : t('kyc.verificationNotPassTitle')}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
            {result.verified ? t('kyc.canNowFundText') : t('kyc.doubleCheckText')}
          </Text>
          <PillButton onPress={() => { setShowForm(false); setStep('id'); }} fullWidth>
            {t('kyc.viewVerificationStatus')}
          </PillButton>
        </View>
      </Screen>
    );
  }

  if (showForm) {
    return (
      <Screen header={<Header title={t('kyc.verifyIdentityTitle')} subtitle={step === 'id' ? `${t('help.stepOf')} 1 ${t('help.of')} 2` : `${t('help.stepOf')} 2 ${t('help.of')} 2`} back onBack={() => (step === 'review' ? setStep('id') : setShowForm(false))} />}>
        <View style={{ padding: 16, gap: 18 }}>
          {step === 'id' && (
            <>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13 }}>
                {t('kyc.chooseDocTypeText')}
              </Text>

              <Card style={{ padding: 16, gap: 12 }}>
                <View style={{ gap: 8 }}>
                  {ID_TYPES.map((it) => {
                    const active = idType === it.label;
                    return (
                      <Pressable
                        key={it.label}
                        onPress={() => setIdType(it.label)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 1.5,
                          borderColor: active ? colors.forest : colors.parchmentDark,
                          backgroundColor: active ? colors.forest + '12' : colors.parchment,
                        }}
                      >
                        <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>{t(it.key)}</Text>
                        {active && (
                          <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={11} color="#fff" strokeWidth={3} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                <TextField label={t('kyc.documentNumberLabel')} placeholder="e.g. 123456789" value={idNumber} onChangeText={setIdNumber} autoCapitalize="characters" returnKeyType="done" />
              </Card>

              <Pressable
                onPress={pickDocument}
                disabled={uploadDocument.isPending}
                style={{
                  borderRadius: 16,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: documentUrl ? colors.forest : colors.parchmentDark,
                  backgroundColor: documentUrl ? colors.forest + '10' : colors.parchment,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: documentPreviewUri ? 0 : 40,
                  overflow: 'hidden',
                }}
              >
                {uploadDocument.isPending ? (
                  <ActivityIndicator color={colors.forest} style={{ paddingVertical: 40 }} />
                ) : documentPreviewUri ? (
                  <Image source={{ uri: documentPreviewUri }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
                ) : (
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <Upload size={28} color={colors.inkMuted} />
                    <Text style={{ fontFamily: FONT.sansMedium, color: colors.inkMuted, fontSize: 13 }}>{t('kyc.tapToUploadIdDocument')}</Text>
                    <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {t('kyc.jpgOrPng')}
                    </Text>
                  </View>
                )}
              </Pressable>
            </>
          )}

          {step === 'review' && (
            <>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13 }}>
                {t('kyc.reviewSubmissionText')}
              </Text>
              <Card style={{ padding: 16, gap: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>{t('kyc.documentTypeLabel')}</Text>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>{idType}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>{t('kyc.documentNumberLabel')}</Text>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>{idNumber}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>{t('kyc.idDocumentLabel')}</Text>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 13 }}>
                    {documentUrl ? t('kyc.uploadedCheck') : t('kyc.notUploaded')}
                  </Text>
                </View>
              </Card>
              <Card style={{ padding: 14, backgroundColor: colors.amber + '18', borderColor: colors.amber, borderWidth: 1 }}>
                <Text style={{ fontFamily: FONT.sans, color: colors.forestDark, fontSize: 12, lineHeight: 17 }}>
                  {t('kyc.consentText')}
                </Text>
              </Card>
            </>
          )}

          <PillButton
            variant="primary"
            onPress={() => (step === 'id' ? setStep('review') : finish())}
            loading={submitKyc.isPending}
            disabled={(step === 'id' && (!idType || !idNumber.trim() || !documentUrl)) || (step === 'review' && submitKyc.isPending)}
            fullWidth
          >
            {step === 'review' ? t('kyc.submitForVerification') : t('common.continue')}
          </PillButton>
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title={t('kyc.identityVerificationTitle')} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        <Card style={{ padding: 16, gap: 8, alignItems: 'center' }}>
          <View style={{ alignSelf: 'center' }}>
            <StatusBadge status={isLoading ? 'pending' : status || 'unverified'} />
          </View>
          {!isLoading && (
            <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center', lineHeight: 18, marginTop: 4 }}>
              {status && STATUS_KEY[status] ? t(STATUS_KEY[status]) : `${t('kyc.statusUnverifiedPart1')} ${fmt(KYC_LARGE_TXN_THRESHOLD)}.`}
            </Text>
          )}
        </Card>

        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {t('kyc.whyWeVerifyIdentity')}
          </Text>
          {([
            { icon: ShieldCheck, key: 'kyc.reason1' as TranslationKey },
            { icon: ShieldCheck, key: 'kyc.reason2' as TranslationKey },
            { icon: ShieldCheck, key: 'kyc.reason3' as TranslationKey },
          ]).map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.parchmentDark }}>
              <item.icon size={16} color={colors.forest} />
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, flex: 1, lineHeight: 17 }}>{t(item.key)}</Text>
            </View>
          ))}
        </View>

        {(status === 'unverified' || status === 'rejected') && !isLoading && (
          <PillButton variant="primary" onPress={() => setShowForm(true)} fullWidth>
            {status === 'rejected' ? t('kyc.resubmitVerification') : t('kyc.startVerification')}
          </PillButton>
        )}
      </View>
    </Screen>
  );
}
