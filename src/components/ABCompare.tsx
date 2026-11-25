import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { C } from '../theme';
import { bytes } from '../ui';
import type { StreamSource } from '../api/endpoints';

export interface ABPlayerInput {
  label: string;
  src: StreamSource;
  sizeBytes?: number | null;
}

/**
 * Two stacked players — the original on top, the encoded candidate on the bottom — so a
 * replacement can be judged by eye before Replace or Roll back. Names and sizes come from the
 * parent; each player keeps its own native controls (own play head), because a shared seek bar made
 * two different-length files fight over one position.
 */
export default function ABCompare({ top, bottom }: { top: ABPlayerInput; bottom: ABPlayerInput }) {
  const topPlayer = useVideoPlayer(top.src, (p) => { p.loop = false; });
  const bottomPlayer = useVideoPlayer(bottom.src, (p) => { p.loop = false; });

  return (
    <View style={styles.wrap}>
      <Pane {...top} player={topPlayer} />
      <Pane {...bottom} player={bottomPlayer} />
    </View>
  );
}

function Pane({ label, player, sizeBytes }: ABPlayerInput & { player: ReturnType<typeof useVideoPlayer> }) {
  return (
    <View style={styles.pane}>
      <View style={styles.paneHead}>
        <Text style={styles.paneLabel}>{label}</Text>
        {sizeBytes != null ? <Text style={styles.paneSize}>{bytes(sizeBytes)}</Text> : null}
      </View>
      <VideoView player={player} style={styles.video} contentFit="contain" nativeControls />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginTop: 12 },
  pane: { backgroundColor: '#000', borderColor: C.border, borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  paneHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: C.card },
  paneLabel: { color: C.text, fontSize: 12.5, fontWeight: '700' },
  paneSize: { color: C.muted, fontSize: 12 },
  video: { width: '100%', height: 160, backgroundColor: '#000' },
});
