import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  approveSizePreflight,
  cancelJob,
  job,
  jobLog,
  replaceJob,
  retryJob,
  acceptBelowTarget,
} from '../api/endpoints';
import type { Job } from '../api/types';
import type { RootStackParamList } from '../nav';
import { C } from '../theme';
import { bytes } from '../ui';
import { baseName } from './_fmt';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;

export default function JobDetailScreen({ route }: Props) {
  const { jobId } = route.params;
  const [j, setJ] = useState<Job | null>(null);
  const [log, setLog] = useState<string | null>(null);
  const [busy, setBusy] = useState<'replace' | 'retry' | 'cancel' | 'preflight' | 'accept' | null>(null);

  const load = useCallback(async () => {
    try {
      setJ(await job(jobId));
    } catch {
      /* keep last */
    }
  }, [jobId]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [load]);

  const run = async (kind: NonNullable<typeof busy>, fn: () => Promise<unknown>, confirmMsg?: string) => {
    const doIt = async () => {
      setBusy(kind);
      try {
        await fn();
        await load();
        Alert.alert('Đã thực hiện', 'Thành công.');
      } catch (e) {
        Alert.alert('Lỗi', e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(null);
      }
    };
    if (confirmMsg) Alert.alert('Xác nhận', confirmMsg, [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Đồng ý', style: 'destructive', onPress: () => void doIt() },
    ]);
    else void doIt();
  };

  const showLog = async () => {
    try {
      setLog(await jobLog(jobId));
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : String(e));
    }
  };

  if (!j) {
    return <ActivityIndicator style={{ marginTop: 80 }} color={C.accent} />;
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.body}>
      <Text style={styles.id}>Job #{j.id} · {j.status ?? '…'}</Text>
      <Text style={styles.title}>{baseName(j.relativePath) ?? j.title ?? '(không có tên)'}</Text>
      <Text style={styles.meta}>encoder {j.videoEncoder ?? '—'} · worker {j.workerName ?? 'server'}</Text>
      <Text style={styles.meta}>
        {bytes(j.sourceSizeBytes)} → {bytes(j.outputSizeBytes)}
      </Text>
      {typeof j.progress === 'number' ? (
        <Text style={styles.meta}>tiến độ {Math.round(j.progress * 100)}%</Text>
      ) : null}
      {j.reason ? <Text style={styles.reason}>Ghi chú: {j.reason}</Text> : null}

      <View style={styles.btnGrid}>
        <ActionButton label="Cancel" disabled={busy !== null} onPress={() => run('cancel', () => cancelJob(j.id), 'Huỷ job này?')} />
        <ActionButton label="Retry" disabled={busy !== null} onPress={() => run('retry', () => retryJob(j.id, false))} />
        <ActionButton label="Approve preflight" disabled={busy !== null} onPress={() => run('preflight', () => approveSizePreflight(j.id))} />
        <ActionButton label="Accept below target" disabled={busy !== null} onPress={() => run('accept', () => acceptBelowTarget(j.id, j.executionAttempt ?? 1))} />
        <ActionButton label="Xem log" onPress={showLog} />
        <ActionButton label="Replace nguyên bản" primary dangerous disabled={busy !== null} onPress={() => run('replace', () => replaceJob(j.id), 'Thay thế file gốc bằng file đã tối ưu? (bản gốc vào Quarantine)')} />
      </View>

      {log ? (
        <View style={styles.logBox}>
          <Text style={styles.logTitle}>Log (FFmpeg)</Text>
          <Text style={styles.logText} selectable>{log}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function ActionButton({
  label,
  onPress,
  primary,
  dangerous,
  disabled,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  dangerous?: boolean;
  disabled?: boolean;
}) {
  const bg = primary ? (dangerous ? C.bad : C.accent) : C.card;
  return (
    <Pressable
      style={[styles.btn, { backgroundColor: bg, opacity: disabled ? 0.4 : 1 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.btnText, primary && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  body: { padding: 16 },
  id: { color: C.accent, fontSize: 13, fontWeight: '700' },
  title: { color: C.text, fontSize: 18, fontWeight: '700', marginTop: 4 },
  meta: { color: C.muted, fontSize: 13.5, marginTop: 6 },
  reason: { color: C.warn, fontSize: 13.5, marginTop: 8 },
  btnGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  btn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  btnText: { color: C.text, fontWeight: '600' },
  logBox: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 20 },
  logTitle: { color: C.muted, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  logText: { color: C.muted, fontSize: 12, fontFamily: 'monospace' },
});
