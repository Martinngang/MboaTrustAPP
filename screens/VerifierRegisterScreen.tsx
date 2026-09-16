import { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Image } from 'react-native';
import { Check, ImagePlus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { TextField } from '../components/TextField';
import { PillButton } from '../components/PillButton';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useToast } from '../components/Toast';
import { apiErrorMessage } from '../api/client';
import { useUpsertVerifierProfileMutation } from '../api/verifier';
import { useApp } from '../context/AppContext';
import type { OnboardingStackParamList } from '../navigation/types';
import { useTranslation } from '../i18n/useTranslation';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'VerifierRegister'>;

// Ported from MboaTrustFrontend/src/screens/AdditionalScreens.tsx's
// VerifierRegistrationScreen — reachable two ways, exactly like web: as a
// self-service application from any role's Profile screen (an existing
// account adding Verifier on top of what it already has), or now directly
// from onboarding's RoleScreen for someone who wants to register AS a
// Verifier from scratch with no other role at all. POST /verifier-profiles/me
// creates a real pending application; the 'verifier' roleType itself is
// admin-grant-only (see docs/WEB_APP_MAP.md), so this never claims the role
// was granted. "Props" is typed against OnboardingStackParamList (same
// convention QuincaillerieRegisterScreen uses) even though this screen is
// also mounted in MainStack — both stacks declare the same route shape.
export function VerifierRegisterScreen(_props: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { show: showToast } = useToast();
  const { refresh } = useApp();
  const upsertProfile = useUpsertVerifierProfileMutation();
  const [specialty, setSpecialty] = useState('');
  const [region, setRegion] = useState('');
  const [bio, setBio] = useState('');
  const [document, setDocument] = useState<{ uri: string; fileName?: string | null; mimeType?: string | null } | null>(null);
  const [done, setDone] = useState(false);
  const regionRef = useRef<TextInput>(null);
  const bioRef = useRef<TextInput>(null);

  // A government ID is required before an admin can approve a verifier
  // application — ported from MboaTrustFrontend/src/screens/AdditionalScreens.tsx's
  // VerifierRegistrationScreen, which mobile previously had no equivalent
  // for at all (upsertProfile always sent no file).
  const pickDocument = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast({ title: t('verifierRegister.permissionRequired'), description: t('verifierRegister.photoLibraryAccess'), tone: 'error' });
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setDocument({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType });
  };

  const submit = async () => {
    if (!specialty.trim() || !region.trim()) {
      showToast({ title: t('verifierRegister.missingDetails'), description: t('verifierRegister.missingDetailsDesc'), tone: 'error' });
      return;
    }
    if (!document) {
      showToast({ title: t('verifierRegister.idRequired'), description: t('verifierRegister.idRequiredDesc'), tone: 'error' });
      return;
    }
    try {
      await upsertProfile.mutateAsync({
        specialties: [specialty.trim()],
        regions: [region.trim()],
        bio: bio.trim(),
        file: document,
      });
      setDone(true);
    } catch (err) {
      showToast({ title: t('verifierRegister.applicationFailed'), description: apiErrorMessage(err, t('menu.pleaseTryAgain')), tone: 'error' });
    }
  };

  if (done) {
    return (
      <Screen header={<Header title={t('verifierRegister.title')} back />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
            <Check size={28} color="#fff" />
          </View>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 20, textAlign: 'center' }}>{t('verifierRegister.applicationSubmitted')}</Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            {t('verifierRegister.submittedDesc')}
          </Text>
          <PillButton onPress={() => refresh()} fullWidth>
            {t('verifierRegister.backToDashboard')}
          </PillButton>
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<Header title={t('verifierRegister.title')} back />}>
      <View style={{ padding: 20, gap: 14 }}>
        <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13, lineHeight: 20 }}>
          {t('verifierRegister.intro')}
        </Text>
        <TextField
          label={t('verifierRegister.whatDoYouVerify')}
          value={specialty}
          onChangeText={setSpecialty}
          placeholder="e.g. Water & Sanitation, Electrical"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => regionRef.current?.focus()}
        />
        <TextField
          ref={regionRef}
          label={t('verifierRegister.regionYouCover')}
          value={region}
          onChangeText={setRegion}
          placeholder="e.g. Littoral"
          autoCapitalize="words"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => bioRef.current?.focus()}
        />
        <TextField
          ref={bioRef}
          label={t('verifierRegister.experienceOptional')}
          value={bio}
          onChangeText={setBio}
          placeholder="e.g. 5 years as a site engineer"
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />

        <View style={{ gap: 6 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('verifierRegister.idDocumentLabel')}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
            {t('verifierRegister.idDocumentDesc')}
          </Text>
          {document ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image source={{ uri: document.uri }} style={{ width: 56, height: 56, borderRadius: 10 }} resizeMode="cover" />
              <Pressable onPress={() => setDocument(null)} accessibilityRole="button">
                <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>{t('verifierRegister.remove')}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={pickDocument}
              accessibilityRole="button"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: colors.parchmentDark,
                borderRadius: 14,
                paddingVertical: 24,
              }}
            >
              <ImagePlus size={18} color={colors.inkSubtle} />
              <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 13 }}>{t('verifierRegister.uploadIdDocument')}</Text>
            </Pressable>
          )}
        </View>

        <PillButton onPress={submit} fullWidth disabled={upsertProfile.isPending || !document} loading={upsertProfile.isPending}>
          {t('verifierRegister.submitApplication')}
        </PillButton>
      </View>
    </Screen>
  );
}
