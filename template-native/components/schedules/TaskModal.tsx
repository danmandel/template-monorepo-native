import { Icon } from '@/components/ui/Icon';
import { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useThemedColors } from '@/lib/utils';
import type { ScheduleTask, TaskCategory } from '@/lib/schedules';

const CATEGORIES: { value: TaskCategory; label: string; icon: string; color: string }[] = [
  { value: 'health', label: 'Health', icon: 'heart', color: '#10b981' },
  { value: 'fitness', label: 'Fitness', icon: 'bicycle', color: '#3b82f6' },
  { value: 'work', label: 'Work', icon: 'briefcase', color: '#8b5cf6' },
  { value: 'finance', label: 'Finance', icon: 'dollar', color: '#f59e0b' },
  { value: 'personal', label: 'Personal', icon: 'user', color: '#ec4899' },
  { value: 'other', label: 'Other', icon: 'circle', color: '#6b7280' }
];

const DURATION_PRESETS = [5, 10, 15, 30, 45, 60, 90, 120];

type TaskModalProps = {
  visible: boolean;
  task?: ScheduleTask | null;
  onClose: () => void;
  onSave: (data: {
    timeOfDay: string;
    title: string;
    duration?: number;
    category?: TaskCategory;
  }) => void;
};

export const TaskModal = ({ visible, task, onClose, onSave }: TaskModalProps) => {
  const insets = useSafeAreaInsets();
  const colors = useThemedColors();
  const isEditing = !!task;

  const [title, setTitle] = useState('');
  const [hours, setHours] = useState('08');
  const [minutes, setMinutes] = useState('00');
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState<TaskCategory | undefined>(undefined);

  useEffect(() => {
    if (visible) {
      if (task) {
        setTitle(task.title);
        const [h, m] = (task.timeOfDay ?? '08:00').split(':');
        setHours(h);
        setMinutes(m);
        setDuration(task.duration);
        setCategory(task.category);
      } else {
        setTitle('');
        setHours('08');
        setMinutes('00');
        setDuration(undefined);
        setCategory(undefined);
      }
    }
  }, [visible, task]);

  const handleSave = () => {
    if (!title.trim()) return;
    const timeOfDay = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    onSave({
      timeOfDay,
      title: title.trim(),
      duration,
      category
    });
  };

  const formatDuration = (mins: number): string => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const canSave = title.trim().length > 0;

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={[styles.closeText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isEditing ? 'Edit Task' : 'New Task'}
          </Text>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: canSave ? colors.tint : `${colors.tint}40` }
            ]}
            onPress={handleSave}
            disabled={!canSave}
          >
            <Text style={[styles.saveText, { opacity: canSave ? 1 : 0.5 }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps='handled'
        >
          {/* Title Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TASK *</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                  color: colors.text
                }
              ]}
              placeholder='What do you need to do?'
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              autoCapitalize='sentences'
              autoCorrect
            />
          </View>

          {/* Time Picker */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TIME</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeInputGroup}>
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                      color: colors.text
                    }
                  ]}
                  placeholder='08'
                  placeholderTextColor={colors.textMuted}
                  value={hours}
                  onChangeText={(t) => {
                    const num = t.replace(/\D/g, '').slice(0, 2);
                    if (!num || parseInt(num, 10) <= 23) setHours(num);
                  }}
                  keyboardType='number-pad'
                  maxLength={2}
                />
                <Text style={[styles.timeLabel, { color: colors.textMuted }]}>Hours</Text>
              </View>
              <Text style={[styles.timeSeparator, { color: colors.text }]}>:</Text>
              <View style={styles.timeInputGroup}>
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                      color: colors.text
                    }
                  ]}
                  placeholder='00'
                  placeholderTextColor={colors.textMuted}
                  value={minutes}
                  onChangeText={(t) => {
                    const num = t.replace(/\D/g, '').slice(0, 2);
                    if (!num || parseInt(num, 10) <= 59) setMinutes(num);
                  }}
                  keyboardType='number-pad'
                  maxLength={2}
                />
                <Text style={[styles.timeLabel, { color: colors.textMuted }]}>Minutes</Text>
              </View>
            </View>
          </View>

          {/* Duration */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              DURATION (optional)
            </Text>
            <View style={styles.durationGrid}>
              {DURATION_PRESETS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.durationOption,
                    {
                      backgroundColor: duration === d ? `${colors.tint}20` : colors.card,
                      borderColor: duration === d ? colors.tint : colors.border
                    }
                  ]}
                  onPress={() => setDuration(duration === d ? undefined : d)}
                >
                  <Text
                    style={[
                      styles.durationText,
                      { color: duration === d ? colors.tint : colors.text }
                    ]}
                  >
                    {formatDuration(d)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              CATEGORY (optional)
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor: category === c.value ? `${c.color}20` : colors.card,
                      borderColor: category === c.value ? c.color : colors.border
                    }
                  ]}
                  onPress={() => setCategory(category === c.value ? undefined : c.value)}
                >
                  <Icon
                    name={c.icon}
                    size={16}
                    color={category === c.value ? c.color : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      { color: category === c.value ? c.color : colors.text }
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 4
  },
  closeText: {
    fontSize: 16
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600'
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16
  },
  saveText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600'
  },
  content: {
    flex: 1
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  timeInputGroup: {
    alignItems: 'center',
    gap: 4
  },
  timeInput: {
    width: 64,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center'
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '500'
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 18
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  durationOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500'
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500'
  }
});
