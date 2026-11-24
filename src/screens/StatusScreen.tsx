import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { queueStatus, queuePause, queueResume, stats } from '../api/endpoints';
import type { QueueStatus, Stats } from '../api/types';
import { C } from '../theme';
import { useLang } from '../i18n';
import ScreenHeader from '../components/ScreenHeader';

export default function StatusScreen() {
  const { t } = useLang();
  const [q, setQ] = useState<QueueStatus | null>(null);
  const [s, setS] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [queued, st] = await Promise.all([queueStatus(), stats()]);
      setQ(queued);
      setS(st);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 8000);
    return () => clearInterval(t);
  }, [load]);

  const togglePause = async () => {
    try {
      const next = q?.paused ? await queueResume() : await queuePause();
      setQ(next);
    } catch (e) {
      Alert.alert(t('c_error'), e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <View style={styles.page}>
      <ScreenHeader title={t('t_status')} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.row}>
          <Card label={t('st_running')} value={String(s?.running ?? '—')} />
          <Card label={t('st_queued')} value={String(s?.queued ?? '—')} />
          <Card label={t('st_ready')} value={String(s?.readyToReplace ?? '—')} />
        </View>

        <Card label={t('st_optimised')} value={String(s?.filesOptimised ?? '—')} />
        <Card label={t('st_saved')} value={fmtBytes(s?.bytesSaved)} big />
        <Card label={t('st_avg')} value={`${(s?.averageSavingPercent ?? 0).toFixed(1)}%`} />

        {q?.blockedReason ? <Text style={styles.warn}>{t('st_blocked')} {q.blockedReason}</Text> : null}

        <Pressable style={[styles.btn, q?.paused ? styles.resume : styles.pause]} onPress={togglePause}>
          <Text style={styles.btnText}>{q?.paused ? t('st_resume') : t('st_pause')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Card({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValue, big && styles.cardValueBig]}>{value}</Text>
    </View>
  );
}

function fmtBytes(n?: number): string {
  if (n === undefined || n === null) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  body: { padding: 16, gap: 12, paddingTop: 4 },
  error: { color: C.bad, marginBottom: 8 },
  warn: { color: C.warn, fontSize: 12.5, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 10 },
  card: {
    flex: 1,
    backgroundColor: C.card,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  cardLabel: { color: C.muted, fontSize: 12.5 },
  cardValue: { color: C.text, fontSize: 26, fontWeight: '700', marginTop: 6 },
  cardValueBig: { fontSize: 34 },
  btn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  pause: { backgroundColor: C.warn },
  resume: { backgroundColor: C.good },
  btnText: { color: '#10131a', fontWeight: '700', fontSize: 16 },
});
