import { useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { getBaseUrl, getMode, getToken, setBaseUrl, setMode, setToken, type NetMode } from '../config';
import { queueStatus } from '../api/endpoints';
import { ApiError } from '../api/client';
import { C } from '../theme';
import { useLang } from '../i18n';
import ScreenHeader from '../components/ScreenHeader';

export default function SettingsScreen() {
  const { t } = useLang();
  const [url, setUrl] = useState('');
  const [token, setTokenState] = useState('');
  const [mode, setModeState] = useState<NetMode>('internal');
  const [testing, setTesting] = useState(false);

  const load = async () => {
    const [base, tk, md] = await Promise.all([getBaseUrl(), getToken(), getMode()]);
    setUrl(base);
    setTokenState(tk);
    setModeState(md);
  };
  void load();

  const isHttp = /^http:\/\//i.test(url.trim());
  const isHttps = /^https:\/\//i.test(url.trim());
  const tokenMissing = token.trim().length === 0;

  const persist = async () => {
    await setBaseUrl(url);
    await setToken(token);
    await setMode(mode);
  };

  const guarded = (next: () => void): void => {
    const trimmed = url.trim();
    if (!trimmed) {
      Alert.alert(t('c_missing_url'), t('c_missing_url_msg'), [{ text: t('c_ok') }]);
      return;
    }
    if (mode === 'external') {
      if (isHttp) {
        Alert.alert(t('c_http_ext'), t('c_http_ext_msg'), [{ text: t('c_ok') }]);
        return;
      }
      if (!isHttps) {
        Alert.alert(t('c_missing_https'), t('c_missing_https_msg'), [{ text: t('c_ok') }]);
        return;
      }
    } else if (!/^https?:\/\//i.test(trimmed)) {
      Alert.alert(t('c_missing_scheme'), t('c_missing_scheme_msg'), [
        { text: t('c_cancel'), style: 'cancel' },
        { text: t('c_still_save'), onPress: () => next() },
      ]);
      return;
    }
    if (tokenMissing) {
      Alert.alert(t('c_token_warn'), t('c_token_warn_msg'), [
        { text: t('c_cancel'), style: 'cancel' },
        { text: t('c_still_go'), onPress: () => next() },
      ]);
      return;
    }
    next();
  };

  const save = () => {
    guarded(async () => {
      await persist();
      Alert.alert(t('c_saved'), t('c_saved_msg'), [{ text: t('c_ok') }]);
    });
  };

  const test = () => {
    guarded(async () => {
      setTesting(true);
      try {
        await persist();
        const q = await queueStatus();
        Alert.alert(t('c_conn_ok'), `encoderMode=${q.encoderMode ?? '?'}`);
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e);
        Alert.alert(t('c_conn_fail'), msg);
      } finally {
        setTesting(false);
      }
    });
  };

  const segments: { key: NetMode; label: string; sub: string }[] = [
    { key: 'internal', label: t('set_internal'), sub: t('set_internal_sub') },
    { key: 'external', label: t('set_external'), sub: t('set_external_sub') },
  ];

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.page}>
        <ScreenHeader title={t('t_settings')} />
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          <Text style={styles.label}>{t('set_mode')}</Text>
          <View style={styles.segRow}>
            {segments.map((s) => {
              const active = mode === s.key;
              return (
                <Pressable key={s.key} style={[styles.seg, active && styles.segActive]} onPress={() => setModeState(s.key)}>
                  <Text style={[styles.segLabel, active && styles.segLabelActive]}>{s.label}</Text>
                  <Text style={[styles.segSub, active && styles.segSubActive]}>{s.sub}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>{t('set_url')}</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder={mode === 'internal' ? t('set_url_ph_in') : t('set_url_ph_out')}
            placeholderTextColor={C.muted}
            value={url}
            onChangeText={setUrl}
          />
          {mode === 'external' && isHttp ? (
            <Text style={styles.warn}>⚠️ {t('c_http_ext_msg')}</Text>
          ) : mode === 'internal' && isHttp ? (
            <Text style={styles.noteInline}>{t('set_internal_sub')}</Text>
          ) : isHttps ? (
            <Text style={styles.ok}>✓ HTTPS</Text>
          ) : null}

          <Text style={styles.label}>
            {t('set_token')} <Text style={styles.muted}>{t('set_token_opt')}</Text>
          </Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            placeholder={t('set_token_ph')}
            placeholderTextColor={C.muted}
            value={token}
            onChangeText={setTokenState}
          />
          {tokenMissing ? <Text style={styles.warn}>⚠️ {t('c_token_warn')}</Text> : <Text style={styles.ok}>✓ {t('set_token')}</Text>}

          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.primary]} onPress={test} disabled={testing}>
              <Text style={styles.btnText}>{testing ? t('set_testing') : t('set_save_test')}</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={save}>
              <Text style={styles.btnText}>{t('set_save')}</Text>
            </Pressable>
          </View>

          <Text style={styles.note}>{t('set_foot')}</Text>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  body: { padding: 16, paddingTop: 4 },
  label: { color: C.text, fontSize: 14, marginTop: 14, marginBottom: 6 },
  muted: { color: C.muted },
  input: {
    backgroundColor: C.card,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: C.text,
    fontSize: 15,
  },
  segRow: { flexDirection: 'row', gap: 8 },
  seg: { flex: 1, backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 10, padding: 12 },
  segActive: { borderColor: C.accent, backgroundColor: C.accent + '18' },
  segLabel: { color: C.muted, fontWeight: '700', fontSize: 13.5 },
  segLabelActive: { color: C.accent },
  segSub: { color: C.muted, fontSize: 11.5, marginTop: 2 },
  segSubActive: { color: C.accent },
  warn: { color: C.warn, fontSize: 12.5, marginTop: 6 },
  ok: { color: C.good, fontSize: 12.5, marginTop: 6 },
  noteInline: { color: C.muted, fontSize: 12.5, marginTop: 6 },
  row: { flexDirection: 'row', gap: 10, marginTop: 22 },
  btn: {
    flex: 1,
    backgroundColor: C.card,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primary: { backgroundColor: C.accent, borderColor: C.accent },
  btnText: { color: C.text, fontWeight: '600' },
  note: { color: C.muted, fontSize: 12.5, lineHeight: 18, marginTop: 26 },
});
