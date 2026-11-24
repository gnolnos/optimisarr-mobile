import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_BASE = 'opti.baseUrl';
const KEY_TOKEN = 'opti.token';
const KEY_MODE = 'opti.netMode';

export type NetMode = 'internal' | 'external';

export async function getMode(): Promise<NetMode> {
  return (await AsyncStorage.getItem(KEY_MODE)) === 'external' ? 'external' : 'internal';
}

export async function setMode(mode: NetMode): Promise<void> {
  await AsyncStorage.setItem(KEY_MODE, mode);
}

export async function getBaseUrl(): Promise<string> {
  const stored = await AsyncStorage.getItem(KEY_BASE);
  const v = (stored ?? '').trim();
  return v.endsWith('/') ? v.slice(0, -1) : v;
}

export async function setBaseUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEY_BASE, url.trim());
}

export async function getToken(): Promise<string> {
  return (await AsyncStorage.getItem(KEY_TOKEN)) ?? '';
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(KEY_TOKEN, token.trim());
}

export async function isConfigured(): Promise<boolean> {
  return (await getBaseUrl()).length > 0;
}
