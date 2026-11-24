import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLang } from '../i18n';
import { C } from '../theme';

export default function ScreenHeader({ title }: { title: string }) {
  const { lang, setLang } = useLang();
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.bar}>
        <Text style={styles.title}>{title}</Text>
        <Pressable
          style={styles.langBtn}
          hitSlop={10}
          onPress={() => setLang(lang === 'vi' ? 'en' : 'vi')}
        >
          <Text style={styles.langText}>{lang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: C.bg },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10, paddingTop: 6 },
  title: { color: C.text, fontSize: 22, fontWeight: '700' },
  langBtn: { borderColor: C.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: C.card },
  langText: { color: C.text, fontSize: 13, fontWeight: '600' },
});
