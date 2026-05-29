import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import type { ScheduleFrequency } from '@/lib/schedules';
import type { Tag, Todo } from '@/lib/todos';
import { useThemedColors, useTimeFormatter } from '@/lib/utils';

type TodoCardProps = {
  todo: Todo;
  onToggleComplete: () => void;
  onEdit: () => void;
  showCompletionInfo?: boolean; // Show completion time and diff (for Done tab)
  tags?: Tag[]; // Tags to display (filtered to this todo's tag IDs)
};

// Badge colors and labels for each frequency
const FREQUENCY_CONFIG: Record<ScheduleFrequency, { label: string; color: string }> = {
  daily: { label: 'Daily', color: '#34C759' }, // green
  weekly: { label: 'Weekly', color: '#007AFF' }, // blue
  monthly: { label: 'Monthly', color: '#AF52DE' }, // purple
  yearly: { label: 'Yearly', color: '#FF9500' } // orange
};

// Format time difference like a speedrun split: +5m, -2m, +1h 23m
const formatTimeDiff = (scheduledAt: number, completedAt: number) => {
  const diffMs = completedAt - scheduledAt;
  const diffMinutes = Math.round(diffMs / 60000);
  const isLate = diffMinutes > 0;
  const absMinutes = Math.abs(diffMinutes);

  if (absMinutes === 0) {
    return { text: '±0', isLate: false, isEarly: false, isOnTime: true };
  }

  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;

  let text: string;
  if (hours > 0 && mins > 0) {
    text = `${hours}h ${mins}m`;
  } else if (hours > 0) {
    text = `${hours}h`;
  } else {
    text = `${mins}m`;
  }

  return {
    text: isLate ? `+${text}` : `-${text}`,
    isLate,
    isEarly: !isLate,
    isOnTime: false
  };
};

export const TodoCard = ({
  todo,
  onToggleComplete,
  onEdit,
  showCompletionInfo,
  tags
}: TodoCardProps) => {
  const colors = useThemedColors();
  const { formatTimestamp } = useTimeFormatter();

  const isDone = Boolean(todo.completedAt);
  const timeText = todo.scheduledAt ? formatTimestamp(todo.scheduledAt) : null;

  // Calculate completion diff for done items with scheduled times
  const completionInfo =
    showCompletionInfo && isDone && todo.scheduledAt && todo.completedAt
      ? formatTimeDiff(todo.scheduledAt, todo.completedAt)
      : null;

  const completedTimeText =
    showCompletionInfo && todo.completedAt ? formatTimestamp(todo.completedAt) : null;

  // Get frequency from todo itself or from schedule source
  const todoFrequency = todo.frequency ?? todo.scheduleSource?.scheduleFrequency;

  // Indicator color: subtle hierarchy based on state
  const getIndicatorColor = () => {
    if (isDone) return colors.positive;
    if (todoFrequency) {
      return FREQUENCY_CONFIG[todoFrequency].color;
    }
    // Subtle priority indication
    return todo.priority === 'high'
      ? colors.negative
      : todo.priority === 'medium'
        ? colors.warning
        : colors.textMuted;
  };

  return (
    <Pressable
      onPress={onToggleComplete}
      onLongPress={onEdit}
      delayLongPress={400}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.6 : 1 }]}
    >
      {/* Time column */}
      <View style={styles.timeColumn}>
        {timeText && (
          <Text style={[styles.time, { color: isDone ? colors.textMuted : colors.textSecondary }]}>
            {timeText}
          </Text>
        )}
      </View>

      {/* Minimal indicator */}
      <View
        style={[
          styles.indicator,
          {
            backgroundColor: getIndicatorColor(),
            opacity: isDone ? 0.6 : 1
          }
        ]}
      />

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: isDone ? colors.textMuted : colors.text,
              textDecorationLine: isDone ? 'line-through' : 'none'
            }
          ]}
          numberOfLines={2}
        >
          {todo.title}
        </Text>
        {tags && tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map((tag) => (
              <View key={tag.id} style={[styles.tagBadge, { backgroundColor: `${tag.color}18` }]}>
                <Text style={[styles.tagText, { color: tag.color }]}>{tag.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Completion info (shown in Done tab) */}
      {showCompletionInfo && isDone && (
        <View style={styles.completionColumn}>
          {completedTimeText && (
            <Text style={[styles.completedTime, { color: colors.textMuted }]}>
              {completedTimeText}
            </Text>
          )}
          {completionInfo && (
            <Text
              style={[
                styles.timeDiff,
                {
                  color:
                    completionInfo.isOnTime || completionInfo.isEarly
                      ? colors.positive
                      : colors.negative
                }
              ]}
            >
              {completionInfo.text}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingRight: 20
  },
  timeColumn: {
    width: 86,
    paddingLeft: 8,
    paddingRight: 12,
    alignItems: 'flex-end'
  },
  time: {
    fontSize: 14,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
    textAlign: 'right'
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 12
  },
  content: {
    flex: 1,
    gap: 4
  },
  title: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 23,
    letterSpacing: -0.2
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderCurve: 'continuous'
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1
  },
  completionColumn: {
    alignItems: 'flex-end',
    marginLeft: 12,
    minWidth: 48
  },
  completedTime: {
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2
  },
  timeDiff: {
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.1,
    marginTop: 2
  }
});
