import { Icon } from '@/components/ui/Icon';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import type { ScheduleTask, TaskCategory, TaskStatus } from '@/lib/schedules';
import { useTimeFormatter } from '@/lib/utils';

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  health: '#10b981', // emerald
  fitness: '#3b82f6', // blue
  work: '#8b5cf6', // violet
  finance: '#f59e0b', // amber
  personal: '#ec4899', // pink
  other: '#6b7280' // gray
};

const CATEGORY_ICONS: Record<TaskCategory, string> = {
  health: 'heart',
  fitness: 'bicycle',
  work: 'briefcase',
  finance: 'dollar',
  personal: 'user',
  other: 'circle'
};

type TaskListProps = {
  tasks: ScheduleTask[];
  colors: typeof Colors.dark;
  getTaskStatus: (taskId: string) => TaskStatus;
  onToggleStatus: (taskId: string) => void;
  onEdit: (task: ScheduleTask) => void;
  onDelete: (task: ScheduleTask) => void;
};

export const TaskList = ({
  tasks,
  colors,
  getTaskStatus,
  onToggleStatus,
  onEdit,
  onDelete
}: TaskListProps) => {
  const { formatStoredTime } = useTimeFormatter();

  const formatDuration = (minutes?: number): string | null => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const renderItem = ({ item }: { item: ScheduleTask }) => {
    const status = getTaskStatus(item.id);
    const isCompleted = status === 'completed';
    const isSkipped = status === 'skipped';
    const categoryColor = item.category ? CATEGORY_COLORS[item.category] : colors.textMuted;
    const categoryIcon = item.category ? CATEGORY_ICONS[item.category] : 'circle';
    const duration = formatDuration(item.duration);

    return (
      <View
        style={[
          styles.taskItem,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: isSkipped ? 0.5 : 1
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.checkbox,
            {
              borderColor: isCompleted ? colors.positive : colors.border,
              backgroundColor: isCompleted ? colors.positive : 'transparent'
            }
          ]}
          onPress={() => onToggleStatus(item.id)}
          activeOpacity={0.7}
        >
          {isCompleted && <Icon name='check' size={12} color='#fff' />}
        </TouchableOpacity>

        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text style={[styles.taskTime, { color: colors.tint }]}>
              {formatStoredTime(item.timeOfDay ?? '00:00', {
                meridiemCase: 'upper',
                includeSpaceBeforeMeridiem: true
              })}
            </Text>
            {duration && (
              <View style={[styles.durationBadge, { backgroundColor: `${colors.textMuted}20` }]}>
                <Icon name='clock-o' size={10} color={colors.textMuted} />
                <Text style={[styles.durationText, { color: colors.textMuted }]}>{duration}</Text>
              </View>
            )}
          </View>

          <Text
            style={[
              styles.taskTitle,
              {
                color: colors.text,
                textDecorationLine: isCompleted ? 'line-through' : 'none'
              }
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {item.category && (
            <View style={styles.categoryRow}>
              <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}>
                <Icon name={categoryIcon} size={10} color={categoryColor} />
                <Text style={[styles.categoryText, { color: categoryColor }]}>{item.category}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${colors.tint}15` }]}
            onPress={() => onEdit(item)}
          >
            <Icon name='pencil' size={12} color={colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${colors.negative}15` }]}
            onPress={() => onDelete(item)}
          >
            <Icon name='trash' size={12} color={colors.negative} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Icon name='tasks' size={40} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No tasks yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          Add tasks to build your schedule
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    gap: 10
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 12
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  taskContent: {
    flex: 1,
    gap: 4
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  taskTime: {
    fontSize: 13,
    fontWeight: '600'
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  durationText: {
    fontSize: 11
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500'
  },
  categoryRow: {
    flexDirection: 'row',
    marginTop: 4
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  actions: {
    flexDirection: 'row',
    gap: 6
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center'
  }
});
