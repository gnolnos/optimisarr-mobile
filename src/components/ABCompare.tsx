import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
 * Two stacked players in sync, the way the web compare plays: the top player is the master (it has
 * the native transport — play/pause/seek) and the bottom player mirrors it, so both frames sit at
 * the same moment while only one transport is fought over. Two independent play heads would let
 * files of different length drift apart and double the streaming.
 */
export default function ABCompare({ top, bottom }: { top: ABPlayerInput; bottom: ABPlayerInput }) {
  const master = useVideoPlayer(top.src, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.5;
  });
  const mirror = useVideoPlayer(bottom.src, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.5;
  });
  const [, force] = useState(0);

  useEffect(() => {
    const onPlaying = (e: { isPlaying: boolean }) => {
      if (e.isPlaying) mirror.play();
      else mirror.pause();
    };
    const onTime = () => {
      if (master.currentTime > 0) mirror.currentTime = master.currentTime;
      force((n) => n + 1);
    };
    const l1 = master.addListener('playingChange', onPlaying);
    const l2 = master.addListener('timeUpdate', onTime);
    return () => {
      l1.remove();
      l2.remove();
    };
  }, [master, mirror]);

  return (
    <View style={styles.wrap}>
      <Pane label={top.label} player={master} sizeBytes={top.sizeBytes} master />
      <Pane label={bottom.label} player={mirror} sizeBytes={bottom.sizeBytes} />
    </View>
  );
}

function Pane({
  label,
  player,
  sizeBytes,
  master,
}: {
  label: string;
  player: ReturnType<typeof useVideoPlayer>;
  sizeBytes?: number | null;
  master?: boolean;
}) {
  return (
    <View style={[styles.pane, master && styles.paneMaster]}>
      <View style={styles.paneHead}>
        <Text style={styles.paneLabel}>{label}</Text>
        {sizeBytes != null ? <Text style={styles.paneSize}>{bytes(sizeBytes)}</Text> : null}
      </View>
      <VideoView player={player} style={styles.video} contentFit="contain" nativeControls={!!master} />
      {!master ? <Text style={styles.mirror}>↻ đồng bộ theo player trên</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 12 },
  pane: { backgroundColor: '#000', borderColor: C.border, borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  paneMaster: { borderColor: C.accent },
  paneHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: C.card,
  },
  paneLabel: { color: C.text, fontSize: 12.5, fontWeight: '700' },
  paneSize: { color: C.muted, fontSize: 12 },
  video: { width: '100%', height: 160, backgroundColor: '#000' },
  mirror: { color: C.muted, fontSize: 11, textAlign: 'center', paddingVertical: 4 },
});

