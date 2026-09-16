import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, Animated, Easing } from 'react-native';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Film } from 'lucide-react-native';
import { Avatar } from '../Avatar';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';

type CallStatus = 'ringing' | 'connected' | 'ended';

function fmtTimer(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
}

function EqualizerBar({ active, delay }: { active: boolean; delay: number }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!active) {
      anim.setValue(0.3);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 380, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0.25, duration: 380, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, delay]);

  return (
    <Animated.View
      style={{
        width: 6,
        borderRadius: 3,
        backgroundColor: '#0F7A52',
        height: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 44] }),
      }}
    />
  );
}

// Ported from MboaTrustFrontend/src/screens/MessagingScreens.tsx's CallModal —
// there is no real WebRTC signaling on either side of this app, so web's
// version is already a theatrical ringing→connected→ended simulation with
// mute/camera toggles and a fake equalizer. This mirrors that exact UX so a
// contractor tapping the phone/video icons gets the same experience on
// mobile that they already get on web, using RN's Modal + Animated instead
// of framer-motion.
export function CallModal({
  visible,
  name,
  avatarUrl,
  isGroup,
  mode,
  onClose,
}: {
  visible: boolean;
  name: string;
  avatarUrl?: string;
  isGroup?: boolean;
  mode: 'audio' | 'video';
  onClose: () => void;
}) {
  const [status, setStatus] = useState<CallStatus>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(mode === 'audio');
  const [seconds, setSeconds] = useState(0);
  const ringAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    setStatus('ringing');
    setSeconds(0);
    setIsMuted(false);
    setIsVideoOff(mode === 'audio');
    const t = setTimeout(() => setStatus('connected'), 2000);
    return () => clearTimeout(t);
  }, [visible, mode]);

  useEffect(() => {
    if (status !== 'connected') return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status !== 'ringing') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [status]);

  const endCall = () => {
    setStatus('ended');
    setTimeout(onClose, 700);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={endCall}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <View
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 28,
            backgroundColor: '#121814',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            alignItems: 'center',
            padding: 28,
            overflow: 'hidden',
          }}
        >
          {mode === 'video' && !isVideoOff && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15,122,82,0.25)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Film size={72} color="rgba(255,255,255,0.35)" />
              <View
                style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <Text style={{ fontFamily: FONT.mono, color: '#fff', fontSize: 10 }}>HD Encrypted Stream</Text>
              </View>
            </View>
          )}

          <View style={{ alignItems: 'center', marginTop: 24, zIndex: 1 }}>
            <Animated.View style={{ transform: [{ scale: status === 'ringing' ? ringAnim : 1 }] }}>
              <Avatar name={name} avatarUrl={avatarUrl} isGroup={isGroup} size={92} />
            </Animated.View>
            <Text style={{ fontFamily: FONT.serifBold, color: '#fff', fontSize: 20, marginTop: 16 }}>{name}</Text>
            <Text style={{ fontFamily: FONT.mono, color: '#4ADE80', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 }}>
              {status === 'ringing' ? 'Ringing…' : status === 'connected' ? fmtTimer(seconds) : 'Call ended'}
            </Text>
          </View>

          {status === 'connected' && mode === 'audio' && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 48, marginVertical: 28, zIndex: 1 }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <EqualizerBar key={i} active={!isMuted} delay={i * 90} />
              ))}
            </View>
          )}
          {(status !== 'connected' || mode !== 'audio') && <View style={{ height: 28 }} />}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16, zIndex: 1 }}>
            <Pressable
              onPress={() => setIsMuted((v) => !v)}
              accessibilityRole="button"
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.12)',
                borderWidth: isMuted ? 1 : 0,
                borderColor: 'rgba(239,68,68,0.4)',
              }}
            >
              {isMuted ? <MicOff size={20} color="#F87171" /> : <Mic size={20} color="#fff" />}
            </Pressable>

            {mode === 'video' && (
              <Pressable
                onPress={() => setIsVideoOff((v) => !v)}
                accessibilityRole="button"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isVideoOff ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.12)',
                  borderWidth: isVideoOff ? 1 : 0,
                  borderColor: 'rgba(239,68,68,0.4)',
                }}
              >
                {isVideoOff ? <VideoOff size={20} color="#F87171" /> : <Video size={20} color="#fff" />}
              </Pressable>
            )}

            <Pressable
              onPress={endCall}
              accessibilityRole="button"
              style={{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DC2626' }}
            >
              <PhoneOff size={24} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
