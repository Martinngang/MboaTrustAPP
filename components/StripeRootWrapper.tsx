import { isRunningInExpoGo } from 'expo';

// Native variant — .web.tsx is the counterpart that skips StripeProvider
// entirely, since @stripe/stripe-react-native has no web build (see that
// file's comment for why this needs to be a platform-specific file rather
// than a runtime Platform.OS check: Metro resolves this import statically
// while building the web bundle, before any runtime code runs).
//
// EXPO GO: the SDK's spec module runs `TurboModuleRegistry.getEnforcing('StripeSdk')`
// at module scope, and `getEnforcing` throws the moment it's evaluated if the
// native module isn't registered — which it never is in Expo Go, since Stripe
// isn't part of the Expo SDK. Because this wrapper sits at the app root
// (App.tsx), a static import would take the whole app down at startup. The
// require is therefore resolved once here, guarded: Metro still bundles the
// module (the specifier is static), but it is only ever *evaluated* outside
// Expo Go. Real dev-client/production builds are completely unaffected.
const Stripe: typeof import('@stripe/stripe-react-native') | null = isRunningInExpoGo()
  ? null
  : require('@stripe/stripe-react-native');

export function StripeRootWrapper({ children }: { children: React.ReactElement }) {
  if (!Stripe) return children;
  return (
    <Stripe.StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}>
      {children}
    </Stripe.StripeProvider>
  );
}
