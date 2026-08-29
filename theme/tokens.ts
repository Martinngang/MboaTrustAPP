// Mirrors MboaTrustFrontend/src/index.css's :root / [data-theme="dark"] custom
// properties exactly (same hex values) and MboaTrustFrontend/src/components/tokens.ts's
// C/FONT naming, so screens ported from web keep the same design identity instead of
// drifting into a generic RN look. React Native has no CSS custom properties, so this
// resolves to a flat light/dark object pair picked by ThemeProvider (see theme/ThemeProvider.tsx).

export interface ThemeColors {
  forest: string;
  forestLight: string;
  forestDark: string;
  amber: string;
  amberLight: string;
  parchment: string;
  parchmentDark: string;
  ink: string;
  inkMuted: string;
  inkSubtle: string;
  cream: string;
  seal: string;
  surface: string;
  steel: string;
  moss: string;
  border: string;
}

export const lightColors: ThemeColors = {
  forest: '#0F7A52',
  forestLight: '#17A36C',
  forestDark: '#0A5B3D',
  amber: '#C9971E',
  amberLight: '#E0B84D',
  parchment: '#F7F5F1',
  parchmentDark: '#EAE7E0',
  ink: '#14171B',
  inkMuted: '#565B62',
  inkSubtle: '#6E737C',
  cream: '#FCFBF9',
  seal: '#B23A2E',
  surface: '#FFFFFF',
  steel: '#1E3A5F',
  moss: '#2D4A2D',
  border: '#EAE7E0',
};

export const darkColors: ThemeColors = {
  forest: '#0E8C5C',
  forestLight: '#17A369',
  forestDark: '#084A31',
  amber: '#D4AF37',
  amberLight: '#E8CC72',
  parchment: '#16171B',
  parchmentDark: '#202227',
  ink: '#EDEBE6',
  inkMuted: '#9C9FA6',
  inkSubtle: '#8B8E95',
  cream: '#0A0A0D',
  seal: '#C94430',
  surface: '#1B1C21',
  steel: '#3F6EA8',
  moss: '#4A7A4A',
  border: '#202227',
};

export interface StatusToneColors {
  success: { bg: string; text: string };
  warning: { bg: string; text: string };
  error: { bg: string; text: string };
  info: { bg: string; text: string };
  neutral: { bg: string; text: string };
}

export const statusTonesLight: StatusToneColors = {
  success: { bg: '#D1FAE5', text: '#065F46' },
  warning: { bg: '#FEF3C7', text: '#92400E' },
  error: { bg: '#FEE2E2', text: '#991B1B' },
  info: { bg: '#E0F2FE', text: '#0369A1' },
  neutral: { bg: '#F3F4F6', text: '#6B7280' },
};

export const statusTonesDark: StatusToneColors = {
  success: { bg: 'rgba(52,168,115,0.16)', text: '#57D69A' },
  warning: { bg: 'rgba(201,162,39,0.16)', text: '#E7C766' },
  error: { bg: 'rgba(227,90,59,0.16)', text: '#F08A6F' },
  info: { bg: 'rgba(63,110,168,0.18)', text: '#8FB4E3' },
  neutral: { bg: 'rgba(243,239,230,0.08)', text: '#A9A79C' },
};

export type StatusTone = keyof typeof statusTonesLight;

// Font family names as registered by useFonts() in App.tsx (see theme/useAppFonts.ts).
export const FONT = {
  serif: 'Fraunces_600SemiBold',
  serifBold: 'Fraunces_700Bold',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
} as const;

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32 } as const;
export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, full: 999 } as const;
