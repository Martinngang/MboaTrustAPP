import { useVideoPlayer, VideoView } from 'expo-video';

// Ported from MboaTrustFrontend/src/screens/MessagingScreens.tsx's inline
// `<video controls>` attachment — native controls via expo-video instead.
export function VideoMessagePlayer({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
  });

  return (
    <VideoView
      player={player}
      nativeControls
      contentFit="cover"
      style={{ width: 220, height: 150, borderRadius: 10, backgroundColor: '#000' }}
    />
  );
}
