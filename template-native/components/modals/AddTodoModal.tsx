import DateTimePicker from '@react-native-community/datetimepicker';

import { Icon } from '@/components/ui/Icon';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { TagSelector } from '@/components/modals/TagSelector';
import { useAddTodoModal } from '@/contexts';
import type { ScheduleFrequency } from '@/lib/schedules';
import { useThemedColors, useTimeFormatter } from '@/lib/utils';

const nextPriority = {
  low: 'medium',
  medium: 'high',
  high: 'low'
} as const;

// Frequency options with colors
const FREQUENCY_OPTIONS: { value: ScheduleFrequency | null; label: string; color: string }[] = [
  { value: null, label: 'Once', color: '#8E8E93' },
  { value: 'daily', label: 'Daily', color: '#34C759' },
  { value: 'weekly', label: 'Weekly', color: '#007AFF' },
  { value: 'monthly', label: 'Monthly', color: '#AF52DE' },
  { value: 'yearly', label: 'Yearly', color: '#FF9500' }
];

// Generate completion time presets based on current time
const getCompletionTimePresets = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const presets: { hours: number; minutes: number }[] = [];

  // Show times around the current hour (±2 hours, every 30 min)
  for (let h = Math.max(0, currentHour - 2); h <= Math.min(23, currentHour + 1); h++) {
    presets.push({ hours: h, minutes: 0 });
    presets.push({ hours: h, minutes: 30 });
  }

  return presets;
};

// Common time presets
const TIME_PRESETS = [
  { hours: 6, minutes: 0 },
  { hours: 7, minutes: 0 },
  { hours: 8, minutes: 0 },
  { hours: 9, minutes: 0 },
  { hours: 10, minutes: 0 },
  { hours: 11, minutes: 0 },
  { hours: 12, minutes: 0 },
  { hours: 13, minutes: 0 },
  { hours: 14, minutes: 0 },
  { hours: 15, minutes: 0 },
  { hours: 16, minutes: 0 },
  { hours: 17, minutes: 0 },
  { hours: 18, minutes: 0 },
  { hours: 19, minutes: 0 },
  { hours: 20, minutes: 0 },
  { hours: 21, minutes: 0 }
];

