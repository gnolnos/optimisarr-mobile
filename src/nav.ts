import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Tabs: undefined;
  JobDetail: { jobId: number };
};

export type TabParamList = {
  Status: undefined;
  Jobs: undefined;
  Approve: undefined;
  Workers: undefined;
  Settings: undefined;
};

export type JobsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Jobs'>,
  NativeStackScreenProps<RootStackParamList>
>;
