import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { View, Text, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, TriangleAlert, X, Info, Circle } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import type { StatusTone } from '../theme/tokens';

// Ported from MboaTrustFrontend/src/components/Toast.tsx — same
// useToast().show({title, description, tone, duration}) call signature, so
// porting a web screen's toast calls over is a straight copy-paste. Mobile
// drops the hover-pause behavior (no mouse/hover concept on a touchscreen)
// and doesn't offer a tap-to-dismiss either, matching web's deliberate
// choice that a toast disappears on its own timer, nothing else.
export interface ToastOptions {
  title: string;
  description?: string;
  tone?: StatusTone;
  duration?: number;
}
interface ToastItem extends ToastOptions {
  id: string;
}

const DEFAULT_DURATION = 3200;
const ToastContext = createContext<{ show: (opts: ToastOptions) => void } | null>(null);

const TONE_ICON: Record<StatusTone, typeof Check> = {
  success: Check,
  warning: TriangleAlert,
  error: X,
  info: Info,
  neutral: Circle,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: string) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((opts: ToastOptions) => {
    const id = `t${counter.current++}`;
    setItems((list) => [{ id, tone: 'neutral', duration: DEFAULT_DURATION, ...opts }, ...list]);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Toaster items={items} onDismiss={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

function Toaster({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, alignItems: 'center', gap: 8, paddingHorizontal: 16, zIndex: 1000 }}
    >
      {items.map((t) => (
        <ToastRow key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

function ToastRow({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const { colors, statusTones } = useTheme();
  const tone = toast.tone ?? 'neutral';
  const { bg, text } = statusTones[tone];
  const ToneIcon = TONE_ICON[tone];
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? DEFAULT_DURATION);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.parchmentDark,
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
          <ToneIcon size={13} color={text} strokeWidth={2.25} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>{toast.title}</Text>
          {toast.description && (
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>{toast.description}</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
