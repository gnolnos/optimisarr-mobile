import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { approveReplacement, replacements, rollbackReplacement } from '../api/endpoints';
import type { Replacement } from '../api/types';
import { C } from '../theme';
import { bytes } from '../ui';
import { baseName } from './_fmt';
import { useLang } from '../i18n';
import ScreenHeader from '../components/ScreenHeader';

export default function ApproveScreen() {
  const { t } = useLang();
  const [list, setList] = useState<Replacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setList(await replacements());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 8000);
    return () => clearInterval(t);
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
        renderItem={({ item }) => {
          const saving = item.sourceSizeBytes && item.outputSizeBytes
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
              <View style={styles.row2}>
                <Pressable
                  style={[styles.btn, styles.approve, busy === item.id && { opacity: 0.5 }]}
                  disabled={busy === item.id}
                  onPress={() => act(item.id, () => approveReplacement(item.id), `${t('jd_replace')}?`)}
                >
                  <Text style={styles.btnText}>{t('ap_approve')}</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.rollbackBtn, busy === item.id && { opacity: 0.5 }]}
                  disabled={busy === item.id}
                  onPress={() => act(item.id, () => rollbackReplacement(item.id), `${t('ap_rollback')}?`)}
                >
                  <Text style={styles.btnText}>{t('ap_rollback')}</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  empty: { color: C.muted, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 12, padding: 12 },
  title: { color: C.text, fontSize: 15, fontWeight: '600' },
  meta: { color: C.muted, fontSize: 12.5, marginTop: 6 },
  row2: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  approve: { backgroundColor: C.good },
  rollbackBtn: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1 },
  btnText: { color: '#10131a', fontWeight: '700' },
});