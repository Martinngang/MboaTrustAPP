import { View, Text, Pressable } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useTheme } from '../../theme/ThemeProvider';
import { FONT } from '../../theme/tokens';

function fmt(s: number) {
  if (!isFinite(s) || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

// Ported from MboaTrustFrontend/src/screens/MessagingScreens.tsx's
// AudioPlayer bubble — play/pause, scrub slider, and a 1x/1.5x/2x speed
// cycle, backed by expo-audio instead of the browser's <audio> element.
export function AudioMessagePlayer({ url, isMe }: { url: string; isMe: boolean }) {
  const { colors } = useTheme();
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);

  const togglePlay = () => {
    if (status.playing) player.pause();
    else player.play();
  };

  const cycleRate = () => {
    const current = player.playbackRate || 1;
    const next = current === 1 ? 1.5 : current === 1.5 ? 2 : 1;
    player.setPlaybackRate(next);
  };

  const onSeek = (value: number) => {
    player.seekTo(value);
  };

  const fg = isMe ? '#fff' : colors.forest;
  const track = isMe ? 'rgba(255,255,255,0.35)' : colors.parchmentDark;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 210, paddingVertical: 2 }}>
      <Pressable
        onPress={togglePlay}
        accessibilityRole="button"
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isMe ? 'rgba(255,255,255,0.9)' : colors.forest,
        }}
      >
        {status.playing ? (
          <Pause size={16} color={isMe ? colors.forest : '#fff'} fill={isMe ? colors.forest : '#fff'} />
        ) : (
          <Play size={16} color={isMe ? colors.forest : '#fff'} fill={isMe ? colors.forest : '#fff'} />
        )}
      </Pressable>

      <View style={{ flex: 1 }}>
        <Slider
          minimumValue={0}
          maximumValue={status.duration || 1}
          value={status.currentTime || 0}
          onSlidingComplete={onSeek}
          minimumTrackTintColor={fg}
          maximumTrackTintColor={track}
          thumbTintColor={fg}
          style={{ width: '100%', height: 24 }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 }}>
          <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: isMe ? 'rgba(255,255,255,0.85)' : colors.inkMuted }}>
            {fmt(status.currentTime || 0)}
          </Text>
          <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: isMe ? 'rgba(255,255,255,0.85)' : colors.inkMuted }}>
            {fmt(status.duration || 0)}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={cycleRate}
        accessibilityRole="button"
        style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : colors.parchmentDark,
        }}
      >
        <Text style={{ fontFamily: FONT.mono, fontSize: 10, fontWeight: '700', color: isMe ? '#fff' : colors.ink }}>
          {player.playbackRate || 1}x
        </Text>
      </Pressable>
    </View>
  );
}