const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const formatDate = (date: Date) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, tomorrow)) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const AddTodoModal = () => {
  const colors = useThemedColors();
  const insets = useSafeAreaInsets();
  const { formatHoursAndMinutes, formatTimestamp } = useTimeFormatter();
  const {
    isVisible,
    hide,
    title,
    setTitle,
    priority,
    setPriority,
    dueDate,
    setDueDate,
    scheduledTime,
    setScheduledTime,
    frequency,
    setFrequency,
    completedAt,
    setCompletedAt,
    selectedTagIds,
    setSelectedTagIds,
    availableTags,
    createTag,
    submit,
    deleteTodo,
    isSubmitting,
    editingTodo
  } = useAddTodoModal();

  const isEditing = Boolean(editingTodo);
  const isCompleted = completedAt !== null;
  const [showDatePicker, setShowDatePicker] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetMaxHeight = Dimensions.get('window').height - insets.top - 16;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start(() => {
        if (Platform.OS !== 'ios') {
          inputRef.current?.focus();
        }
      });
    } else {
      slideAnim.setValue(400);
      backdropAnim.setValue(0);
    }
  }, [isVisible, slideAnim, backdropAnim]);

  const handleClose = () => {
    setShowDatePicker(false);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      hide();
    });
  };

  const priorityColor =
    priority === 'high'
      ? colors.negative
      : priority === 'medium'
        ? colors.warning
        : colors.textMuted;

  const canSubmit = title.trim().length > 0 && !isSubmitting;
  const showTimeSelector = dueDate !== null;

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleTimeSelect = (hours: number, minutes: number) => {
    if (scheduledTime?.hours === hours && scheduledTime?.minutes === minutes) {
      setScheduledTime(null);
    } else {
      setScheduledTime({ hours, minutes });
    }
  };

  const handleClearDate = () => {
    setDueDate(null);
    setScheduledTime(null);
    setShowDatePicker(false);
  };

  return (
    <Modal visible={isVisible} transparent animationType='none' onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'android' ? 'height' : undefined}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5]
                })
              }
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              maxHeight: sheetMaxHeight,
              paddingBottom: insets.bottom + 24,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {isEditing ? 'Edit task' : 'New task'}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            >
              <Icon name='times' size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >
            <View style={[styles.inputContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <TextInput
                ref={inputRef}
                value={title}
                onChangeText={setTitle}
                placeholder='What needs to be done?'
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text }]}
                returnKeyType='done'
                onSubmitEditing={() => void submit()}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.options}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: dueDate ? colors.tintMuted : colors.backgroundSecondary
                  }
                ]}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.chipText, { color: dueDate ? colors.tint : colors.textSecondary }]}
                >
                  {dueDate ? formatDate(dueDate) : 'Anytime'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPriority(nextPriority[priority])}
                style={[styles.chip, { backgroundColor: colors.backgroundSecondary }]}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <View style={styles.datePickerSection}>
                <View style={styles.dateQuickOptions}>
                  <TouchableOpacity
                    onPress={() => {
                      setDueDate(new Date());
                      if (Platform.OS === 'android') setShowDatePicker(false);
                    }}
                    style={[
                      styles.dateQuickChip,
                      {
                        backgroundColor:
                          dueDate && isSameDay(dueDate, new Date())
                            ? colors.tint
                            : colors.backgroundSecondary
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateQuickText,
                        {
                          color:
                            dueDate && isSameDay(dueDate, new Date())
                              ? '#000'
                              : colors.textSecondary
                        }
                      ]}
                    >
                      Today
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setDueDate(tomorrow);
                      if (Platform.OS === 'android') setShowDatePicker(false);
                    }}
                    style={[
                      styles.dateQuickChip,
                      {
                        backgroundColor: (() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          return dueDate && isSameDay(dueDate, tomorrow)
                            ? colors.tint
                            : colors.backgroundSecondary;
                        })()
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateQuickText,
                        {
                          color: (() => {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            return dueDate && isSameDay(dueDate, tomorrow)
                              ? '#000'
                              : colors.textSecondary;
                          })()
                        }
                      ]}
                    >
                      Tomorrow
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleClearDate}
                    style={[styles.dateQuickChip, { backgroundColor: colors.backgroundSecondary }]}
                  >
                    <Text style={[styles.dateQuickText, { color: colors.textSecondary }]}>
                      Clear
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={dueDate || new Date()}
                  mode='date'
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  themeVariant='dark'
                  style={styles.datePicker}
                />
              </View>
            )}

            {showTimeSelector && !showDatePicker && (
              <View style={styles.timeSection}>
                <Text style={[styles.timeLabel, { color: colors.textMuted }]}>Schedule time</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timeGrid}
                >
                  {TIME_PRESETS.map((preset) => {
                    const isSelected =
                      scheduledTime?.hours === preset.hours &&
                      scheduledTime?.minutes === preset.minutes;
                    return (
                      <TouchableOpacity
                        key={`${preset.hours}:${preset.minutes}`}
                        onPress={() => handleTimeSelect(preset.hours, preset.minutes)}
                        style={[
                          styles.timeChip,
                          {
                            backgroundColor: isSelected ? colors.tint : colors.backgroundSecondary,
                            borderColor: isSelected ? colors.tint : 'transparent'
                          }
                        ]}
                        disabled={isSubmitting}
                      >
                        <Text
                          style={[
                            styles.timeChipText,
                            { color: isSelected ? '#000' : colors.textSecondary }
                          ]}
                        >
                          {formatHoursAndMinutes(preset.hours, preset.minutes)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {!showDatePicker && (
              <View style={styles.frequencySection}>
                <Text style={[styles.timeLabel, { color: colors.textMuted }]}>Repeat</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timeGrid}
                >
                  {FREQUENCY_OPTIONS.map((option) => {
                    const isSelected = frequency === option.value;
                    return (
                      <TouchableOpacity
                        key={option.label}
                        onPress={() => setFrequency(option.value)}
                        style={[
                          styles.timeChip,
                          {
                            backgroundColor: isSelected ? option.color : colors.backgroundSecondary,
                            borderColor: isSelected ? option.color : 'transparent'
                          }
                        ]}
                        disabled={isSubmitting}
                      >
                        <Text
                          style={[
                            styles.timeChipText,
                            { color: isSelected ? '#fff' : colors.textSecondary }
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {!showDatePicker && (
              <TagSelector
                availableTags={availableTags}
                selectedTagIds={selectedTagIds}
                onToggleTag={(tagId) => {
                  if (selectedTagIds.includes(tagId)) {
                    setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
                  } else {
                    setSelectedTagIds([...selectedTagIds, tagId]);
                  }
                }}
                onCreateTag={createTag}
                disabled={isSubmitting}
              />
            )}

            {isEditing && isCompleted && !showDatePicker && (
              <View style={styles.completionSection}>
                <View style={styles.completionHeader}>
                  <Text style={[styles.completionLabel, { color: colors.textMuted }]}>
                    Completed at
                  </Text>
                  <TouchableOpacity
                    onPress={() => setCompletedAt(null)}
                    style={[styles.uncompleteButton, { borderColor: colors.negative }]}
                    disabled={isSubmitting}
                  >
                    <Icon name='undo' size={12} color={colors.negative} />
                    <Text style={[styles.uncompleteText, { color: colors.negative }]}>
                      Mark Incomplete
                    </Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timeGrid}
                >
                  {getCompletionTimePresets().map((preset) => {
                    const presetTime = new Date();
                    presetTime.setHours(preset.hours, preset.minutes, 0, 0);
                    const completedDate = completedAt ? new Date(completedAt) : null;
                    const isSelected =
                      completedDate?.getHours() === preset.hours &&
                      completedDate?.getMinutes() === preset.minutes;
                    return (
                      <TouchableOpacity
                        key={`${preset.hours}:${preset.minutes}`}
                        onPress={() => setCompletedAt(presetTime.getTime())}
                        style={[
                          styles.timeChip,
                          {
                            backgroundColor: isSelected
                              ? colors.positive
                              : colors.backgroundSecondary,
                            borderColor: isSelected ? colors.positive : 'transparent'
                          }
                        ]}
                        disabled={isSubmitting}
                      >
                        <Text
                          style={[
                            styles.timeChipText,
                            { color: isSelected ? '#000' : colors.textSecondary }
                          ]}
                        >
                          {formatHoursAndMinutes(preset.hours, preset.minutes)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {completedAt && (
                  <Text style={[styles.completedAtDisplay, { color: colors.textSecondary }]}>
                    {formatTimestamp(completedAt)}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              onPress={() => void submit()}
              style={[
                styles.submitButton,
                { backgroundColor: canSubmit ? colors.tint : colors.backgroundSecondary }
              ]}
              disabled={!canSubmit}
              activeOpacity={0.8}
            >
              <Text style={[styles.submitText, { color: canSubmit ? '#fff' : colors.textMuted }]}>
                {isSubmitting
                  ? isEditing
                    ? 'Saving...'
                    : 'Adding...'
                  : isEditing
                    ? 'Save'
                    : 'Add task'}
              </Text>
            </TouchableOpacity>

            {isEditing && (
              <TouchableOpacity
                onPress={() => void deleteTodo()}
                style={styles.deleteButton}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Text style={[styles.deleteText, { color: colors.negative }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000'
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderCurve: 'continuous'
  },
  handle: {
    width: 32,
    height: 4,
    backgroundColor: 'rgba(128,128,128,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  content: {
    flexGrow: 0
  },
  contentContainer: {
    paddingBottom: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3
  },
  closeButton: {
    padding: 8
  },
  inputContainer: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderCurve: 'continuous'
  },
  input: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2
  },
  options: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderCurve: 'continuous'
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  datePickerSection: {
    marginBottom: 16
  },
  dateQuickOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  dateQuickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderCurve: 'continuous'
  },
  dateQuickText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2
  },
  datePicker: {
    alignSelf: 'center'
  },
  timeSection: {
    marginBottom: 20
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
    letterSpacing: -0.2
  },
  timeGrid: {
    flexDirection: 'row',
    gap: 8
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
    borderCurve: 'continuous'
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2
  },
  frequencySection: {
    marginBottom: 20
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderCurve: 'continuous'
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2
  },
  completionSection: {
    marginBottom: 20
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  completionLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.2
  },
  uncompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderCurve: 'continuous'
  },
  uncompleteText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.2
  },
  completedAtDisplay: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: -0.2
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 4
  },
  deleteText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2
  }
});
