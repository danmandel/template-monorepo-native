import { Drawer } from 'expo-router/drawer';
import { StyleSheet, View } from 'react-native';

import { ChatOverlay } from '@/components/chat';
import { EntityDrawerContent } from '@/components/drawer';
import { useThemedColors } from '@/lib/utils';

export const DrawerLayout = () => {
  const colors = useThemedColors();

  return (
    <View style={styles.rootContainer}>
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: colors.backgroundSecondary,
            width: 280
          },
          drawerType: 'front',
          swipeEnabled: true
        }}
        drawerContent={(props) => <EntityDrawerContent {...props} />}
      >
        <Drawer.Screen name='(tabs)' options={{ headerShown: false }} />
        <Drawer.Screen name='apps/calendar' options={{ headerShown: false }} />
        <Drawer.Screen name='apps/schedules' options={{ headerShown: false }} />
        <Drawer.Screen name='apps/notes' options={{ headerShown: false }} />
        <Drawer.Screen name='apps/calculator' options={{ headerShown: false }} />
        <Drawer.Screen name='apps/settings' options={{ headerShown: false }} />
      </Drawer>
      <ChatOverlay />
    </View>
  );
};

export default DrawerLayout;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1
  }
});
