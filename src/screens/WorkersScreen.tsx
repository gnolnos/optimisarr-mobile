import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  activePairingCode,
  cancelPairingCode,
  drainWorker,
  issuePairingCode,
  resumeWorker,
  revokeWorker,
  workers,
} from '../api/endpoints';
import type { Worker, WorkerPairingCode } from '../api/types';
import { C } from '../theme';
import { baseName } from './_fmt';
import { useLang } from '../i18n';
import ScreenHeader from '../components/ScreenHeader';

export default function WorkersScreen() {
  const { t } = useLang();
  const [list, setList] = useState<Worker[]>([]);
  const [pair, setPair] = useState<WorkerPairingCode | null>(null);

  const load = useCallback(async () => {
    try {
      const [ws, pc] = await Promise.all([workers(), activePairingCode()]);
      setList(ws);
      setPair(pc);
    } catch {
      /* retry on next poll */
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 8000);
    return () => clearInterval(t);
  }, [load]);

  const genCode = async () => {
    try {
      setPair(await issuePairingCode());
    } catch (e) {
      Alert.alert(t('c_error'), e instanceof Error ? e.message : String(e));
    }
  };

  const cancelCode = async () => {
    try {
      await cancelPairingCode();
      setPair(null);
    } catch (e) {
      Alert.alert(t('c_error'), e instanceof Error ? e.message : String(e));
    }
  };

  const setDrain = (w: Worker) => {
    const msg = !w.drainRequestedAt
      ? t('wk_drain_q').replace('{name}', `"${w.name}"`)
      : t('wk_resume_q').replace('{name}', `"${w.name}"`);
    Alert.alert(t('c_confirm'), msg, [
      { text: t('c_cancel'), style: 'cancel' },
      {
        text: t('c_ok'),
        onPress: async () => {
          try {
            await (w.drainRequestedAt ? resumeWorker(w.id) : drainWorker(w.id));
            void load();
          } catch (e) {
            Alert.alert(t('c_error'), e instanceof Error ? e.message : String(e));
          }
        },
      },
    ]);
  };

  const revoke = (w: Worker) => {
    Alert.alert(t('c_confirm'), t('wk_lock_q').replace('{name}', `"${w.name}"`) + '?', [
      { text: t('c_cancel'), style: 'cancel' },
      {
        text: t('c_lock'),
        onPress: async () => {
          try {
            await revokeWorker(w.id);
            void load();
          } catch (e) {
            Alert.alert(t('c_error'), e instanceof Error ? e.message : String(e));
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.page}>
      <ScreenHeader title={t('t_workers')} />
      <FlatList
        data={list}
        keyExtractor={(w) => String(w.id)}
        ListHeaderComponent={<PairingCard pair={pair} onGen={genCode} onCancel={cancelCode} />}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.rowH}>
              <Text style={styles.name}>{item.name ?? `#${item.id}`}</Text>
              <Badge online={item.online} revoked={!!item.revokedAt} drain={!!item.drainRequestedAt} />
            </View>
            <Text style={styles.meta}>
              {item.operatingSystem} · {item.architecture ?? '?'} {item.sidecarVersion ? `· v${item.sidecarVersion}` : ''}
            </Text>
            {item.videoEncoders?.length ? (
              <Text style={styles.meta2}>{t('wk_encoders')} {item.videoEncoders.join(', ')}</Text>
            ) : null}
            {item.activeJobs?.length ? (
              <Text style={styles.meta}>
                {t('wk_busy')} {item.activeJobs.map((a) => baseName(a.relativePath)).join(', ')}
              </Text>
            ) : (
              <Text style={styles.meta}>{t('wk_idle')}: {item.cpuBusyFraction != null ? Math.round(item.cpuBusyFraction * 100) + '% CPU' : 'n/a'}</Text>
            )}
            <View style={styles.row2}>
              <Pressable style={[styles.btn, styles.warnBtn]} onPress={() => setDrain(item)}>
                <Text style={styles.btnTextDark}>{item.drainRequestedAt ? t('wk_resume') : t('wk_drain')}</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.dangerBtn]} onPress={() => revoke(item)}>
                <Text style={styles.btnText}>{t('wk_lock')}</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

function PairingCard({ pair, onGen, onCancel }: { pair: WorkerPairingCode | null; onGen: () => void; onCancel: () => void }) {
  const { t } = useLang();
  return (
    <View style={styles.pairCard}>
      <Text style={styles.pairTitle}>{t('wk_pair_title')}</Text>
      {pair ? (
        <>
          <Text style={styles.pairCode}>{pair.code}</Text>
          <Text style={styles.pairHint}>{t('wk_hint')}</Text>
          <Pressable style={[styles.btn, styles.dangerBtn, { alignSelf: 'center' }]} onPress={onCancel}>
            <Text style={styles.btnText}>{t('wk_cancel_code')}</Text>
          </Pressable>
        </>
      ) : (
        <Pressable style={[styles.btn, styles.approveBtn, { alignSelf: 'center' }]} onPress={onGen}>
          <Text style={styles.btnTextDark}>{t('wk_gen')}</Text>
        </Pressable>
      )}
    </View>
  );
}

function Badge({ online, revoked, drain }: { online: boolean; revoked: boolean; drain: boolean }) {
  const { t } = useLang();
  const color = revoked ? C.muted : drain ? C.warn : online ? C.good : C.muted;
  const label = revoked ? t('wk_revoked') : drain ? t('wk_draining') : online ? t('wk_online') : t('wk_offline');
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  card: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 12, padding: 12 },
  rowH: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { color: C.text, fontSize: 15, fontWeight: '700', flex: 1 },
  meta: { color: C.muted, fontSize: 12.5, marginTop: 5 },
  meta2: { color: C.muted, fontSize: 12, marginTop: 4 },
  row2: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  approveBtn: { backgroundColor: C.good },
  warnBtn: { backgroundColor: C.warn, flex: 1 },
  dangerBtn: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1 },
  btnText: { color: C.text, fontWeight: '700' },
  btnTextDark: { color: '#10131a', fontWeight: '700' },
  badge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 11.5, fontWeight: '700' },
  pairCard: { backgroundColor: C.card, borderColor: C.accent, borderWidth: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  pairTitle: { color: C.text, fontWeight: '700', marginBottom: 8 },
  pairCode: { color: C.accent, fontSize: 34, fontWeight: '800', letterSpacing: 4, marginVertical: 6 },
  pairHint: { color: C.muted, fontSize: 12.5, marginBottom: 10, textAlign: 'center' },
});