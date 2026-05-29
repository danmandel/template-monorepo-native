import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  type TextStyle,
  View
} from 'react-native';

import { Text } from '@/components/Themed';
import { Icon } from '@/components/ui/Icon';
import { useSelectedDate } from '@/contexts';
import { useThemedColors } from '@/lib/utils';

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const formatDate = (date: Date) => {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const day = ordinal(date.getDate());
  return `${weekday}, ${month} ${day}`;
};

export const DateHeader = ({ style }: { style?: StyleProp<TextStyle> }) => {
  const colors = useThemedColors();
  const { selectedDate, showDatePicker, setShowDatePicker } = useSelectedDate();

  return (
    <Pressable onPress={() => setShowDatePicker(!showDatePicker)} style={styles.pressable}>
      <Text style={[styles.date, { color: colors.text }, style]}>{formatDate(selectedDate)}</Text>
      <Icon
        name='chevron-down'
        size={10}
        color={colors.textMuted}
        style={showDatePicker ? styles.chevronOpen : undefined}
      />
    </Pressable>
  );
};

export const DatePickerPanel = () => {
  const { selectedDate, setSelectedDate, setShowDatePicker } = useSelectedDate();

  const handleDateChange = (_event: unknown, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    setShowDatePicker(false);
  };

  return (
    <View style={styles.pickerContainer}>
      <DateTimePicker
        value={selectedDate}
        mode='date'
        display={Platform.OS === 'ios' ? 'inline' : 'default'}
        onChange={handleDateChange}
        themeVariant='dark'
      />
    </View>
  );
};

const styles = StyleSheet.create({
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4
  },
  date: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }]
  },
  pickerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
