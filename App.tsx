import { NavigationContainer, DefaultTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import type { RootStackParamList, TabParamList } from './src/nav';
import { C } from './src/theme';

import StatusScreen from './src/screens/StatusScreen';
import JobsScreen from './src/screens/JobsScreen';
import ApproveScreen from './src/screens/ApproveScreen';
import WorkersScreen from './src/screens/WorkersScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import JobDetailScreen from './src/screens/JobDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: C.accent,
    background: C.bg,
    card: C.card,
    text: C.text,
    border: C.border,
    notification: C.accent,
  },
  fonts: DefaultTheme.fonts,
};

function TabIcon({ label }: { label: string }) {
  return <Text style={{ fontSize: 17, color: C.text }}>{label}</Text>;
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: C.card, borderTopColor: C.border },
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,
      }}
    >
      <Tab.Screen name="Status" component={StatusScreen} options={{ tabBarIcon: () => <TabIcon label="●" /> }} />
      <Tab.Screen name="Jobs" component={JobsScreen} options={{ tabBarIcon: () => <TabIcon label="▤" /> }} />
      <Tab.Screen name="Approve" component={ApproveScreen} options={{ tabBarIcon: () => <TabIcon label="✓" /> }} />
      <Tab.Screen name="Workers" component={WorkersScreen} options={{ tabBarIcon: () => <TabIcon label="🖥" /> }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: () => <TabIcon label="⚙" /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer theme={darkTheme}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: C.card }, headerTintColor: C.text }}>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Chi tiết job' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
