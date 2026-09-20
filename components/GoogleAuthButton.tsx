import { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import type { User } from 'firebase/auth';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { signInWithGoogleIdToken, linkGoogleToCurrentUser, firebaseConfigured } from '../api/firebaseAuth';
import { friendlyAuthError } from '../api/authErrors';
import { useTranslation } from '../i18n/useTranslation';

WebBrowser.maybeCompleteAuthSession();

// Mirrors MboaTrustFrontend/src/screens/Onboarding.tsx's GoogleAuthSection —
// same "sign in with Google, then the shared auth-state listener routes you"
// behavior, but via expo-auth-session's native OAuth flow (a browser tab +
// redirect back into the app) instead of web's DOM popup, since RN has no
// popup window. Needs platform OAuth client IDs registered in Google Cloud
// Console (see .env.example) — renders nothing if they aren't configured,
// same "don't show a button that can't work" rule the email-only cutover
// followed before this.
export function GoogleAuthButton({
  onError,
  mode = 'signin',
  onLinked,
}: {
  onError: (message: string) => void;
  /** 'link' adds Google to the currently signed-in account (Settings'
   * sign-in-methods card) instead of signing in as a new/existing user —
   * same expo-auth-session ID-token flow either way, just a different
   * Firebase call at the end. */
  mode?: 'signin' | 'link';
  onLinked?: (user: User) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const configured = Boolean(
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  );
  // useIdTokenAuthRequest resolves its clientId via Platform.select and throws
  // synchronously (invariantClientId in expo-auth-session) if the one for the
  // current platform is empty — before this component's own
  // `if (!configured) return null` guard below ever runs, since hooks can't be
  // called conditionally. Without Google credentials configured at all (the
  // common case pre-launch), that crashes every screen rendering this button,
  // via the nearest ErrorBoundary.
  //
  // All three need the placeholder, not just web: this was originally patched
  // for webClientId alone, which left Android throwing
  // "Client Id property `androidClientId` must be defined" the first time the
  // app ran on a real device (it had only ever been exercised in the web
  // preview until then). The placeholders are never reachable — `configured`
  // above still gates the actual button/promptAsync() to real credentials only.
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'unconfigured',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'unconfigured',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'unconfigured',
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params?.id_token;
    if (!idToken) return;
    if (mode === 'link') {
      linkGoogleToCurrentUser(idToken).then((user) => onLinked?.(user)).catch((err) => onError(friendlyAuthError(err)));
    } else {
      signInWithGoogleIdToken(idToken).catch((err) => onError(friendlyAuthError(err)));
    }
    // No explicit navigation here either — same shared auth-state listener
    // that routes email sign-in also routes this. eslint-disable-next-line
    // react-hooks/exhaustive-deps
  }, [response]);

  if (!firebaseConfigured || !configured) return null;

  return (
    <View style={{ gap: 14 }}>
      <Pressable
        onPress={() => promptAsync()}
        disabled={!request}
        accessibilityRole="button"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          paddingVertical: 13,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.parchmentDark,
          backgroundColor: colors.surface,
          opacity: request ? 1 : 0.6,
        }}
      >
        {request ? (
          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.ink, fontSize: 14 }}>
            {mode === 'link' ? t('settings.linkGoogleButton') : t('auth.continueWithGoogle')}
          </Text>
        ) : (
          <ActivityIndicator color={colors.ink} size="small" />
        )}
      </Pressable>

      {mode === 'signin' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.parchmentDark }} />
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase' }}>{t('auth.or')}</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.parchmentDark }} />
        </View>
      )}
    </View>
  );
}
