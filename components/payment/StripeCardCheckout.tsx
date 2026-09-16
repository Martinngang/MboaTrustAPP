import { CardField, useStripe } from '@stripe/stripe-react-native';

// Native variant — .web.tsx is the counterpart with no @stripe/stripe-react-native
// import at all, since that package's index re-exports CardField, whose native
// codegen spec fails Metro's web bundling outright (see StripeCardCheckout.web.tsx).
// Kept as its own small module (rather than importing the SDK straight into
// FundProjectScreen) so only this file needs a platform split, not the whole screen.

export interface StripeCardDetails {
  complete: boolean;
}

export interface StripeConfirmResult {
  error?: { message: string };
  succeeded: boolean;
}

export function useStripeCardConfirm() {
  const { confirmPayment } = useStripe();
  return async (clientSecret: string): Promise<StripeConfirmResult> => {
    const { error, paymentIntent } = await confirmPayment(clientSecret, { paymentMethodType: 'Card' });
    if (error) return { error: { message: error.message }, succeeded: false };
    return { succeeded: !!paymentIntent };
  };
}

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
  return (
    <CardField
      postalCodeEnabled={false}
      placeholders={{ number: '4242 4242 4242 4242' }}
      cardStyle={{ backgroundColor, textColor, borderRadius: 12, borderWidth: 1, borderColor, placeholderColor }}
      style={{ height: 50 }}
      onCardChange={(details) => onChange({ complete: details.complete })}
    />
  );
}
