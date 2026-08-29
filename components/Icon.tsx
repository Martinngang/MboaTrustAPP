import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';

// Thin wrapper over lucide-react-native — the same icon set as web's
// lucide-react (1:1 name parity, see docs/WEB_APP_MAP.md), so a screen ported
// from web keeps its exact iconography. Exists only to default size/color
// from the active theme instead of every call site repeating `useTheme()`
// just to color an icon `ink` — pass `icon` from lucide-react-native directly
// wherever a specific semantic color (status tones, role accents) is needed instead.
export function Icon({
  icon: LucideIconComponent,
  size = 20,
  color,
  strokeWidth,
}: {
  icon: LucideIcon;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const { colors } = useTheme();
  return <LucideIconComponent size={size} color={color ?? colors.ink} strokeWidth={strokeWidth} />;
}
