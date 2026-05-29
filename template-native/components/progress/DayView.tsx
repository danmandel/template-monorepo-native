import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import type { Todo } from '@/lib/todos';
import { useThemedColors, useTimeFormatter } from '@/lib/utils';

type DayViewProps = {
  todos: Todo[];
  selectedDate: Date;
  streak?: number;
};

const getStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export const DayView = ({ todos, selectedDate, streak = 0 }: DayViewProps) => {
  const colors = useThemedColors();
  const { formatTimestamp } = useTimeFormatter();

  const dayStart = getStartOfDay(selectedDate);
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;

  // Filter todos for the selected day
  const dayTodos = useMemo(() => {
    return todos.filter((t) => {
      const relevantTime = t.completedAt ?? t.scheduledAt ?? t.createdAt;
      return relevantTime >= dayStart && relevantTime < dayEnd;
    });
  }, [todos, dayStart, dayEnd]);

  const stats = useMemo(() => {
    const completed = dayTodos.filter((t) => t.completedAt).length;
    const total = dayTodos.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Group by priority
    const byPriority = {
      high: dayTodos.filter((t) => t.priority === 'high'),
      medium: dayTodos.filter((t) => t.priority === 'medium'),
      low: dayTodos.filter((t) => t.priority === 'low')
    };

    // Completed tasks with times
    const completedTasks = dayTodos
      .filter((t) => t.completedAt)
      .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));

    return { completed, total, completionRate, byPriority, completedTasks };
  }, [dayTodos]);

  const priorityColors = {
    high: colors.negative,
    medium: colors.warning,
    low: colors.positive
  };

  return (
    <View style={styles.container}>
      {/* Main Stats - Clean minimal cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.completed}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Done</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.total - stats.completed}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Left</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statValue, { color: colors.tint }]}>{stats.completionRate}%</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Rate</Text>
        </View>
      </View>

      {/* Streak Card - Refined */}
      <View style={[styles.streakCard, { backgroundColor: colors.card }]}>
        <View style={styles.streakContent}>
          <View style={styles.streakInfo}>
            <Text
              style={[
                styles.streakValue,
                { color: streak > 0 ? colors.warning : colors.textMuted }
              ]}
            >
              {streak}
            </Text>
            <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>day streak</Text>
          </View>
        </View>
        <Text style={[styles.streakHint, { color: colors.textMuted }]}>
          {streak === 0
            ? 'Complete a task to start'
            : streak === 1
              ? 'Keep going tomorrow'
              : `${streak} days in a row`}
        </Text>
      </View>

      {/* Priority Breakdown - Simplified */}
      <View style={[styles.breakdownCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Priority</Text>
        <View style={styles.priorityRows}>
          {(['high', 'medium', 'low'] as const).map((priority) => {
            const tasks = stats.byPriority[priority];
            const completed = tasks.filter((t) => t.completedAt).length;
            const total = tasks.length;
            const percentage = total > 0 ? (completed / total) * 100 : 0;

            return (
              <View key={priority} style={styles.priorityRow}>
                <View style={styles.priorityLabel}>
                  <View
                    style={[styles.priorityDot, { backgroundColor: priorityColors[priority] }]}
                  />
                  <Text style={[styles.priorityText, { color: colors.textSecondary }]}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </View>
                <View style={styles.priorityBar}>
                  <View
                    style={[
                      styles.priorityBarTrack,
                      { backgroundColor: colors.backgroundSecondary }
                    ]}
                  >
                    <View
                      style={[
                        styles.priorityBarFill,
                        { backgroundColor: priorityColors[priority], width: `${percentage}%` }
                      ]}
                    />
                  </View>
                </View>
                <Text style={[styles.priorityCount, { color: colors.textMuted }]}>
                  {completed}/{total}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Timeline - Simplified */}
      {stats.completedTasks.length > 0 && (
        <View style={[styles.timelineCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Day</Text>
          <View style={styles.timeline}>
            {stats.completedTasks.map((task) => (
              <View key={task.id} style={styles.timelineItem}>
                <Text style={[styles.timelineTime, { color: colors.textMuted }]}>
                  {formatTimestamp(task.completedAt!)}
                </Text>
                <View style={[styles.timelineDot, { backgroundColor: colors.positive }]} />
                <Text
                  style={[styles.timelineTitle, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Empty State - Minimal */}
      {stats.total === 0 && (
        <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No tasks for this day</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderCurve: 'continuous'
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: -0.2
  },
  streakCard: {
    borderRadius: 12,
    padding: 16,
    borderCurve: 'continuous'
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6
  },
  streakValue: {
    fontSize: 36,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1
  },
  streakLabel: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2
  },
  streakHint: {
    fontSize: 13,
    marginTop: 8,
    letterSpacing: -0.2
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: -0.3
  },
  breakdownCard: {
    borderRadius: 12,
    padding: 16,
    borderCurve: 'continuous'
  },
  priorityRows: {
    gap: 10
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  priorityLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 72
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.2
  },
  priorityBar: {
    flex: 1
  },
  priorityBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden'
  },
  priorityBarFill: {
    height: '100%',
    borderRadius: 3
  },
  priorityCount: {
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    width: 36,
    textAlign: 'right',
    letterSpacing: -0.2
  },
  timelineCard: {
    borderRadius: 12,
    padding: 16,
    borderCurve: 'continuous'
  },
  timeline: {
    gap: 8
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  timelineTime: {
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    width: 52,
    letterSpacing: -0.2
  },
  timelineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5
  },
  timelineTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.2
  },
  emptyCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderCurve: 'continuous'
  },
  emptyText: {
    fontSize: 14,
    letterSpacing: -0.2
  }
});
