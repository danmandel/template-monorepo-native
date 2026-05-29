import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import type { Todo } from '@/lib/todos';
import { useThemedColors } from '@/lib/utils';

type MonthViewProps = {
  todos: Todo[];
  selectedDate: Date;
  onDayPress?: (date: Date) => void;
};

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const getStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  count: number;
};

export const MonthView = ({ todos, selectedDate, onDayPress }: MonthViewProps) => {
  const colors = useThemedColors();

  // Build calendar grid
  const { calendarDays, stats } = useMemo(() => {
    const today = new Date();
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from the Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // End on the Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    // Count completions by day
    const completionsByDay = new Map<number, number>();
    for (const todo of todos) {
      if (todo.completedAt) {
        const dayStart = getStartOfDay(new Date(todo.completedAt));
        completionsByDay.set(dayStart, (completionsByDay.get(dayStart) ?? 0) + 1);
      }
    }

    // Build calendar days
    const days: CalendarDay[] = [];
    let current = new Date(startDate);
    let totalCompleted = 0;
    let maxCount = 0;

    while (current <= endDate) {
      const dayStart = getStartOfDay(current);
      const count = completionsByDay.get(dayStart) ?? 0;
      const isCurrentMonth = current.getMonth() === month;

      if (isCurrentMonth) {
        totalCompleted += count;
        maxCount = Math.max(maxCount, count);
      }

      days.push({
        date: new Date(current),
        isCurrentMonth,
        isToday: isSameDay(current, today),
        isSelected: isSameDay(current, selectedDate),
        count
      });

      current.setDate(current.getDate() + 1);
    }

    // Calculate active days (days with at least 1 completion)
    const activeDays = days.filter((d) => d.isCurrentMonth && d.count > 0).length;
    const daysInMonth = lastDay.getDate();

    return {
      calendarDays: days,
      stats: {
        totalCompleted,
        activeDays,
        daysInMonth,
        maxCount: Math.max(maxCount, 1)
      }
    };
  }, [todos, selectedDate]);

  // Get intensity color
  const getIntensityColor = (count: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth || count === 0) return 'transparent';

    const intensity = Math.min(count / stats.maxCount, 1);
    if (intensity <= 0.25) return `${colors.positive}40`;
    if (intensity <= 0.5) return `${colors.positive}70`;
    if (intensity <= 0.75) return `${colors.positive}A0`;
    return `${colors.positive}E0`;
  };

  // Split into weeks
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <View style={styles.container}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View
          style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.statValue, { color: colors.positive }]}>{stats.totalCompleted}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This Month</Text>
        </View>
        <View
          style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.statValue, { color: colors.tint }]}>{stats.activeDays}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Days</Text>
        </View>
        <View
          style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.statValue, { color: colors.text }]}>
            {Math.round((stats.activeDays / stats.daysInMonth) * 100)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Consistency</Text>
        </View>
      </View>

      {/* Calendar */}
      <View
        style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        {/* Day headers */}
        <View style={styles.headerRow}>
          {DAY_HEADERS.map((day, index) => (
            <View key={index} style={styles.headerCell}>
              <Text style={[styles.headerText, { color: colors.textMuted }]}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => (
              <Pressable
                key={dayIndex}
                style={styles.dayCell}
                onPress={() => day.isCurrentMonth && onDayPress?.(day.date)}
              >
                <View
                  style={[
                    styles.dayCellContent,
                    {
                      backgroundColor: getIntensityColor(day.count, day.isCurrentMonth),
                      borderWidth: day.isSelected ? 2 : 0,
                      borderColor: colors.tint
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: day.isCurrentMonth
                          ? day.isToday
                            ? colors.positive
                            : colors.text
                          : colors.textMuted,
                        fontWeight: day.isToday || day.isSelected ? '700' : '400'
                      }
                    ]}
                  >
                    {day.date.getDate()}
                  </Text>
                </View>
                {day.isToday && (
                  <View style={[styles.todayIndicator, { backgroundColor: colors.positive }]} />
                )}
              </Pressable>
            ))}
          </View>
        ))}

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Less</Text>
          {[0, 0.25, 0.5, 0.75, 1].map((intensity, index) => (
            <View
              key={index}
              style={[
                styles.legendSquare,
                {
                  backgroundColor:
                    index === 0
                      ? colors.backgroundSecondary
                      : `${colors.positive}${Math.round(intensity * 224 + 31).toString(16)}`
                }
              ]}
            />
          ))}
          <Text style={[styles.legendText, { color: colors.textMuted }]}>More</Text>
        </View>
      </View>

      {/* Month Info */}
      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <Text style={[styles.infoValue, { color: colors.positive }]}>
            {stats.totalCompleted} tasks completed
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700'
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4
  },
  calendarCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600'
  },
  weekRow: {
    flexDirection: 'row'
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dayCellContent: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dayText: {
    fontSize: 14
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)'
  },
  legendText: {
    fontSize: 10,
    fontWeight: '500'
  },
  legendSquare: {
    width: 12,
    height: 12,
    borderRadius: 3
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500'
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600'
  }
});
