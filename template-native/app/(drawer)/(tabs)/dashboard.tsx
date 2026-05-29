import { FireIcon } from 'react-native-heroicons/solid';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DayView, MonthView, WeekView, YearView } from '@/components/progress';
import { getLiquidTabBarContentInset } from '@/components/navigation';
import { Text } from '@/components/Themed';
import { DateHeader, DatePickerPanel } from '@/components/ui/DateHeader';
import { useSelectedDate, useStreakContext, type ProgressPeriod } from '@/contexts';
import { getScheduleTodoDefs, shouldScheduleAppearOnDate, useSchedules } from '@/lib/schedules';
import type { Todo } from '@/lib/todos';
import { loadTodos } from '@/lib/todos';
import { useThemedColors } from '@/lib/utils';

const PERIOD_LABELS: Record<ProgressPeriod, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year'
};

const PERIODS: ProgressPeriod[] = ['day', 'week', 'month', 'year'];

// Convert schedule tasks to Todo format for a date range
const convertScheduleTasksToTodos = (
  schedules: ReturnType<typeof useSchedules>['schedules'],
  getTaskStatus: ReturnType<typeof useSchedules>['getTaskStatus'],
  getTaskCompletion: ReturnType<typeof useSchedules>['getTaskCompletion'],
  forDate: Date
): Todo[] => {
  const todos: Todo[] = [];
  const targetDate = new Date(forDate);
  targetDate.setHours(0, 0, 0, 0);

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

export const ProgressScreen = () => {
  const colors = useThemedColors();
  const insets = useSafeAreaInsets();
  const bottomContentInset = getLiquidTabBarContentInset(insets.bottom);
  const { selectedDate, setSelectedDate, selectedPeriod, setSelectedPeriod, showDatePicker } =
    useSelectedDate();
  const [regularTodos, setRegularTodos] = useState<Todo[]>([]);

  // Get schedule tasks
  const { schedules, getTaskStatus, getTaskCompletion, reload: reloadSchedules } = useSchedules();

  // Streak tracking
  const { streak } = useStreakContext();

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const stored = await loadTodos();
        setRegularTodos(stored ?? []);
        await reloadSchedules();
      })();
    }, [reloadSchedules])
  );

  // Merge regular todos with schedule tasks
  const allTodos = useMemo(() => {
    const scheduleTodos = convertScheduleTasksToTodos(
      schedules,
      getTaskStatus,
      getTaskCompletion,
      selectedDate
    );
    return [...regularTodos, ...scheduleTodos];
  }, [regularTodos, schedules, getTaskStatus, getTaskCompletion, selectedDate]);

  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
    // When tapping a day from week/month/year view, switch to day view
    if (selectedPeriod !== 'day') {
      setSelectedPeriod('day');
    }
  };

  const renderView = () => {
    switch (selectedPeriod) {
      case 'day':
        return <DayView todos={allTodos} selectedDate={selectedDate} streak={streak} />;
      case 'week':
        return (
          <WeekView todos={allTodos} selectedDate={selectedDate} onDayPress={handleDayPress} />
        );
      case 'month':
        return (
          <MonthView todos={allTodos} selectedDate={selectedDate} onDayPress={handleDayPress} />
        );
      case 'year':
        return (
          <YearView todos={allTodos} selectedDate={selectedDate} onDayPress={handleDayPress} />
        );
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <View style={styles.headerBar}>
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

      {showDatePicker ? (
        <DatePickerPanel />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingBottom: bottomContentInset }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Time Period Tabs - Refined segmented control */}
          <View style={[styles.periodTabs, { backgroundColor: colors.backgroundSecondary }]}>
            {PERIODS.map((period) => {
              const isActive = selectedPeriod === period;
              return (
                <Pressable
                  key={period}
                  onPress={() => setSelectedPeriod(period)}
                  style={[
                    styles.periodTab,
                    isActive && {
                      backgroundColor: colors.card,
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.periodTabText,
                      {
                        color: isActive ? colors.text : colors.textMuted,
                        fontWeight: isActive ? '600' : '500'
                      }
                    ]}
                  >
                    {PERIOD_LABELS[period]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Period-specific View */}
          {renderView()}
        </ScrollView>
      )}
    </View>
  );
};

export default ProgressScreen;

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
  inlineDate: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 18,
    fontWeight: '600'
  },
  content: {
    padding: 20,
    gap: 20
  },
  periodTabs: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    borderCurve: 'continuous'
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 7,
    alignItems: 'center',
    borderCurve: 'continuous'
  },
  periodTabText: {
    fontSize: 13,
    letterSpacing: -0.2
  }
});
