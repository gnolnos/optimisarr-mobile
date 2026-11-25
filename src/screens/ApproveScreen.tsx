import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  approveReplacement,
  replacements,
  rollbackReplacement,
  replacementStreamSource,
  type StreamSource,
} from '../api/endpoints';
import type { Replacement } from '../api/types';
import { C } from '../theme';
import { bytes } from '../ui';
import { baseName } from './_fmt';
import { useLang } from '../i18n';
import ScreenHeader from '../components/ScreenHeader';
import ABCompare from '../components/ABCompare';

type T = ReturnType<typeof useLang>['t'];

export default function ApproveScreen() {
  const { t } = useLang();
  const [list, setList] = useState<Replacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  // Only one A/B panel is open at a time, so opening another stops (unmounts) the previous one and
  // releases its player — a bookmark that guards LAN bandwidth when several items await a decision.
  const [compareId, setCompareId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setList(await replacements());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 8000);
    return () => clearInterval(timer);
  }, [load]);

  const act = (id: number, fn: () => Promise<unknown>, msg: string) => {
    Alert.alert(t('c_confirm'), msg, [
      { text: t('c_cancel'), style: 'cancel' },
      { text: t('c_ok'), onPress: () => void actRun(id, fn) },
    ]);
  };

  const actRun = async (id: number, fn: () => Promise<unknown>) => {
    setBusy(id);
    try {
      await fn();
      await load();
    } catch (e) {
      Alert.alert(t('c_error'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 80 }} color={C.accent} />;

  return (
    <View style={styles.page}>
      <ScreenHeader title={t('t_approve')} />
      <FlatList
        data={list}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        ListEmptyComponent={<Text style={styles.empty}>{t('ap_none')}</Text>}
        renderItem={({ item }) => (
          <ApproveCard
            item={item}
            t={t}
            busy={busy === item.id}
            onApprove={() => act(item.id, () => approveReplacement(item.id), `${t('jd_replace')}?`)}
            onRollback={() => act(item.id, () => rollbackReplacement(item.id), `${t('ap_rollback')}?`)}
            open={compareId === item.id}
            onToggleCompare={() => setCompareId((v) => (v === item.id ? null : item.id))}
          />
        )}
      />
    </View>
  );
}

function ApproveCard({
  item,
  t,
  busy,
  onApprove,
  onRollback,
  open,
  onToggleCompare,
}: {
  item: Replacement;
  t: T;
  busy: boolean;
  onApprove: () => void;
  onRollback: () => void;
  open: boolean;
  onToggleCompare: () => void;
}) {
  const [sources, setSources] = useState<{ orig: StreamSource; enc: StreamSource } | null>(null);

  // Load the two streamable URLs only while this card's panel is the open one; closing it drops
  // them (the players unmount and release) instead of keeping a socket open per pending item.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    void Promise.all([
      replacementStreamSource(item.id, 'original'),
      replacementStreamSource(item.id, 'replacement'),
    ])
      .then(([orig, enc]) => {
        if (alive) setSources({ orig, enc });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [open, item.id]);

  const saving =
    item.sourceSizeBytes && item.outputSizeBytes
      ? Math.round((1 - item.outputSizeBytes / item.sourceSizeBytes) * 100)
      : null;

  return (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={2}>
        {baseName(item.originalPath) || item.relativePath || `Job #${item.jobId ?? item.id}`}
      </Text>
      <Text style={styles.meta}>
        {bytes(item.sourceSizeBytes)} → {bytes(item.outputSizeBytes)}
        {saving !== null && saving >= 0 ? `  (−${saving}%)` : ''}
      </Text>
      <View style={styles.row3}>
        <Pressable style={[styles.btn, styles.approve, busy && { opacity: 0.5 }]} disabled={busy} onPress={onApprove}>
          <Text style={styles.approveText}>{t('jd_replace')}</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.rollbackBtn, busy && { opacity: 0.5 }]} disabled={busy} onPress={onRollback}>
          <Text style={styles.btnText}>{t('ap_rollback')}</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.ghostBtn, open && styles.ghostActive]}
          onPress={onToggleCompare}
        >
          <Text style={[styles.btnText, open && styles.ghostActiveText]}>{t('ap_compare')}</Text>
        </Pressable>
      </View>
      {open ? (
        sources ? (
          <ABCompare
            top={{ label: t('ab_encoded'), src: sources.enc, sizeBytes: item.outputSizeBytes }}
            bottom={{ label: t('ab_original'), src: sources.orig, sizeBytes: item.sourceSizeBytes }}
          />
        ) : (
          <ActivityIndicator style={{ marginTop: 26 }} color={C.accent} />
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  empty: { color: C.muted, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 12, padding: 12 },
  title: { color: C.text, fontSize: 15, fontWeight: '600' },
  meta: { color: C.muted, fontSize: 12.5, marginTop: 6 },
  row3: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  btn: { paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center' },
  approve: { backgroundColor: C.good, flexGrow: 1 },
  rollbackBtn: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, flexGrow: 1 },
  ghostBtn: { backgroundColor: C.card, borderColor: C.accent, borderWidth: 1 },
  ghostActive: { backgroundColor: C.accent + '22' },
  ghostActiveText: { color: C.accent },
  btnText: { color: C.text, fontWeight: '700', fontSize: 13 },
  approveText: { color: '#10131a', fontWeight: '700', fontSize: 13 },
});
