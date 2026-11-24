import { FlatList, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { useJobsConnection } from '../hooks/useJobsConnection';
import type { Job } from '../api/types';
import type { JobsScreenProps } from '../nav';
import { C } from '../theme';
import { bytes } from '../ui';
import { useLang } from '../i18n';
import ScreenHeader from '../components/ScreenHeader';

export default function JobsScreen({ navigation }: JobsScreenProps) {
  const { t } = useLang();
  const { jobs, refresh, mode, error } = useJobsConnection();

  return (
    <View style={styles.page}>
      <ScreenHeader title={t('t_jobs')} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={jobs}
        keyExtractor={(j) => String(j.id)}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={C.muted} />}
        ListEmptyComponent={<Text style={styles.empty}>{t('jobs_empty')}</Text>}
        renderItem={({ item }) => (
          <JobRow job={item} t={t} onPress={() => navigation.navigate('JobDetail', { jobId: item.id })} />
        )}
      />
      <Text style={styles.banner}>{mode === 'signalr' ? '● live' : mode === 'poll' ? '◌ poll' : 'off'}</Text>
    </View>
  );
}

type T = ReturnType<typeof useLang>['t'];

function JobRow({ job, onPress, t }: { job: Job; onPress: () => void; t: T }) {
  return (
    <View style={styles.card} onTouchEnd={onPress}>
      <View style={styles.cardRow}>
        <Badge tone={jobTone(job.status)} text={job.status ?? '?'} />
        <Text style={styles.id}>#{job.id}</Text>
        {job.workerName ? <Text style={styles.worker}>@{job.workerName}</Text> : null}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {job.relativePath ?? job.title ?? t('untitled')}
      </Text>
      <View style={styles.cardRow}>
        <Text style={styles.meta}>{job.videoEncoder ?? '—'} · {stageOf(job, t)}</Text>
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

function stageOf(job: Job, t: T): string {
  if (job.status === 'Failed') return job.reason ?? 'failed';
  if (job.status === 'Completed') return 'done';
  return job.stage ?? job.status ?? '';
}

function jobTone(status?: string): 'error' | 'success' | 'active' {
  if (status === 'Failed') return 'error';
  if (status === 'Completed') return 'success';
  return 'active';
}

function Badge({ text, tone }: { text: string; tone: 'error' | 'success' | 'active' }) {
  const color = tone === 'error' ? C.bad : tone === 'success' ? C.good : C.accent;
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  error: { color: C.bad, paddingHorizontal: 16, paddingBottom: 4 },
  banner: { color: C.muted, fontSize: 12, textAlign: 'center', paddingVertical: 4 },
  empty: { color: C.muted, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 12, padding: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
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
