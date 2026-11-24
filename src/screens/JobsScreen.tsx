import { FlatList, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { useJobsConnection } from '../hooks/useJobsConnection';
import type { Job } from '../api/types';
import type { JobsScreenProps } from '../nav';
import { C } from '../theme';
import { bytes } from '../ui';

export default function JobsScreen({ navigation }: JobsScreenProps) {
  const { jobs, refresh, mode, error } = useJobsConnection();

  return (
    <View style={styles.page}>
      <View style={styles.head}>
        <Text style={styles.h1}>Jobs</Text>
        <Text style={styles.modeBanner}>{mode === 'signalr' ? '● live' : mode === 'poll' ? '◌ poll' : 'off'}</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={jobs}
        keyExtractor={(j) => String(j.id)}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={C.muted} />}
        ListEmptyComponent={<Text style={styles.empty}>Chưa có job nào.</Text>}
        renderItem={({ item }) => (
          <JobRow job={item} onPress={() => navigation.navigate('JobDetail', { jobId: item.id })} />
        )}
      />
    </View>
  );
}

function JobRow({ job, onPress }: { job: Job; onPress: () => void }) {
  return (
    <View style={styles.card} onTouchEnd={onPress}>
      <View style={styles.cardRow}>
        <Badge tone={jobTone(job.status)} text={job.status ?? '?'} />
        <Text style={styles.id}>#{job.id}</Text>
        {job.workerName ? <Text style={styles.worker}>@{job.workerName}</Text> : null}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {job.relativePath ?? job.title ?? '(không có tên)'}
      </Text>
      <View style={styles.cardRow}>
        <Text style={styles.meta}>{job.videoEncoder ?? '— echo…'} · {stageOf(job)}</Text>
      </View>
      {typeof job.progress === 'number' ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(job.progress * 100)}%` }]} />
        </View>
      ) : null}
      <Text style={styles.meta2}>
        {bytes(job.sourceSizeBytes)} → {bytes(job.outputSizeBytes)}
      </Text>
    </View>
  );
}

function stageOf(job: Job): string {
  if (job.status === 'Failed') return job.reason ?? 'failed';
  if (job.status === 'Completed') return 'done';
  return job.stage ?? job.status ?? '';
}

function Badge({ text, tone }: { text: string; tone: string }) {
  const color = tone === 'error' ? C.bad : tone === 'success' ? C.good : C.accent;
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

function jobTone(status?: string): string {
  if (status === 'Failed') return 'error';
  if (status === 'Completed') return 'success';
  return 'active';
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 4 },
  h1: { color: C.text, fontSize: 22, fontWeight: '700' },
  modeBanner: { color: C.muted, fontSize: 13 },
  error: { color: C.bad, paddingHorizontal: 16, paddingBottom: 4 },
  empty: { color: C.muted, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 12, padding: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  id: { color: C.muted, fontSize: 13 },
  worker: { color: C.accent, fontSize: 13 },
  title: { color: C.text, fontSize: 15, fontWeight: '600', marginTop: 6 },
  meta: { color: C.muted, fontSize: 12.5, marginTop: 4 },
  meta2: { color: C.muted, fontSize: 12.5, marginTop: 6 },
  badge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 11.5, fontWeight: '700' },
  progressTrack: { height: 4, backgroundColor: C.border, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: C.good, borderRadius: 2 },
});
