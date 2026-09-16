import { forwardRef } from 'react';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { firebaseWebConfig } from '../config/firebase';

// Firebase's phone auth needs an ApplicationVerifier — web supplies one via
// an invisible reCAPTCHA bound to a real DOM node (see
// MboaTrustFrontend/src/api/firebaseAuth.ts's ensureRecaptcha). RN has no DOM,
// so this renders the equivalent challenge in a WebView-backed modal instead;
// its ref is itself a valid ApplicationVerifier, passed straight to
// startPhoneSignIn. Must be mounted (even if invisible) on any screen that
// calls startPhoneSignIn.
//
// BUILD NOTE: expo-firebase-recaptcha was removed from the Expo SDK back in
// 48 and still pulls in expo-firebase-core, whose android/build.gradle is old
// enough to break any modern Gradle (it sets the `classifier` property that
// Gradle 8 removed, and declares no compileSdk). Autolinking it fails the
// Android build outright. It is therefore excluded in package.json under
// "expo.autolinking.exclude" — do not remove that entry without replacing
// this component.
//
// Excluding it is safe because only the NATIVE module is dropped: the two
// values expo-firebase-core exposes off it (DEFAULT_APP_NAME,
// DEFAULT_APP_OPTIONS) are read through NativeModulesProxy, which yields
// undefined rather than throwing, and nothing here reads them. The one value
// this library does use, DEFAULT_WEB_APP_OPTIONS, is pure JS off
// expo-constants — and it is only a defaultProp for firebaseConfig, which we
// pass explicitly below anyway.
export const PhoneRecaptchaModal = forwardRef<FirebaseRecaptchaVerifierModal>((_props, ref) => (
  <FirebaseRecaptchaVerifierModal ref={ref} firebaseConfig={firebaseWebConfig} attemptInvisibleVerification />
));
