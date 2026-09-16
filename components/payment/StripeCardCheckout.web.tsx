import { Text } from 'react-native';
import { FONT } from '../../theme/tokens';

// Web variant — deliberately does NOT import @stripe/stripe-react-native.
// See StripeCardCheckout.tsx (the native counterpart) for why: that
// package's index re-exports CardField, whose native codegen spec imports
// "react-native/Libraries/Utilities/codegenNativeCommands", which Metro
// refuses to bundle for web at all. Card payments aren't available in the
// web preview; this stub keeps FundProjectScreen's import resolvable there.

export interface StripeCardDetails {
  complete: boolean;
}

export interface StripeConfirmResult {
  error?: { message: string };
  succeeded: boolean;
}

export function useStripeCardConfirm() {
  return async (): Promise<StripeConfirmResult> => ({
    error: { message: 'Stripe card checkout requires the native app build, not this web preview.' },
    succeeded: false,
  });
}

export function StripeCardField({ placeholderColor }: { backgroundColor: string; textColor: string; borderColor: string; placeholderColor: string; onChange: (details: StripeCardDetails) => void }) {
  return (
    <Text style={{ fontFamily: FONT.sans, color: placeholderColor, fontSize: 12 }}>
      Card entry uses Stripe's native SDK and isn't available in this web preview — open this screen in the mobile app to enter card details.
    </Text>
  );
}
