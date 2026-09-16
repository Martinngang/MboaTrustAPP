import { useEffect, useState } from 'react';
import { View, Text, Pressable, Switch, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import {
  Sun,
  Moon,
  Smartphone,
  Bell,
  Globe,
  CreditCard,
  Shield,
  Trash2,
  ArrowLeftRight,
  Fingerprint,
  Monitor,
  Download,
  ScrollText,
  FileText,
  LifeBuoy,
  Headset,
  ClipboardList,
  LogIn,
  Mail,
  DoorOpen,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { GroupedLinks } from '../components/GroupedLinks';
import { ProgressRing } from '../components/ProgressRing';
import { Avatar } from '../components/Avatar';
import { PillButton } from '../components/PillButton';
import { TextField } from '../components/TextField';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { useToast } from '../components/Toast';
import { useTheme, type ThemePreference } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import { useMyKycStatusQuery, type KycStatus } from '../api/kyc';
import { api, apiErrorMessage } from '../api/client';
import { linkEmailPasswordToCurrentUser } from '../api/firebaseAuth';
import { friendlyAuthError, isCredentialInUseError } from '../api/authErrors';
import {
  useUpdatePreferredLanguageMutation,
  useRevokeOtherSessionsMutation,
  useExportMyDataMutation,
} from '../api/session';
import { useSetDeviceTokenMutation, isPushAvailable, isPushFullySupported, requestPushToken, getPushPermissionStatus } from '../api/push';
import { useTranslation } from '../i18n/useTranslation';

const PUSH_ENABLED_STORAGE_KEY = 'mboatrust-push-enabled';

const THEME_OPTIONS: { value: ThemePreference; labelKey: 'settings.light' | 'settings.dark' | 'settings.system'; icon: typeof Sun }[] = [
  { value: 'light', labelKey: 'settings.light', icon: Sun },
  { value: 'dark', labelKey: 'settings.dark', icon: Moon },
  { value: 'system', labelKey: 'settings.system', icon: Smartphone },
];

const KYC_LABEL_KEY: Record<KycStatus, 'settings.kycUnverified' | 'settings.kycPending' | 'settings.kycVerified' | 'settings.kycRejected'> = {
  unverified: 'settings.kycUnverified',
  pending: 'settings.kycPending',
  verified: 'settings.kycVerified',
  rejected: 'settings.kycRejected',
};

const PROVIDER_META_KEY: Record<'google' | 'email' | 'phone', { labelKey: 'settings.google' | 'settings.emailPassword' | 'settings.phoneNumber'; icon: typeof LogIn }> = {
  google: { labelKey: 'settings.google', icon: LogIn },
  email: { labelKey: 'settings.emailPassword', icon: Mail },
  phone: { labelKey: 'settings.phoneNumber', icon: Smartphone },
};

export function SettingsScreen() {
  const { colors, preference, setPreference } = useTheme();
  const { logout, user, name, avatarUrl, setRoleSelectorOpen, language, setLanguage, refresh, setFeedbackSheetOpen } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { show: showToast } = useToast();
  const { t } = useTranslation();

  const { data: kycStatus = 'unverified' } = useMyKycStatusQuery();
  const [biometric, setBiometric] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [signingOutOthers, setSigningOutOthers] = useState(false);
  const updateLanguage = useUpdatePreferredLanguageMutation();
  const revokeOtherSessions = useRevokeOtherSessionsMutation();
  const exportData = useExportMyDataMutation();
  const setDeviceToken = useSetDeviceTokenMutation();
  const [notifOn, setNotifOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  // Reflects real OS permission state on load, same as web's
  // `Notification.permission === 'granted'` check — if the user revoked
  // permission from system settings since last opening the app, this
  // corrects the switch back to off rather than showing a stale "on".
  useEffect(() => {
    if (!isPushAvailable()) return;
    (async () => {
      const [stored, permission] = await Promise.all([AsyncStorage.getItem(PUSH_ENABLED_STORAGE_KEY), getPushPermissionStatus()]);
      setNotifOn(stored === 'true' && permission === 'granted');
    })();
  }, []);

  // Same honest score as web's SettingsScreen — a reflection of the two
  // things that actually protect this account, not a growth-hack meter.
  const securityScore = (kycStatus === 'verified' ? 60 : kycStatus === 'pending' ? 25 : 0) + (biometric ? 40 : 0);
  const scoreColor = securityScore >= 80 ? colors.forest : securityScore >= 40 ? colors.amber : colors.seal;

  const linkedProviders = new Set((user?.authProviders || []).map((p) => p.provider));

  // Account linking — real Google/email-password linking onto the
  // currently signed-in Firebase account, now that mobile has real Firebase
  // auth wired up (see api/firebaseAuth.ts's linkGoogleToCurrentUser/
  // linkEmailPasswordToCurrentUser). Mirrors web's SignInMethodsCard exactly:
  // best-effort sync to the backend's authProviders list right after linking
  // (middleware/auth.js also picks up the change on the next authenticated
  // request either way), then refresh() to pull the updated list back in.
  const [showGoogleLink, setShowGoogleLink] = useState(false);
  const [showEmailLinkForm, setShowEmailLinkForm] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linkPasswordSaving, setLinkPasswordSaving] = useState(false);
  const [linkError, setLinkError] = useState('');

  const syncAuthProvider = (provider: 'google' | 'email', providerId: string) => {
    api.post('/users/me/auth-providers', { provider, providerId }).catch(() => {});
  };

  const handleGoogleLinked = async (firebaseUser: { providerData: { providerId: string; uid: string }[] }) => {
    const googleData = firebaseUser.providerData.find((p) => p.providerId === 'google.com');
    if (googleData) syncAuthProvider('google', googleData.uid);
    setShowGoogleLink(false);
    await refresh();
    showToast({ title: t('settings.googleConnected'), description: t('settings.googleConnectedDesc'), tone: 'success' });
  };

  const handleGoogleLinkError = (message: string) => {
    showToast({ title: t('settings.googleConnectFailed'), description: message, tone: 'error' });
  };

  const submitEmailLink = async () => {
    setLinkError('');
    if (!/^\S+@\S+\.\S+$/.test(linkEmail)) {
      setLinkError(t('settings.enterValidEmail'));
      return;
    }
    if (linkPassword.length < 6) {
      setLinkError(t('settings.passwordMinLength'));
      return;
    }
    setLinkPasswordSaving(true);
    try {
      const firebaseUser = await linkEmailPasswordToCurrentUser(linkEmail, linkPassword);
      syncAuthProvider('email', firebaseUser.uid);
      setShowEmailLinkForm(false);
      setLinkEmail('');
      setLinkPassword('');
      await refresh();
      showToast({ title: t('settings.passwordSet'), description: t('settings.passwordSetDesc'), tone: 'success' });
    } catch (err) {
      setLinkError(isCredentialInUseError(err) ? t('settings.emailAlreadyLinked') : friendlyAuthError(err));
    } finally {
      setLinkPasswordSaving(false);
    }
  };

  const changeLanguage = async (l: 'en' | 'fr') => {
    setLanguage(l);
    try {
      await updateLanguage.mutateAsync(l);
    } catch {
      showToast({ title: 'Could not save language preference', description: 'Please try again.', tone: 'error' });
    }
  };

  const signOutOtherDevices = async () => {
    if (signingOutOthers) return;
    setSigningOutOthers(true);
    try {
      const { revoked } = await revokeOtherSessions.mutateAsync();
      showToast({
        title: revoked ? t('settings.everywhereElse') : t('settings.nothingToRevoke'),
        description: revoked ? t('settings.everyOtherDeviceMustSignIn') : t('settings.noOtherSession'),
        tone: revoked ? 'success' : 'info',
      });
    } catch (err) {
      showToast({ title: 'Could not sign out other devices', description: apiErrorMessage(err, 'Please try again'), tone: 'error' });
    } finally {
      setSigningOutOthers(false);
    }
  };

  // Mirrors web's togglePush: enable → request permission → register the
  // real device token; disable → local-only. The backend's device-token
  // route (POST /users/me/device-token, see userController.setDeviceToken)
  // only ever *sets* User.fcmDeviceToken — its validator requires a
  // non-empty string, and no other endpoint clears the field — so there is
  // no real "unregister" call to make on disable. Turning this off just
  // stops the app from re-registering; it does not (and honestly cannot,
  // given the current backend) revoke the token server-side.
  const togglePush = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      if (notifOn) {
        setNotifOn(false);
        await AsyncStorage.setItem(PUSH_ENABLED_STORAGE_KEY, 'false');
        return;
      }
      const token = await requestPushToken();
      if (!token) {
        showToast({
          title: 'Could not enable push notifications',
          description: 'Notification permission was denied or is unavailable on this device.',
          tone: 'error',
        });
        return;
      }
      await setDeviceToken.mutateAsync(token);
      setNotifOn(true);
      await AsyncStorage.setItem(PUSH_ENABLED_STORAGE_KEY, 'true');
    } catch (err) {
      showToast({ title: 'Could not update push notifications', description: apiErrorMessage(err, 'Please try again'), tone: 'error' });
    } finally {
      setPushBusy(false);
    }
  };

  const downloadData = async () => {
    setExporting(true);
    try {
      const data = await exportData.mutateAsync();
      await Share.share({
        title: `mboatrust-data-export-${new Date().toISOString().slice(0, 10)}.json`,
        message: JSON.stringify(data, null, 2),
      });
    } catch (err) {
      showToast({ title: 'Export failed', description: apiErrorMessage(err, 'Please try again'), tone: 'error' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen header={<Header title={t('settings.title')} back />}>
      <View style={{ padding: 16, gap: 24 }}>
        {/* Account snapshot — mirrors web's AccountSnapshot ring */}
        <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <ProgressRing value={securityScore} size={64} stroke={4} color={scoreColor} track={colors.parchmentDark}>
            <Avatar name={name} avatarUrl={avatarUrl} size={44} />
          </ProgressRing>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 15 }} numberOfLines={1}>
              {name || 'Mboa Trust User'}
            </Text>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
              {t('settings.securityScore')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.parchmentDark, overflow: 'hidden', maxWidth: 140 }}>
                <View style={{ height: '100%', width: `${securityScore}%`, backgroundColor: scoreColor, borderRadius: 3 }} />
              </View>
              <Text style={{ fontFamily: FONT.mono, color: colors.ink, fontSize: 10, fontWeight: '700' }}>{securityScore}%</Text>
            </View>
          </View>
        </Card>

        {/* General */}
        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>{t('settings.general')}</Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>{t('settings.generalDesc')}</Text>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              {t('settings.appearance')}
            </Text>
            <Card style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {THEME_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = preference === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setPreference(opt.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 12,
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: active ? colors.forest : colors.parchmentDark,
                        backgroundColor: active ? colors.forest + '15' : colors.surface,
                      }}
                    >
                      <Icon size={18} color={active ? colors.forest : colors.inkSubtle} />
                      <Text style={{ fontFamily: FONT.sansMedium, fontSize: 12, color: active ? colors.forest : colors.inkSubtle }}>{t(opt.labelKey)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </View>

          <GroupedLinks
            title={t('settings.account')}
            items={[
              {
                label: t('settings.language'),
                sub: language === 'en' ? t('language.english') : t('language.french'),
                icon: Globe,
                onPress: () => changeLanguage(language === 'en' ? 'fr' : 'en'),
                right: (
                  <Text style={{ fontFamily: FONT.mono, color: colors.forest, fontSize: 11, fontWeight: '700' }}>
                    {language.toUpperCase()} →
                  </Text>
                ),
              },
              { label: t('settings.mobileMoney'), sub: t('settings.mobileMoneySub'), icon: CreditCard, onPress: () => navigation.navigate('PayoutMethods') },
              { label: t('settings.switchRole'), sub: t('settings.switchRoleSub'), icon: ArrowLeftRight, onPress: () => setRoleSelectorOpen(true) },
            ]}
          />

          {/* Sign-in methods — real status from the account's own
              authProviders (see BackendUser.authProviders), with real
              Google/email account-linking actions now that mobile has real
              Firebase auth wired up (see api/firebaseAuth.ts). Mirrors web's
              SignInMethodsCard: a "Link" action for Google (expo-auth-session
              instead of web's DOM popup) and a "Set password" action for
              email that reveals an inline form — no action for phone on
              either platform, matching web. */}
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {t('settings.signInMethods')}
              </Text>
              <Text
                style={{
                  fontFamily: FONT.mono,
                  color: linkedProviders.size >= 2 ? colors.forest : colors.amber,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {linkedProviders.size} {t('settings.linkedOfThree')}
              </Text>
            </View>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {(['google', 'email', 'phone'] as const).map((key, i, arr) => {
                const meta = PROVIDER_META_KEY[key];
                const Icon = meta.icon;
                const isLinked = linkedProviders.has(key);
                return (
                  <View
                    key={key}
                    style={{
                      borderBottomWidth: i < arr.length - 1 && !(key === 'google' && showGoogleLink) && !(key === 'email' && showEmailLinkForm) ? 1 : 0,
                      borderBottomColor: colors.parchmentDark,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={16} color={colors.forest} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONT.sansMedium, color: colors.ink, fontSize: 13 }}>{t(meta.labelKey)}</Text>
                        <Text style={{ fontFamily: FONT.mono, color: isLinked ? colors.forest : colors.inkSubtle, fontSize: 10, marginTop: 2, textTransform: 'uppercase' }}>
                          {isLinked ? t('settings.connected') : t('settings.notConnected')}
                        </Text>
                      </View>
                      {!isLinked && key === 'google' && (
                        <Pressable onPress={() => setShowGoogleLink((v) => !v)} accessibilityRole="button">
                          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>{t('settings.link')}</Text>
                        </Pressable>
                      )}
                      {!isLinked && key === 'email' && (
                        <Pressable onPress={() => setShowEmailLinkForm((v) => !v)} accessibilityRole="button">
                          <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.forest, fontSize: 12 }}>{t('settings.setPassword')}</Text>
                        </Pressable>
                      )}
                    </View>

                    {key === 'google' && showGoogleLink && (
                      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                        <GoogleAuthButton mode="link" onLinked={handleGoogleLinked} onError={handleGoogleLinkError} />
                      </View>
                    )}

                    {key === 'email' && showEmailLinkForm && (
                      <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
                        {linkError ? (
                          <Text style={{ fontFamily: FONT.sans, color: colors.seal, fontSize: 12 }}>{linkError}</Text>
                        ) : null}
                        <TextField
                          label={t('settings.emailLabel')}
                          value={linkEmail}
                          onChangeText={setLinkEmail}
                          placeholder="you@example.com"
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                        <TextField
                          label={t('settings.newPasswordLabel')}
                          value={linkPassword}
                          onChangeText={setLinkPassword}
                          placeholder={t('settings.atLeast6Chars')}
                          secureTextEntry
                          autoCapitalize="none"
                        />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <Pressable
                            onPress={() => { setShowEmailLinkForm(false); setLinkError(''); }}
                            style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.parchmentDark, alignItems: 'center' }}
                          >
                            <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.inkMuted, fontSize: 13 }}>{t('common.cancel')}</Text>
                          </Pressable>
                          <Pressable
                            onPress={submitEmailLink}
                            disabled={linkPasswordSaving}
                            style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.forest, alignItems: 'center', opacity: linkPasswordSaving ? 0.6 : 1 }}
                          >
                            <Text style={{ fontFamily: FONT.sansSemiBold, color: '#fff', fontSize: 13 }}>
                              {linkPasswordSaving ? t('settings.saving') : t('settings.save')}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </Card>
          </View>
        </View>

        {/* Security & access */}
        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>{t('settings.securityAccess')}</Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
              {t('settings.securityAccessDesc')}
            </Text>
          </View>

          <GroupedLinks
            title={t('settings.security')}
            items={[
              { label: t('settings.changePin'), sub: t('settings.changePinSub'), icon: Shield, onPress: () => {} },
              {
                label: t('settings.biometricLogin'),
                sub: t('settings.biometricLoginSub'),
                icon: Fingerprint,
                onPress: () => setBiometric((v) => !v),
                right: <Switch value={biometric} onValueChange={setBiometric} trackColor={{ true: colors.forest }} />,
              },
              { label: t('settings.kyc'), sub: `${t('settings.kycStatus')}: ${t(KYC_LABEL_KEY[kycStatus])}`, icon: Shield, onPress: () => navigation.navigate('Kyc') },
            ]}
          />

          {/* Sessions — the one real device-security action available: this
              platform keeps no per-device session log to enumerate (see
              userController.revokeSessions), matching web's own
              TrustedDevicesCard comment. */}
          <GroupedLinks
            title={t('settings.sessions')}
            items={[
              {
                label: t('settings.signOutOtherDevices'),
                sub: t('settings.signOutOtherDevicesSub'),
                icon: Monitor,
                onPress: signOutOtherDevices,
                right: signingOutOthers ? (
                  <Text style={{ fontFamily: FONT.mono, color: colors.seal, fontSize: 11 }}>…</Text>
                ) : (
                  <Text style={{ fontFamily: FONT.sansSemiBold, color: colors.seal, fontSize: 12 }}>{t('settings.signOut')}</Text>
                ),
              },
            ]}
          />
        </View>

        {/* Notifications & privacy */}
        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>{t('settings.notificationsPrivacy')}</Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>
              {t('settings.notificationsPrivacyDesc')}
            </Text>
          </View>

          <GroupedLinks
            title={t('settings.notifications')}
            items={[
              isPushAvailable()
                ? {
                    label: t('settings.pushNotifications'),
                    sub: pushBusy
                      ? t('settings.updating')
                      : notifOn
                        ? isPushFullySupported()
                          ? t('settings.pushMilestoneUpdates')
                          : t('settings.pushAndroidOnly')
                        : t('settings.pushOff'),
                    icon: Bell,
                    onPress: togglePush,
                    right: <Switch value={notifOn} onValueChange={togglePush} disabled={pushBusy} trackColor={{ true: colors.forest }} />,
                  }
                : {
                    label: t('settings.pushNotifications'),
                    sub: t('settings.pushNotSupported'),
                    icon: Bell,
                    onPress: () => {},
                  },
              { label: t('settings.notificationPreferences'), sub: t('settings.notificationPreferencesSub'), icon: Bell, onPress: () => navigation.navigate('NotificationPreferences') },
            ]}
          />

          <GroupedLinks
            title={t('settings.privacy')}
            items={[
              {
                label: t('settings.downloadData'),
                sub: exporting ? t('settings.preparingExport') : t('settings.downloadDataSub'),
                icon: Download,
                onPress: downloadData,
              },
              { label: t('settings.privacyPolicy'), icon: ScrollText, onPress: () => {} },
              { label: t('settings.termsOfService'), icon: FileText, onPress: () => {} },
            ]}
          />
        </View>

        {/* Support */}
        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 16 }}>{t('settings.support')}</Text>
            <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>{t('settings.supportDesc')}</Text>
          </View>

          <GroupedLinks
            title={t('settings.support')}
            items={[
              { label: t('support.helpCenter'), sub: t('support.helpCenterSub'), icon: LifeBuoy, onPress: () => navigation.navigate('HelpCenter') },
              { label: t('support.myRequests'), sub: t('support.myRequestsSub'), icon: ClipboardList, onPress: () => navigation.navigate('MySupportRequests') },
              { label: t('settings.howItWorks'), sub: t('settings.howItWorksSub'), icon: Monitor, onPress: () => navigation.navigate('Help') },
              {
                label: t('settings.contactSupport'),
                sub: t('settings.contactSupportSub'),
                icon: Headset,
                onPress: () => setFeedbackSheetOpen(true, { type: 'contact_support', screen: 'Settings', screenLabel: 'Settings' }),
              },
            ]}
          />
        </View>

        {/* Danger zone — structurally separate, never one accidental tap
            away from "dark mode". */}
        <GroupedLinks
          title={t('settings.dangerZone')}
          tone="danger"
          items={[
            { label: t('settings.signOut'), sub: t('settings.signOutSub'), icon: DoorOpen, onPress: logout },
            { label: t('settings.deleteAccount'), sub: t('settings.deleteAccountSub'), icon: Trash2, onPress: () => navigation.navigate('DeleteAccount') },
          ]}
        />

        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10 }}>
            {t('settings.footer')}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
