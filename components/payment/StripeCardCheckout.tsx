import { Text } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { FONT } from '../../theme/tokens';

// Native variant — .web.tsx is the counterpart with no @stripe/stripe-react-native
// import at all, since that package's index re-exports CardField, whose native
// codegen spec fails Metro's web bundling outright (see StripeCardCheckout.web.tsx).
// Kept as its own small module (rather than importing the SDK straight into
// FundProjectScreen) so only this file needs a platform split, not the whole screen.
//
// EXPO GO: the SDK's spec module calls `TurboModuleRegistry.getEnforcing('StripeSdk')`
// at module scope, which throws when the native module isn't registered — and it
// never is in Expo Go. RootNavigator imports its screens statically, so FundProjectScreen
// (and therefore this file) is evaluated during startup: a static import here would
// crash the app on launch, not just on the payment screen. Resolved once, guarded,
// same as StripeRootWrapper.tsx.
const Stripe: typeof import('@stripe/stripe-react-native') | null = isRunningInExpoGo()
  ? null
  : require('@stripe/stripe-react-native');

export interface StripeCardDetails {
  complete: boolean;
}

export interface StripeConfirmResult {
  error?: { message: string };
  succeeded: boolean;
}

const EXPO_GO_MESSAGE = 'Card payments need the development build — Expo Go cannot load Stripe’s native SDK.';

// The two implementations are chosen once, at module load, rather than branching
// inside a single hook — `Stripe` is a module-scope constant, so the exported
// identity is fixed for the whole app run and React never sees a hook appear or
// disappear between renders.
function useStripeCardConfirmNative() {
  const { confirmPayment } = Stripe!.useStripe();
  return async (clientSecret: string): Promise<StripeConfirmResult> => {
    const { error, paymentIntent } = await confirmPayment(clientSecret, { paymentMethodType: 'Card' });
    if (error) return { error: { message: error.message }, succeeded: false };
    return { succeeded: !!paymentIntent };
  };
}

function useStripeCardConfirmUnavailable() {
  return async (): Promise<StripeConfirmResult> => ({
    error: { message: EXPO_GO_MESSAGE },
    succeeded: false,
  });
}

export const useStripeCardConfirm = Stripe ? useStripeCardConfirmNative : useStripeCardConfirmUnavailable;

export function StripeCardField({
  backgroundColor,
  textColor,
  borderColor,
  placeholderColor,
  onChange,
}: {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  placeholderColor: string;
  onChange: (details: StripeCardDetails) => void;
}) {
  if (!Stripe) {
    return (
      <Text style={{ fontFamily: FONT.sans, color: placeholderColor, fontSize: 12 }}>
        {EXPO_GO_MESSAGE}
      </Text>
    );
  }
  return (
    <Stripe.CardField
      postalCodeEnabled={false}
      placeholders={{ number: '4242 4242 4242 4242' }}
      cardStyle={{ backgroundColor, textColor, borderRadius: 12, borderWidth: 1, borderColor, placeholderColor }}
      style={{ height: 50 }}
      onCardChange={(details) => onChange({ complete: details.complete })}
    />
  );
}
