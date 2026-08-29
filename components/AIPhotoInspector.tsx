import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Camera,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { inspectConstructionPhoto, type AIPhotoInspectionResult } from '../api/geminiAI';

interface Props {
  onPhotoSelected?: (base64: string, mimeType: string) => void;
  onAnalysisComplete?: (result: AIPhotoInspectionResult) => void;
  label?: string;
}

const VERDICT_CONFIG = {
  pass: { Icon: ShieldCheck, color: '#1a7a4a', bg: '#d4f4e6', label: 'AI Inspection Passed' },
  flag: { Icon: AlertTriangle, color: '#b45309', bg: '#fef3c7', label: 'Flagged — Manual Review' },
  fail: { Icon: XCircle, color: '#b91c1c', bg: '#fee2e2', label: 'AI Inspection Failed' },
};

const SEVERITY_COLOR = {
  ok: '#6b7280',
  warning: '#b45309',
  critical: '#b91c1c',
};

export function AIPhotoInspector({ onPhotoSelected, onAnalysisComplete, label = 'Upload Site Photo' }: Props) {
  const { colors } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [result, setResult] = useState<AIPhotoInspectionResult | null>(null);

  const pickPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll access is needed to upload site photos.');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      base64: true,
      exif: true,
    });

    if (picked.canceled || !picked.assets?.[0]) return;

    const asset = picked.assets[0];
    setImageUri(asset.uri);
    setResult(null);

    const base64 = asset.base64 ?? '';
    const mimeType = asset.mimeType ?? 'image/jpeg';
    onPhotoSelected?.(base64, mimeType);

    if (!base64) return;
    setAnalysing(true);
    try {
      const analysis = await inspectConstructionPhoto(base64, mimeType);
      setResult(analysis);
      onAnalysisComplete?.(analysis);
    } catch {
      Alert.alert('AI Analysis Failed', 'Could not reach the AI service. The photo was still saved.');
    } finally {
      setAnalysing(false);
    }
  }, [onPhotoSelected, onAnalysisComplete]);

  const verdict = result ? VERDICT_CONFIG[result.verdict] : null;

  return (
    <View style={{ gap: 12 }}>
      {/* Upload / Preview zone */}
      <Pressable
        onPress={pickPhoto}
        style={{
          borderRadius: 14,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: imageUri ? colors.forest : colors.parchmentDark,
          overflow: 'hidden',
          backgroundColor: imageUri ? 'transparent' : colors.parchment,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: imageUri ? 200 : 120,
        }}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: '100%', height: 200, resizeMode: 'cover' }} />
        ) : (
          <View style={{ alignItems: 'center', gap: 8, padding: 24 }}>
            <Camera size={32} color={colors.inkMuted} />
            <Text style={{ fontFamily: FONT.sansMedium, color: colors.inkMuted, fontSize: 14 }}>{label}</Text>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Tap to pick from camera roll
            </Text>
          </View>
        )}
      </Pressable>

      {/* AI Analysing Indicator */}
      {analysing && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: colors.forest + '15' }}>
          <ActivityIndicator size="small" color={colors.forest} />
          <View>
            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 13 }}>Gemini AI Inspecting…</Text>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>Analysing concrete, rebar, fraud indicators</Text>
          </View>
        </View>
      )}

      {/* AI Result */}
      {result && verdict && (
        <View style={{ borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: verdict.color + '33' }}>
          {/* Verdict banner */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, backgroundColor: verdict.bg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <verdict.Icon size={16} color={verdict.color} />
              <Text style={{ fontFamily: FONT.sansSemiBold, color: verdict.color, fontSize: 13 }}>{verdict.label}</Text>
            </View>
            {/* Score circle */}
            <View style={{
              width: 38, height: 38, borderRadius: 19,
              borderWidth: 2.5, borderColor: verdict.color,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontFamily: FONT.serifBold, color: verdict.color, fontSize: 13 }}>{result.score}</Text>
            </View>
          </View>

          {/* Summary */}
          <View style={{ padding: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.parchmentDark }}>
            <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 13 }}>{result.summary}</Text>
          </View>

          {/* Findings */}
          {result.findings.length > 0 && (
            <View style={{ padding: 12, backgroundColor: colors.parchment, gap: 8 }}>
              {result.findings.map((f, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                  <Text style={{ fontSize: 13, color: SEVERITY_COLOR[f.severity] }}>
                    {f.severity === 'ok' ? '✓' : f.severity === 'warning' ? '⚠' : '✕'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.sansSemiBold, color: SEVERITY_COLOR[f.severity], fontSize: 12 }}>{f.label}</Text>
                    <Text style={{ fontFamily: FONT.sans, color: colors.inkMuted, fontSize: 11 }}>{f.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Fraud flags */}
          {result.fraudFlags.length > 0 && (
            <View style={{ padding: 10, backgroundColor: '#fee2e2' }}>
              <Text style={{ fontFamily: FONT.sansSemiBold, color: '#b91c1c', fontSize: 12, marginBottom: 4 }}>🚨 Fraud Indicators Detected</Text>
              {result.fraudFlags.map((f, i) => (
                <Text key={i} style={{ fontFamily: FONT.sans, color: '#b91c1c', fontSize: 11 }}>• {f}</Text>
              ))}
            </View>
          )}

          {/* GPS Note */}
          {result.gpsNote && (
            <View style={{ padding: 8, backgroundColor: colors.parchmentDark }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkMuted, fontSize: 10 }}>📍 {result.gpsNote}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
