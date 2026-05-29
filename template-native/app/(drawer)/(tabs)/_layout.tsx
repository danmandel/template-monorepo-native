import { Tabs } from 'expo-router';

import { LiquidTabBar } from '@/components/navigation';

export const TabsLayout = () => {
  return (
    <Tabs
      tabBar={(props) => <LiquidTabBar {...props} />}
      screenOptions={{
        headerShown: false
      }}
    >
      <Tabs.Screen
        name='home'
        options={{
          title: 'Todos'
        }}
      />
      <Tabs.Screen
        name='dashboard'
        options={{
          title: 'Progress'
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile'
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
