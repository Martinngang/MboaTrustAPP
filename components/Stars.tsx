import { View } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';

// Ported from MboaTrustFrontend/src/components/MobileLayout.tsx's Stars —
// same 5-star row, filled up to the rounded rating.
export function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  const { colors } = useTheme();
  const rounded = Math.round(rating);
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} color={colors.amber} fill={i <= rounded ? colors.amber : 'transparent'} />
      ))}
    </View>
  );
}
