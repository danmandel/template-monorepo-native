import { Icon } from '@/components/ui/Icon';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useThemedColors } from '@/lib/utils';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showMenu?: boolean;
};

export const ScreenHeader = ({
  title,
  subtitle,
  showBack = true,
  showMenu = true
}: ScreenHeaderProps) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemedColors();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 12,
          backgroundColor: colors.backgroundSecondary,
          borderBottomColor: colors.border
        }
      ]}
    >
      <View style={styles.row}>
        {showBack && (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Icon name='arrow-left' size={18} color={colors.text} />
          </TouchableOpacity>
        )}

        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          )}
        </View>

        {showMenu && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Icon name='bars' size={18} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  titleBlock: {
    flex: 1
  },
  title: {
    fontSize: 20,
    fontWeight: '700'
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600'
  },
  menuButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  }
});
