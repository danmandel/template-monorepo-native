import { Icon } from '@/components/ui/Icon';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import {
  getScheduleDescription,
  getScheduleEmoji,
  getScheduleMode,
  getScheduleTitle,
  getScheduleTodoDefs,
  type Schedule
} from '@/lib/schedules';

type ScheduleListProps = {
  schedules: Schedule[];
  selectedId?: string | null;
  colors: typeof Colors.dark;
  onSelect: (schedule: Schedule) => void;
  onEdit: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
  onDuplicate: (schedule: Schedule) => void;
  getProgress?: (scheduleId: string) => { completed: number; total: number; percentage: number };
};

export const ScheduleList = ({
  schedules,
  selectedId,
  colors,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  getProgress
}: ScheduleListProps) => {
  const renderItem = ({ item }: { item: Schedule }) => {
    const isSelected = item.id === selectedId;
    const progress = getProgress?.(item.id);
    const emoji = getScheduleEmoji(item);
    const description = getScheduleDescription(item);
    const todoDefs = getScheduleTodoDefs(item);

    return (
      <TouchableOpacity
        style={[
          styles.scheduleItem,
          {
            backgroundColor: isSelected ? `${colors.tint}15` : colors.card,
            borderColor: isSelected ? colors.tint : colors.border
          }
        ]}
        onPress={() => onSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.scheduleMain}>
          <View style={styles.scheduleHeader}>
            {emoji && <Text style={styles.emoji}>{emoji}</Text>}
            <View style={styles.titleContainer}>
              <Text style={[styles.scheduleName, { color: colors.text }]} numberOfLines={1}>
                {getScheduleTitle(item)}
              </Text>
              {item.isActive && (
                <View style={[styles.activeBadge, { backgroundColor: `${colors.positive}20` }]}>
                  <Text style={[styles.activeBadgeText, { color: colors.positive }]}>Active</Text>
                </View>
              )}
            </View>
          </View>

          {description && (
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>
              {description}
            </Text>
          )}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name='list' size={12} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {todoDefs.length} task{todoDefs.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name='clock-o' size={12} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {getScheduleMode(item) === 'sequence' ? 'Sequence' : 'Day'}
              </Text>
            </View>

            {progress && progress.total > 0 && (
              <View style={styles.metaItem}>
                <Icon name='check-circle' size={12} color={colors.positive} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {progress.completed}/{progress.total} ({progress.percentage}%)
                </Text>
              </View>
            )}
          </View>

          {progress && progress.total > 0 && (
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.positive,
                    width: `${progress.percentage}%`
                  }
                ]}
              />
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${colors.tint}15` }]}
            onPress={() => onEdit(item)}
          >
            <Icon name='pencil' size={14} color={colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${colors.textMuted}15` }]}
            onPress={() => onDuplicate(item)}
          >
            <Icon name='copy' size={14} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${colors.negative}15` }]}
            onPress={() => onDelete(item)}
          >
            <Icon name='trash' size={14} color={colors.negative} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (schedules.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Icon name='calendar-o' size={48} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No schedules yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          Create your first schedule to get started
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={schedules}
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
    gap: 12
  },
  scheduleItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 12
  },
  scheduleMain: {
    flex: 1,
    gap: 6
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  emoji: {
    fontSize: 24
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1
  },
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '600'
  },
  description: {
    fontSize: 13
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  metaText: {
    fontSize: 12
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 2
  },
  actions: {
    justifyContent: 'center',
    gap: 8
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 12
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32
  }
});
