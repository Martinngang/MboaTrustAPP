import { useRef, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, ActivityIndicator, Image, TextInput, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ShieldCheck,
  Award,
  Star,
  Plus,
  X,
  FileCheck,
  CheckCircle2,
  Briefcase,
  UserSquare2,
  Calendar,
  ChevronRight,
  ImagePlus,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PillButton } from '../../components/PillButton';
import { Avatar } from '../../components/Avatar';
import { Stars } from '../../components/Stars';
import { useToast } from '../../components/Toast';
import { apiErrorMessage } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { useCertificationsQuery, useAddCertificationMutation, useRemoveCertificationMutation } from '../../api/contracts';
import { useContractorPortfolioQuery } from '../../api/contractors';
import { useRatingSummaryQuery, useRatingsQuery } from '../../api/ratings';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from '../../i18n/useTranslation';

export function ContractorProfileCertsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { name, avatarUrl, user } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { data: certs, isLoading } = useCertificationsQuery();
  const { data: portfolio } = useContractorPortfolioQuery(user?._id);
  const { data: ratingSummary } = useRatingSummaryQuery(user?._id);
  const { data: reviews = [] } = useRatingsQuery({ toUserId: user?._id, roleContext: 'contractor' });
  const addCertMutation = useAddCertificationMutation();
  const removeCertMutation = useRemoveCertificationMutation();

  const deleteCertification = (certId: string) => {
    Alert.alert(t('contractorCerts.removeTitle'), t('contractorCerts.removeConfirm'), [
      { text: t('contractorCerts.cancel'), style: 'cancel' },
      {
        text: t('contractorCerts.remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await removeCertMutation.mutateAsync(certId);
          } catch (err) {
            showToast({ title: t('contractorCerts.removeFailed'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
          }
        },
      },
    ]);
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [year, setYear] = useState('');
  const [document, setDocument] = useState<{ uri: string; fileName?: string | null; mimeType?: string | null } | null>(null);
  const issuerRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const pickDocument = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast({ title: t('contractorCerts.permissionRequired'), description: t('contractorCerts.photoLibraryAccessCert'), tone: 'error' });
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setDocument({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType });
  };

  const handleAddCert = async () => {
    if (!title.trim() || !issuer.trim()) {
      showToast({ title: t('contractorCerts.missingDetails'), description: t('contractorCerts.missingDetailsDesc'), tone: 'error' });
      return;
    }

    try {
      await addCertMutation.mutateAsync({
        title: title.trim(),
        issuer: issuer.trim(),
        issuedAt: year.trim() ? `${year.trim()}-01-01` : undefined,
        file: document ?? undefined,
      });

      showToast({ title: t('contractorCerts.certAdded'), description: t('contractorCerts.credentialsUpdated'), tone: 'success' });
      setModalOpen(false);
      setTitle('');
      setIssuer('');
      setYear('');
      setDocument(null);
    } catch (err: any) {
      showToast({ title: t('contractorCerts.additionError'), description: err?.message || t('contractorCerts.couldNotAdd'), tone: 'error' });
    }
  };

  return (
    <Screen header={<Header title={t('contractorPortfolio.title')} back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Contractor Profile Card */}
        <Card style={{ padding: 18, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar name={name || 'Contractor'} avatarUrl={avatarUrl} size={54} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>
                {name || 'Contractor'}
              </Text>
              {ratingSummary && ratingSummary.count > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Star size={13} color={colors.amber} fill={colors.amber} />
                    <Text style={{ fontFamily: FONT.mono, color: colors.ink, fontSize: 12, fontWeight: '700' }}>
                      {ratingSummary.average?.toFixed(1)}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>
                    · {ratingSummary.count} {ratingSummary.count === 1 ? t('contractorCerts.rating') : t('contractorCerts.ratings')}
                  </Text>
                </View>
              ) : (
                <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                  {t('contractorCerts.noRatingsYet')}
                </Text>
              )}
            </View>
          </View>
        </Card>

        {/* Stat Tiles — Jobs completed / Rating / KYC status */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { label: t('contractorCerts.jobsCompleted'), value: String(portfolio?.stats.completedProjects ?? 0) },
            { label: t('contractorCerts.statRating'), value: portfolio && portfolio.stats.ratingCount > 0 ? (portfolio.stats.avgRating ?? 0).toFixed(1) : '—' },
            { label: t('contractorCerts.status'), value: portfolio?.kycStatus === 'verified' ? t('contractorCerts.verifiedBadge') : t('contractorCerts.pendingReviewBadge') },
          ].map((s) => (
            <Card key={s.label} style={{ flex: 1, padding: 12, alignItems: 'center', gap: 2 }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15 }}>{s.value}</Text>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase' }}>{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* Client Reviews */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('contractorCerts.clientReviews')}
          </Text>
          {reviews.length === 0 ? (
            <Card style={{ padding: 14, alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center' }}>
                {t('contractorCerts.noReviewsYet')}
              </Text>
            </Card>
          ) : (
            reviews.map((r) => (
              <Card key={r.id} style={{ padding: 14, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>{r.fromName}</Text>
                  <Stars rating={r.score} />
                </View>
                {r.comment ? (
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17, fontStyle: 'italic' }}>
                    "{r.comment}"
                  </Text>
                ) : null}
              </Card>
            ))
          )}
        </View>

        {/* Portfolio & Availability — the full public-facing profile
            (headline, bio, skills, portfolio images) and calendar this
            screen's own certs list doesn't cover. */}
        <View style={{ gap: 8 }}>
          <Pressable
            onPress={() => user?._id && navigation.navigate('ContractorPortfolio', { userId: user._id })}
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.parchmentDark, backgroundColor: colors.surface }}
          >
            <UserSquare2 size={18} color={colors.forest} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>{t('contractorCerts.viewEditFullPortfolio')}</Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11, marginTop: 1 }}>{t('contractorCerts.viewEditSub')}</Text>
            </View>
            <ChevronRight size={16} color={colors.inkSubtle} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('AvailabilityCalendar', undefined)}
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.parchmentDark, backgroundColor: colors.surface }}
          >
            <Calendar size={18} color={colors.forest} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>{t('contractorCerts.myAvailability')}</Text>
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 11, marginTop: 1 }}>{t('contractorCerts.myAvailabilitySub')}</Text>
            </View>
            <ChevronRight size={16} color={colors.inkSubtle} />
          </Pressable>
        </View>

        {/* Certifications Header & List */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Award size={18} color={colors.forest} />
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
                {t('contractorCerts.licensesAndCerts')}
              </Text>
            </View>

            <Pressable
              onPress={() => setModalOpen(true)}
              accessibilityRole="button"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: colors.forest,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
              }}
            >
              <Plus size={14} color="#fff" />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 12 }}>{t('contractorCerts.add')}</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.forest} style={{ marginTop: 20 }} />
          ) : (
            (certs || []).map((c) => {
              const badgeColor = c.verified ? colors.forest : c.rejected ? colors.seal : colors.inkSubtle;
              const badgeLabel = c.verified ? t('contractorCerts.verifiedBadge') : c.rejected ? t('contractorCerts.rejectedBadge') : t('contractorCerts.pendingReviewBadge');
              const issuedYear = c.issuedAt ? new Date(c.issuedAt).getFullYear() : null;
              return (
                <Card key={c.id} style={{ padding: 14, gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    {c.documentUrl ? (
                      <Image source={{ uri: c.documentUrl }} style={{ width: 44, height: 44, borderRadius: 8 }} resizeMode="cover" />
                    ) : null}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
                        {c.title}
                      </Text>
                      <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
                        {c.issuer}{issuedYear ? ` · ${t('contractorCerts.issued')} ${issuedYear}` : ''}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: badgeColor + '15',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                      }}
                    >
                      <ShieldCheck size={12} color={badgeColor} />
                      <Text style={{ fontFamily: FONT.mono, color: badgeColor, fontSize: 10, fontWeight: '700' }}>
                        {badgeLabel}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => deleteCertification(c.id)}
                    disabled={removeCertMutation.isPending}
                    accessibilityRole="button"
                    style={{ alignSelf: 'flex-end' }}
                  >
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>{t('contractorCerts.remove')}</Text>
                  </Pressable>
                </Card>
              );
            })
          )}
        </View>
      </View>

      {/* Add Certification Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 18 }}>{t('contractorCerts.addModalTitle')}</Text>
              <Pressable onPress={() => setModalOpen(false)} hitSlop={6}>
                <X size={20} color={colors.inkMuted} />
              </Pressable>
            </View>

            <TextField
              label={t('contractorCerts.certTitleLabel')}
              placeholder="e.g. Master Mason Structural Certification"
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => issuerRef.current?.focus()}
            />

            <TextField
              ref={issuerRef}
              label={t('contractorCerts.issuerLabel')}
              placeholder="e.g. Ministry of Public Works / ONGC"
              value={issuer}
              onChangeText={setIssuer}
              autoCapitalize="words"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => yearRef.current?.focus()}
            />

            <TextField
              ref={yearRef}
              label={t('contractorCerts.yearIssuedLabel')}
              placeholder="2024"
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
              returnKeyType="done"
            />

            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                {t('contractorCerts.certDocumentLabel')}
              </Text>
              {document ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Image source={{ uri: document.uri }} style={{ width: 56, height: 56, borderRadius: 10 }} resizeMode="cover" />
                  <Pressable onPress={() => setDocument(null)} accessibilityRole="button">
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>{t('contractorCerts.remove')}</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={pickDocument}
                  accessibilityRole="button"
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.parchmentDark, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 }}
                >
                  <ImagePlus size={16} color={colors.inkSubtle} />
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>{t('contractorCerts.attachPhoto')}</Text>
                </Pressable>
              )}
            </View>

            <PillButton variant="primary" onPress={handleAddCert} loading={addCertMutation.isPending} fullWidth>
              {t('contractorCerts.submitForVerification')}
            </PillButton>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
