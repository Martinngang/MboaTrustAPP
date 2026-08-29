import { useFonts as useFraunces, Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { useFonts as useInter, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts as useJetBrainsMono, JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';

// Same three-family pairing as the web app's FONT tokens (Fraunces/Inter/JetBrains
// Mono) — see MboaTrustFrontend/src/components/tokens.ts. Split into three useFonts
// calls (each package ships its own hook) and combined into one "ready" flag so
// App.tsx can hold the splash screen until every family is actually available —
// rendering with a fallback system font first and swapping mid-render is the kind
// of flash-of-unstyled-text this avoids.
export function useAppFonts() {
  const [frauncesLoaded] = useFraunces({ Fraunces_600SemiBold, Fraunces_700Bold });
  const [interLoaded] = useInter({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const [monoLoaded] = useJetBrainsMono({ JetBrainsMono_400Regular });
  return frauncesLoaded && interLoaded && monoLoaded;
}
