import { StripeProvider } from '@stripe/stripe-react-native';

// Native variant — .web.tsx is the counterpart that skips StripeProvider
// entirely, since @stripe/stripe-react-native has no web build (see that
// file's comment for why this needs to be a platform-specific file rather
// than a runtime Platform.OS check: Metro resolves this import statically
// while building the web bundle, before any runtime code runs).
export function StripeRootWrapper({ children }: { children: React.ReactElement }) {
  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}>
      {children}
    </StripeProvider>
  );
}
