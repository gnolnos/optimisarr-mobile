import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getBaseUrl, getMode, getToken, setBaseUrl, setMode, setToken, type NetMode } from '../config';
import { queueStatus } from '../api/endpoints';
import { ApiError } from '../api/client';
import { C } from '../theme';

export default function SettingsScreen() {
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

  // Two connection modes:
  //  - Nội bộ (internal): LAN tin cậy, cho phép HTTP trần.
  //  - Bên ngoài (external): bắt buộc HTTPS, không cho HTTP trần.
  const guarded = (next: () => void): void => {
    const trimmed = url.trim();
    if (!trimmed) {
      Alert.alert('Thiếu địa chỉ server', 'Nhập URL gốc, ví dụ http://192.168.100.199:8787.', [{ text: 'OK' }]);
      return;
    }
    if (mode === 'external') {
      if (isHttp) {
        Alert.alert('HTTP không được phép ở chế độ Bên ngoài', 'Ra mạng ngoài phải dùng HTTPS. Dùng https:// hoặc đổi sang chế độ Nội bộ.', [{ text: 'OK' }]);
        return;
      }
      if (!isHttps) {
        Alert.alert('Thiếu https://', 'Ở chế độ Bên ngoài, URL phải bắt đầu bằng https://', [{ text: 'OK' }]);
        return;
      }
    } else if (!/^https?:\/\//i.test(trimmed)) {
      Alert.alert('Thiếu giao thức', 'Nên thêm http:// hoặc https:// vào đầu URL.', [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Vẫn lưu', onPress: () => next() },
      ]);
      return;
    }

    if (tokenMissing) {
      Alert.alert(
        'Chưa nhập admin token',
        'Nếu server đã đặt OPTIMISARR_ADMIN_TOKEN, mọi yêu cầu sẽ trả 401 tới khi bạn nhập. ' +
          'Nếu server chưa đặt token, dữ liệu không được xác thực — nên đặt token ở container Unraid.',
        [
          { text: 'Huỷ', style: 'cancel' },
          { text: 'Vẫn tiếp tục', onPress: () => next() },
        ],
      );
      return;
    }
    next();
  };

  const save = () => {
    guarded(async () => {
      await persist();
      Alert.alert('Đã lưu', 'Cấu hình đã lưu.', [{ text: 'OK' }]);
    });
  };

  const test = () => {
    guarded(async () => {
      setTesting(true);
      try {
        await persist();
        const q = await queueStatus();
        Alert.alert('Kết nối OK', `Server phản hồi · encoderMode=${q.encoderMode ?? '?'}`);
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e);
        Alert.alert('Không kết nối được', msg);
      } finally {
        setTesting(false);
      }
    });
  };

  const segments: { key: NetMode; label: string; sub: string }[] = [
    { key: 'internal', label: 'Nội bộ (LAN)', sub: 'HTTP trần được phép' },
    { key: 'external', label: 'Bên ngoài', sub: 'Bắt buộc HTTPS' },
  ];

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.body}>
      <Text style={styles.h1}>Cài đặt kết nối</Text>

      <Text style={styles.label}>Chế độ mạng</Text>
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

      <Text style={styles.label}>Địa chỉ server (URL gốc)</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder={mode === 'internal' ? 'http://192.168.100.199:8787' : 'https://optimisarr.example.com'}
        placeholderTextColor={C.muted}
        value={url}
        onChangeText={setUrl}
      />
      {mode === 'external' && isHttp ? (
        <Text style={styles.warn}>⚠️ HTTP ở chế độ Bên ngoài — bị chặn. Phải dùng HTTPS.</Text>
      ) : mode === 'internal' && isHttp ? (
        <Text style={styles.noteInline}>HTTP chỉ dùng trong LAN tin cậy (không mã hoá).</Text>
      ) : isHttps ? (
        <Text style={styles.ok}>✓ HTTPS — kết nối được mã hoá.</Text>
      ) : null}

      <Text style={styles.label}>
        Admin token (Bearer) <Text style={styles.muted}>— để trống nếu server chưa đặt</Text>
      </Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        placeholder="(tuỳ chọn)"
        placeholderTextColor={C.muted}
        value={token}
        onChangeText={setTokenState}
      />
      {tokenMissing ? (
        <Text style={styles.warn}>⚠️ Thiếu token: nếu server đã đặt token, các thao tác sẽ bị từ chối (401).</Text>
      ) : (
        <Text style={styles.ok}>✓ Đã nhập token — mọi yêu cầu gửi kèm Bearer.</Text>
      )}

      <View style={styles.row}>
        <Pressable style={[styles.btn, styles.primary]} onPress={test} disabled={testing}>
          <Text style={styles.btnText}>{testing ? 'Đang thử…' : 'Lưu & kiểm tra'}</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={save}>
          <Text style={styles.btnText}>Chỉ lưu</Text>
        </Pressable>
      </View>

      <Text style={styles.note}>
        Nội bộ: phone phải cùng mạng LAN mới vào được. Bên ngoài: cần reverse proxy + HTTPS và đặt admin
        token. URL không thêm '/api' — app tự nối.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  body: { padding: 16 },
  h1: { color: C.text, fontSize: 22, fontWeight: '700', marginBottom: 16 },
  label: { color: C.text, fontSize: 14, marginTop: 12, marginBottom: 6 },
  muted: { color: C.muted },
  input: {
    backgroundColor: C.card,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C.text,
    fontSize: 15,
  },
  segRow: { flexDirection: 'row', gap: 8 },
  seg: { flex: 1, backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 10, padding: 10 },
  segActive: { borderColor: C.accent, backgroundColor: C.accent + '18' },
  segLabel: { color: C.muted, fontWeight: '700', fontSize: 13.5 },
  segLabelActive: { color: C.accent },
  segSub: { color: C.muted, fontSize: 11.5, marginTop: 2 },
  segSubActive: { color: C.accent },
  warn: { color: C.warn, fontSize: 12.5, marginTop: 6 },
  ok: { color: C.good, fontSize: 12.5, marginTop: 6 },
  noteInline: { color: C.muted, fontSize: 12.5, marginTop: 6 },
  row: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: {
    flex: 1,
    backgroundColor: C.card,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primary: { backgroundColor: C.accent, borderColor: C.accent },
  btnText: { color: C.text, fontWeight: '600' },
  note: { color: C.muted, fontSize: 12.5, lineHeight: 18, marginTop: 24 },
});
