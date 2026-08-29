import { useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ShieldCheck,
  CheckCircle2,
  Camera,
  FileCheck,
  Check,
  Globe,
  Upload,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { PillButton } from '../components/PillButton';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useKycStatusQuery, useSubmitKycMutation } from '../api/kyc';
import type { MainStackParamList } from '../navigation/types';

const DOC_TYPES = [
  { id: 'cni', label: 'Cameroon National ID (CNI)' },
  { id: 'passport', label: 'International Passport' },
  { id: 'residence_permit', label: 'Diaspora Residence Card' },
];

export function KycScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();

  const { data: kyc, isLoading } = useKycStatusQuery();
  const submitKycMutation = useSubmitKycMutation();

  const [docType, setDocType] = useState('cni');
  const [docNumber, setDocNumber] = useState(kyc?.documentNumber || 'CNI-10293847');
  const [country, setCountry] = useState(kyc?.country || 'Cameroon');
  const [idPhoto, setIdPhoto] = useState(
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&h=400&fit=crop'
  );
  const [selfiePhoto, setSelfiePhoto] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=400&fit=crop'
  );

  const handleSubmit = async () => {
    if (!docNumber.trim()) {
      showToast({ title: 'Document Number Required', description: 'Please enter your ID/Passport number.', tone: 'error' });
      return;
    }

    try {
      await submitKycMutation.mutateAsync({
        documentType: docType,
        documentNumber: docNumber.trim(),
        country: country.trim(),
        documentFrontUrl: idPhoto,
        selfieUrl: selfiePhoto,
      });

      showToast({
        title: 'KYC Submitted!',
        description: 'Your identity documents are being verified by our compliance team.',
        tone: 'success',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({ title: 'Submission Error', description: err?.message || 'Could not submit KYC.', tone: 'error' });
    }
  };

  return (
    <Screen header={<Header title="Identity Verification (KYC)" back />}>
      <View style={{ padding: 16, gap: 18 }}>
        {/* Verification Status Card */}
        <Card style={{ padding: 16, backgroundColor: colors.forest + '12', borderColor: colors.forest + '30', gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={18} color={colors.forest} />
              <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>
                Identity Status
              </Text>
            </View>
            <StatusBadge status={kyc?.status || 'verified'} />
          </View>
          <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
            Verified accounts enjoy higher milestone escrow funding limits and instant Mobile Money withdrawals.
          </Text>
        </Card>

        {/* Document Type Picker */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
            Select Document Type
          </Text>

          <View style={{ gap: 8 }}>
            {DOC_TYPES.map((t) => {
              const active = docType === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setDocType(t.id)}
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
                  <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>
                    {t.label}
                  </Text>
                  {active && (
                    <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <TextField
            label="Document ID Number"
            placeholder="e.g. 1029384729"
            value={docNumber}
            onChangeText={setDocNumber}
          />

          <TextField
            label="Issuing Country"
            placeholder="e.g. Cameroon, France, USA"
            value={country}
            onChangeText={setCountry}
          />
        </Card>

        {/* Document Uploads Preview */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
            Document & Selfie Photos
          </Text>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                ID Front Photo
              </Text>
              <View style={{ height: 110, backgroundColor: colors.parchment, borderRadius: 10, overflow: 'hidden' }}>
                <Image source={{ uri: idPhoto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
            </View>

            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>
                Liveness Selfie
              </Text>
              <View style={{ height: 110, backgroundColor: colors.parchment, borderRadius: 10, overflow: 'hidden' }}>
                <Image source={{ uri: selfiePhoto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
            </View>
          </View>
        </Card>

        {/* Submit KYC Button */}
        <PillButton
          variant="primary"
          onPress={handleSubmit}
          loading={submitKycMutation.isPending}
          disabled={submitKycMutation.isPending}
          fullWidth
        >
          Submit Identity Verification
        </PillButton>
      </View>
    </Screen>
  );
}
