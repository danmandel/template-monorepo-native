import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useThemedColors } from '@/lib/utils';

export const CalculatorAppScreen = () => {
  const colors = useThemedColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title='Calculator' subtitle='Position sizing & risk' />
      <View style={styles.content}>
        <Text style={[styles.placeholder, { color: colors.textMuted }]}>
          Calculator coming soon
        </Text>
      </View>
    </View>
  );
};

export default CalculatorAppScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  placeholder: {
    fontSize: 15,
    fontWeight: '600'
  }
});
