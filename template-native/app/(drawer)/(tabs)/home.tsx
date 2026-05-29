import { FireIcon } from 'react-native-heroicons/solid';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TodoCard } from '@/components/cards';
import { getLiquidTabBarContentInset } from '@/components/navigation';
import { Text } from '@/components/Themed';
import { DateHeader, DatePickerPanel } from '@/components/ui/DateHeader';
import {
  useAchievementBanner,
  useAddTodoModal,
  useSelectedDate,
  useStreakContext
} from '@/contexts';
import { getScheduleTodoDefs, shouldScheduleAppearOnDate, useSchedules } from '@/lib/schedules';
import type { Todo } from '@/lib/todos';
import { loadTodos, saveTodos } from '@/lib/todos';
import { useThemedColors, useTimeFormatter } from '@/lib/utils';

const createId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

const getScheduledTime = (hours: number, minutes: number, daysFromNow = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
};

const defaultTodos = (): Todo[] => {
  const now = Date.now();
  return [
    {
      id: createId(),
      title: 'Morning standup',
      priority: 'medium',
      createdAt: now - 1000 * 60 * 60 * 2,
      updatedAt: now - 1000 * 60 * 60 * 2,
      scheduledAt: getScheduledTime(9, 0)
    },
    {
      id: createId(),
      title: 'Review pull requests',
      priority: 'high',
      createdAt: now - 1000 * 60 * 60,
      updatedAt: now - 1000 * 60 * 60,
      scheduledAt: getScheduledTime(10, 0)
    },
    {
      id: createId(),
      title: 'Lunch with team',
      priority: 'low',
      createdAt: now - 1000 * 60 * 30,
      updatedAt: now - 1000 * 60 * 30,
      scheduledAt: getScheduledTime(12, 0)
    },
    {
      id: createId(),
      title: 'Client call',
      priority: 'high',
      createdAt: now - 1000 * 60 * 20,
      updatedAt: now - 1000 * 60 * 20,
      scheduledAt: getScheduledTime(14, 0)
    },
    {
      id: createId(),
      title: 'Write documentation',
      priority: 'medium',
      createdAt: now - 1000 * 60 * 15,
      updatedAt: now - 1000 * 60 * 15,
      scheduledAt: getScheduledTime(16, 0)
    },
    {
      id: createId(),
      title: 'Buy groceries',
      priority: 'low',
      createdAt: now - 1000 * 60 * 10,
      updatedAt: now - 1000 * 60 * 10
      // No scheduled time - appears at bottom
    }
  ];
};

const isSameDay = (timestamp: number, date: Date) => {
  const d = new Date(timestamp);
  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  );
};

