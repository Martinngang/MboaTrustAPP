// Web variant — deliberately does NOT import @stripe/stripe-react-native.
// That package's index re-exports CardField, whose native codegen spec
// imports "react-native/Libraries/Utilities/codegenNativeCommands" — Metro
// refuses to bundle that for web at all (build-time failure, not a runtime
// one), so the import itself must never appear in the web bundle's module
// graph. See StripeRootWrapper.tsx (the native counterpart) for what this
// replaces; card payments simply aren't available in the web preview.
export function StripeRootWrapper({ children }: { children: React.ReactElement }) {
  return children;
}
