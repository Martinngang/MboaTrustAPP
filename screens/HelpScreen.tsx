import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Lock, Camera, CheckCircle2, HardHat, Home as HomeIcon } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { PillButton } from '../components/PillButton';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translations';

// Ported 1:1 from MboaTrustFrontend/src/screens/SharedScreens.tsx's
// HelpScreen — same 5-slide "how it works" walkthrough content, same
// per-slide accent color, reachable from every role's Support menu.
export function HelpScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [slide, setSlide] = useState(0);

  const SLIDES: { icon: typeof Lock; titleKey: TranslationKey; bodyKey: TranslationKey; color: string }[] = [
    {
      icon: Lock,
      titleKey: 'help.slide1Title',
      bodyKey: 'help.slide1Body',
      color: colors.forest,
    },
    {
      icon: Camera,
      titleKey: 'help.slide2Title',
      bodyKey: 'help.slide2Body',
      color: colors.steel,
    },
    {
      icon: CheckCircle2,
      titleKey: 'help.slide3Title',
      bodyKey: 'help.slide3Body',
      color: colors.moss,
    },
    {
      icon: HardHat,
      titleKey: 'help.slide4Title',
      bodyKey: 'help.slide4Body',
      color: colors.forestDark,
    },
    {
      icon: HomeIcon,
      titleKey: 'help.slide5Title',
      bodyKey: 'help.slide5Body',
      color: colors.amber,
    },
  ];

  const s = SLIDES[slide];
  const Icon = s.icon;
  const isLast = slide === SLIDES.length - 1;

  const goHome = () => navigation.navigate('MainTabs');

  return (
    <Screen
      header={
        <Header
          title={t('help.title')}
          back
          action={
            <Pressable onPress={goHome} accessibilityRole="button">
              <Text style={{ fontFamily: FONT.sans, color: colors.inkSubtle, fontSize: 12 }}>{t('common.skip')}</Text>
            </Pressable>
          }
        />
      }
    >
      <View style={{ flex: 1, backgroundColor: s.color }}>
        {/* Progress ticks */}
        <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 20, paddingTop: 14 }}>
          {SLIDES.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
              <View style={{ height: '100%', width: i <= slide ? '100%' : '0%', backgroundColor: colors.amber, borderRadius: 2 }} />
            </View>
          ))}
        </View>

        <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 32, justifyContent: 'center' }}>
          <Text style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.55)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center', marginBottom: 24 }}>
            {t('help.stepOf')} {slide + 1} {t('help.of')} {SLIDES.length}
          </Text>

          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ width: 80, height: 80, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={40} color="#fff" strokeWidth={1.5} />
            </View>
          </View>

          <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 22, textAlign: 'center', marginBottom: 14, lineHeight: 28 }}>
            {t(s.titleKey)}
          </Text>
          <Text style={{ fontFamily: FONT.sans, color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
            {t(s.bodyKey)}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 36 }}>
            {SLIDES.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => setSlide(i)}
                accessibilityRole="button"
                style={{
                  width: i === slide ? 18 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === slide ? colors.amber : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 18, backgroundColor: 'rgba(0,0,0,0.15)' }}>
          {slide > 0 ? (
            <View style={{ flex: 1 }}>
              <PillButton variant="secondary" onPress={() => setSlide((n) => n - 1)} fullWidth>
                {t('common.previous')}
              </PillButton>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <View style={{ flex: 1 }}>
            <PillButton variant="primary" onPress={() => (isLast ? goHome() : setSlide((n) => n + 1))} fullWidth>
              {isLast ? t('help.imReady') : t('common.next')}
            </PillButton>
          </View>
        </View>
      </View>
    </Screen>
  );
}
