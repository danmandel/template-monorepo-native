import { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useThemedColors } from '@/lib/utils';
import {
  getScheduleDescription,
  getScheduleEmoji,
  getScheduleMode,
  getScheduleTitle,
  type Schedule,
  type ScheduleMode
} from '@/lib/schedules';

const EMOJI_OPTIONS = ['☀️', '🌙', '💪', '📚', '💼', '🏃', '🧘', '🎯', '⭐', '🔥', '💡', '🚀'];

type ScheduleModalProps = {
  visible: boolean;
  schedule?: Schedule | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    emoji?: string;
    description?: string;
    mode: ScheduleMode;
    isActive: boolean;
  }) => void;
};

export const ScheduleModal = ({ visible, schedule, onClose, onSave }: ScheduleModalProps) => {
  const insets = useSafeAreaInsets();
  const colors = useThemedColors();
  const isEditing = !!schedule;

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<ScheduleMode>('day');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (visible) {
      if (schedule) {
        setName(getScheduleTitle(schedule));
        setEmoji(getScheduleEmoji(schedule));
        setDescription(getScheduleDescription(schedule) ?? '');
        setMode(getScheduleMode(schedule));
        setIsActive(schedule.isActive);
      } else {
        setName('');
        setEmoji(undefined);
        setDescription('');
        setMode('day');
        setIsActive(true);
      }
    }
  }, [visible, schedule]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      title: name.trim(),
      emoji,
      description: description.trim() || undefined,
      mode,
      isActive
    });
  };

  const canSave = name.trim().length > 0;

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
            {isEditing ? 'Edit Schedule' : 'New Schedule'}
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
          {/* Emoji Picker */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ICON</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[
                    styles.emojiOption,
                    {
                      backgroundColor: emoji === e ? `${colors.tint}20` : colors.card,
                      borderColor: emoji === e ? colors.tint : colors.border
                    }
                  ]}
                  onPress={() => setEmoji(emoji === e ? undefined : e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Name Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>NAME *</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                  color: colors.text
                }
              ]}
              placeholder='e.g., Morning Routine'
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize='words'
              autoCorrect={false}
            />
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DESCRIPTION</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                  color: colors.text
                }
              ]}
              placeholder='What is this schedule for?'
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical='top'
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TYPE</Text>
            <View style={[styles.segmentedControl, { backgroundColor: colors.card }]}>
              {[
                { value: 'day' as const, label: 'Day' },
                { value: 'sequence' as const, label: 'Sequence' }
              ].map((option) => {
                const selected = mode === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.segment,
                      { backgroundColor: selected ? colors.tint : 'transparent' }
                    ]}
                    onPress={() => setMode(option.value)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: selected ? '#000' : colors.textSecondary }
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Active Toggle */}
          <View style={styles.section}>
            <View
              style={[
                styles.toggleRow,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
            >
              <View style={styles.toggleContent}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Active Schedule</Text>
                <Text style={[styles.toggleDescription, { color: colors.textMuted }]}>
                  When active, this schedule will be used for daily tracking
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: colors.border, true: colors.positive }}
                thumbColor='#fff'
              />
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
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emojiText: {
    fontSize: 24
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600'
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 12
  },
  toggleContent: {
    flex: 1
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2
  },
  toggleDescription: {
    fontSize: 13
  }
});