// Convert schedule tasks to Todo format for a specific date
const convertScheduleTasksToTodos = (
  schedules: ReturnType<typeof useSchedules>['schedules'],
  getTaskStatus: ReturnType<typeof useSchedules>['getTaskStatus'],
  getTaskCompletion: ReturnType<typeof useSchedules>['getTaskCompletion'],
  forDate: Date
): Todo[] => {
  const targetDate = new Date(forDate);
  targetDate.setHours(0, 0, 0, 0);

  const todos: Todo[] = [];

  for (const schedule of schedules) {
    // Skip inactive schedules
    if (!schedule.isActive) continue;

    // Skip schedules that shouldn't appear on this date based on frequency
    if (!shouldScheduleAppearOnDate(schedule, targetDate)) continue;

    for (const todoDef of getScheduleTodoDefs(schedule)) {
      const timeOfDay = todoDef.timeOfDay ?? '00:00';
      const [hours, minutes] = timeOfDay.split(':').map(Number);
      const scheduledAt = new Date(targetDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const completion = getTaskCompletion(schedule.id, todoDef.id);
      const status = getTaskStatus(schedule.id, todoDef.id);
      const isCompleted = status === 'completed';

      todos.push({
        id: `schedule_${schedule.id}_${todoDef.id}`,
        title: todoDef.title,
        priority: 'medium',
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        scheduledAt: scheduledAt.getTime(),
        completedAt: isCompleted ? (completion?.completedAt ?? Date.now()) : undefined,
        scheduleSource: {
          scheduleId: schedule.id,
          scheduleDefId: schedule.scheduleDefId,
          scheduleTitle: schedule.scheduleDef.title,
          scheduleEmoji: schedule.scheduleDef.emoji,
          scheduleFrequency: schedule.scheduleDef.frequency,
          todoDefId: todoDef.id
        }
      });
    }
  }

  return todos;
};

export const TodosScreen = () => {
  const colors = useThemedColors();
  const { formatMinutesOfDay } = useTimeFormatter();
  const insets = useSafeAreaInsets();
  const bottomContentInset = getLiquidTabBarContentInset(insets.bottom);
  const { isVisible: isModalVisible, edit: editTodo, availableTags } = useAddTodoModal();
  const { selectedDate, isToday: isSelectedDateToday, showDatePicker } = useSelectedDate();
  const [regularTodos, setRegularTodos] = useState<Todo[] | null>(null);

  // Get schedule tasks
  const { schedules, getTaskStatus, getTaskCompletion, setTaskStatus } = useSchedules();

  // Streak tracking
  const { streak, recordActivity } = useStreakContext();

  // Achievement banner
  const { show: showAchievement } = useAchievementBanner();

  const refreshTodos = useCallback(async () => {
    const stored = await loadTodos();
    setRegularTodos(stored ?? defaultTodos());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshTodos();
    }, [refreshTodos])
  );

  useFocusEffect(
    useCallback(() => {
      if (!isModalVisible) {
        void refreshTodos();
      }
    }, [isModalVisible, refreshTodos])
  );

  // Merge regular todos with schedule tasks for the selected date
  const allTodos = useMemo(() => {
    const regular = (regularTodos ?? []).filter((todo) => {
      const dateTimestamp = todo.scheduledAt ?? todo.dueAt;
      if (dateTimestamp) return isSameDay(dateTimestamp, selectedDate);
      // "Anytime" tasks only appear on today by default
      return isSelectedDateToday;
    });
    const scheduleTodos = convertScheduleTasksToTodos(
      schedules,
      getTaskStatus,
      getTaskCompletion,
      selectedDate
    );
    return [...regular, ...scheduleTodos];
  }, [
    regularTodos,
    schedules,
    getTaskStatus,
    getTaskCompletion,
    selectedDate,
    isSelectedDateToday
  ]);

  // Track current time for the "now" indicator (updates every minute)
  const [nowMinutes, setNowMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const updateNow = () => {
      const now = new Date();
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
    };
    // Update every minute
    const interval = setInterval(updateNow, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get time of day in minutes (ignores the date portion)
  const getTimeOfDay = useCallback((timestamp: number): number => {
    const date = new Date(timestamp);
    return date.getHours() * 60 + date.getMinutes();
  }, []);

  // Sort by time of day, unscheduled tasks go to the end
  const sortBySchedule = useCallback(
    (a: Todo, b: Todo) => {
      // Both scheduled - compare by time of day only
      if (a.scheduledAt && b.scheduledAt) {
        const aTime = getTimeOfDay(a.scheduledAt);
        const bTime = getTimeOfDay(b.scheduledAt);
        if (aTime !== bTime) return aTime - bTime;
        // Same time - sort by creation date
        return a.createdAt - b.createdAt;
      }
      // Scheduled tasks come before unscheduled
      if (a.scheduledAt && !b.scheduledAt) return -1;
      if (!a.scheduledAt && b.scheduledAt) return 1;
      // Both unscheduled - sort by creation date
      return a.createdAt - b.createdAt;
    },
    [getTimeOfDay]
  );

  const activeTodos = useMemo(() => {
    return allTodos.filter((t) => !t.completedAt).sort(sortBySchedule);
  }, [allTodos, sortBySchedule]);

  // Create list items with "now" indicator inserted at the right position
  type ListItem = { type: 'todo'; data: Todo } | { type: 'now' };

  const getListWithNowIndicator = useCallback(
    (todoList: Todo[], showNow: boolean): ListItem[] => {
      if (!showNow) {
        return todoList.map((todo) => ({ type: 'todo' as const, data: todo }));
      }

      const items: ListItem[] = [];
      let nowInserted = false;

      for (const todo of todoList) {
        // Insert now indicator before the first task that's after current time
        if (!nowInserted && todo.scheduledAt) {
          const todoTime = getTimeOfDay(todo.scheduledAt);
          if (todoTime > nowMinutes) {
            items.push({ type: 'now' });
            nowInserted = true;
          }
        }
        items.push({ type: 'todo', data: todo });
      }

      return items;
    },
    [nowMinutes, getTimeOfDay]
  );

  const persist = async (next: Todo[]) => {
    // Only persist regular todos (not schedule-derived ones)
    const regularOnly = next.filter((t) => !t.scheduleSource);
    setRegularTodos(regularOnly);
    await saveTodos(regularOnly);
  };

  const toggleComplete = async (id: string) => {
    const todo = allTodos.find((t) => t.id === id);
    if (!todo) return;

    // Handle schedule task completion
    if (todo.scheduleSource) {
      const { scheduleId, todoDefId } = todo.scheduleSource;
      const currentStatus = getTaskStatus(scheduleId, todoDefId);
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await setTaskStatus(scheduleId, todoDefId, newStatus);
      // Record activity for streak when completing a task
      if (newStatus === 'completed') {
        await recordActivity();
        showAchievement(todo.title);
      }
      return;
    }

    // Handle regular todo completion
    const now = Date.now();
    const isCompleting = !todo.completedAt;
    const next = (regularTodos ?? []).map((t) =>
      t.id === id ? { ...t, completedAt: t.completedAt ? undefined : now, updatedAt: now } : t
    );
    await persist(next);
    // Record activity for streak when completing a task
    if (isCompleting) {
      await recordActivity();
      showAchievement(todo.title);
    }
  };

  const Separator = () => <View style={[styles.separator, { backgroundColor: colors.border }]} />;

  // Helper to get tag objects for a todo
  const getTagsForTodo = useCallback(
    (todo: Todo) => {
      if (!todo.tags || todo.tags.length === 0) return undefined;
      return availableTags.filter((tag) => todo.tags?.includes(tag.id));
    },
    [availableTags]
  );

  // Format current time for the now indicator
  const NowIndicator = () => (
    <View style={styles.nowContainer}>
      <View style={styles.nowTimeColumn}>
        <Text style={[styles.nowTime, { color: colors.positive }]}>
          {formatMinutesOfDay(nowMinutes)}
        </Text>
      </View>
      <View style={[styles.nowDot, { backgroundColor: colors.positive }]} />
      <View style={[styles.nowLine, { backgroundColor: colors.positive }]} />
    </View>
  );

  const listItems = getListWithNowIndicator(activeTodos, isSelectedDateToday);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      {/* Header bar with date and streak */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border }]}>
        <DateHeader style={styles.inlineDate} />
        <View style={styles.streakBadge}>
          <FireIcon size={16} color={streak > 0 ? colors.warning : colors.textMuted} />
          <Text
            style={[styles.streakCount, { color: streak > 0 ? colors.warning : colors.textMuted }]}
          >
            {streak}
          </Text>
        </View>
      </View>

      {/* Active todo list or date picker */}
      {showDatePicker ? (
        <DatePickerPanel />
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item) => (item.type === 'now' ? 'now-indicator' : item.data.id)}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomContentInset }]}
          ItemSeparatorComponent={Separator}
          renderItem={({ item }) => {
            if (item.type === 'now') {
              return <NowIndicator />;
            }
            return (
              <TodoCard
                todo={item.data}
                onToggleComplete={() => void toggleComplete(item.data.id)}
                onEdit={() => editTodo(item.data)}
                tags={getTagsForTodo(item.data)}
              />
            );
          }}
          ListEmptyComponent={() => (
            <View style={[styles.empty, { paddingBottom: Math.max(bottomContentInset - 20, 100) }]}>
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>All clear</Text>
              <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                Add a task to get started
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default TodosScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16
  },
  inlineDate: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 18,
    fontWeight: '600'
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  streakCount: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 6
  },
  separator: {
    height: 1,
    marginLeft: 8
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingBottom: 100
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: -0.3
  },
  emptyBody: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
    letterSpacing: -0.2
  },
  nowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12
  },
  nowTimeColumn: {
    width: 86,
    paddingLeft: 8,
    paddingRight: 8,
    alignItems: 'flex-end'
  },
  nowTime: {
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2
  },
  nowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8
  },
  nowLine: {
    flex: 1,
    height: 1,
    marginRight: 20
  }
});
