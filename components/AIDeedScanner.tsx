import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FileText, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { scanLandTitleDeed, type AIDeedScanResult } from '../api/geminiAI';

interface Props {
  onScanComplete?: (result: AIDeedScanResult) => void;
  /** `uri` is the local picked-file reference — pass it through if the
   * caller wants to actually upload this deed image as a real
   * verification document (see useAddLandDocumentMutation), not just run
   * it through the AI scanner. */
  onFileSelected?: (uri: string, base64: string, mimeType: string) => void;
}

const ALERT_ICON: Record<string, string> = {
  ok: '✓',
  missing_stamp: '⚠',
  mismatch: '✕',
  date_anomaly: '⚠',
  low_confidence: 'ℹ',
};

const ALERT_COLOR: Record<string, string> = {
  ok: '#1a7a4a',
  missing_stamp: '#b45309',
  mismatch: '#b91c1c',
  date_anomaly: '#b45309',
  low_confidence: '#6b7280',
};

function AuthenticityBar({ score, parchmentDark }: { score: number; parchmentDark: string }) {
  const barColor = score >= 80 ? '#1a7a4a' : score >= 55 ? '#b45309' : '#b91c1c';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1, height: 6, borderRadius: 4, backgroundColor: parchmentDark, overflow: 'hidden' }}>
        <View style={{ width: `${score}%`, height: '100%', backgroundColor: barColor, borderRadius: 4 }} />
      </View>
      <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: barColor, minWidth: 40 }}>{score}/100</Text>
    </View>
  );
}

export function AIDeedScanner({ onScanComplete, onFileSelected }: Props) {
  const { colors } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<AIDeedScanResult | null>(null);

  const pickDocument = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Access to camera roll is needed to upload your land title deed.');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      base64: true,
    });

    if (picked.canceled || !picked.assets?.[0]) return;

    const asset = picked.assets[0];
    setImageUri(asset.uri);
    setResult(null);

    const base64 = asset.base64 ?? '';
    const mimeType = asset.mimeType ?? 'image/jpeg';
    onFileSelected?.(asset.uri, base64, mimeType);

    if (!base64) return;
    setScanning(true);
    try {
      const analysis = await scanLandTitleDeed(base64, mimeType);
      setResult(analysis);
      onScanComplete?.(analysis);
    } catch {
      Alert.alert('AI Scan Failed', 'Could not reach the AI service. Please enter deed details manually.');
    } finally {
      setScanning(false);
    }
  }, [onFileSelected, onScanComplete]);

  return (
    <View style={{ gap: 12 }}>
      {/* Upload zone */}
      <Pressable
        onPress={pickDocument}
        style={{
          borderRadius: 14,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: imageUri ? colors.forest : colors.parchmentDark,
          overflow: 'hidden',
          backgroundColor: imageUri ? 'transparent' : colors.parchment,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: imageUri ? 180 : 110,
        }}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: '100%', height: 180, resizeMode: 'cover' }} />
        ) : (
          <View style={{ alignItems: 'center', gap: 8, padding: 24 }}>
            <FileText size={32} color={colors.inkMuted} />
            <Text style={{ fontFamily: FONT.sansMedium, color: colors.inkMuted, fontSize: 14 }}>Upload Titre Foncier or Cadastral Plan</Text>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>
              AI will extract all deed fields automatically
            </Text>
          </View>
        )}
      </Pressable>

      {/* Scanning indicator */}
      {scanning && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: colors.forest + '15' }}>
          <ActivityIndicator size="small" color={colors.forest} />
          <View>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>Gemini AI Scanning Deed…</Text>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>Extracting title number, plot area, stamps, beacons</Text>
          </View>
        </View>
      )}

      {/* Extracted Result Card */}
      {result && (
        <View style={{ borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.parchmentDark }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: colors.forest }}>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 13 }}>📑 AI Deed Extraction</Text>
            <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Gemini 2.0 Flash</Text>
          </View>

          {/* Authenticity Score */}
          <View style={{ padding: 12, backgroundColor: colors.parchment, borderBottomWidth: 1, borderBottomColor: colors.parchmentDark }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Document Authenticity Score
            </Text>
            <AuthenticityBar score={result.authenticityScore} parchmentDark={colors.parchmentDark} />
          </View>

          {/* Extracted Fields */}
          <View style={{ padding: 12, backgroundColor: colors.surface, gap: 10 }}>
            {[
              { label: 'Title Number (TF)', value: result.titleNumber },
              { label: 'Conservation Office', value: result.conservationOffice },
              { label: 'Registered Owner', value: result.ownerName },
              { label: 'Plot Area', value: result.plotAreaSqm ? `${result.plotAreaSqm.toLocaleString('fr-FR')} m²` : null },
              { label: 'Beacon Coordinates', value: result.beaconCoordinates },
              { label: 'Registration Date', value: result.registrationDate },
            ].map(({ label, value }) => (
              <View key={label} style={{ borderBottomWidth: 1, borderBottomColor: colors.parchmentDark, paddingBottom: 8 }}>
                <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</Text>
                <Text style={{ fontFamily: FONT.sansSemiBold, color: value ? colors.ink : colors.inkSubtle, fontSize: 13 }}>
                  {value ?? '— not detected'}
                </Text>
              </View>
            ))}
          </View>

          {/* Alerts */}
          {result.alerts.length > 0 && (
            <View style={{ padding: 12, backgroundColor: colors.parchment, gap: 6 }}>
              {result.alerts.map((a, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <Text style={{ color: ALERT_COLOR[a.type], fontSize: 13 }}>{ALERT_ICON[a.type]}</Text>
                  <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11, flex: 1 }}>{a.message}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
