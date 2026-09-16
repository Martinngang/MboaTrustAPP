import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

// Ported from MboaTrustFrontend/src/screens/SharedScreens.tsx's ProgressRing —
// same restrained single-stroke circular progress (no gradient/glow), used
// for the Menu screen's trust-score ring around the avatar.
export function ProgressRing({
  value,
  size = 56,
  stroke = 4,
  color,
  track,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color: string;
  track: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, value)) / 100) * c;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
        />
      </Svg>
      {children}
    </View>
  );
}
