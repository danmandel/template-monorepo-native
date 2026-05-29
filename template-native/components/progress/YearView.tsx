import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import type { Todo } from '@/lib/todos';
import { useThemedColors } from '@/lib/utils';

type YearViewProps = {
  todos: Todo[];
  selectedDate: Date;
  onDayPress?: (date: Date) => void;
};

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

const getStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

type DayData = {
  date: Date;
  count: number;
  weekIndex: number;
  dayOfWeek: number;
};

export const YearView = ({ todos, selectedDate, onDayPress }: YearViewProps) => {
  const colors = useThemedColors();
  const today = new Date();

  // Build year grid data
  const { yearData, stats, monthLabels } = useMemo(() => {
    const year = selectedDate.getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    // Count completions by day
    const completionsByDay = new Map<number, number>();
    for (const todo of todos) {
      if (todo.completedAt) {
        const todoDate = new Date(todo.completedAt);
        if (todoDate.getFullYear() === year) {
          const dayStart = getStartOfDay(todoDate);
          completionsByDay.set(dayStart, (completionsByDay.get(dayStart) ?? 0) + 1);
        }
      }
    }

    // Start from the first Sunday before or on Jan 1
    const gridStart = getStartOfWeek(yearStart);

    // End on the last Saturday after or on Dec 31
    const lastSaturday = new Date(yearEnd);
    lastSaturday.setDate(lastSaturday.getDate() + (6 - lastSaturday.getDay()));

    // Build day data
    const days: DayData[] = [];
    let current = new Date(gridStart);
    let weekIndex = 0;
    let maxCount = 0;
    let totalCompleted = 0;
    let activeDays = 0;

    while (current <= lastSaturday) {
      const dayStart = getStartOfDay(current);
      const count = completionsByDay.get(dayStart) ?? 0;
      const isInYear = current.getFullYear() === year;

      if (isInYear) {
        totalCompleted += count;
        maxCount = Math.max(maxCount, count);
        if (count > 0) activeDays++;
      }

      days.push({
        date: new Date(current),
        count: isInYear ? count : -1, // -1 means outside of year
        weekIndex,
        dayOfWeek: current.getDay()
      });

      current.setDate(current.getDate() + 1);
      if (current.getDay() === 0) weekIndex++;
    }

    // Generate month labels with their week positions
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    for (const day of days) {
      if (
        day.date.getFullYear() === year &&
        day.date.getMonth() !== lastMonth &&
        day.dayOfWeek === 0
      ) {
        labels.push({
          month: MONTH_NAMES[day.date.getMonth()],
          weekIndex: day.weekIndex
        });
        lastMonth = day.date.getMonth();
      }
    }

    return {
      yearData: days,
      stats: {
        totalCompleted,
        activeDays,
        maxCount: Math.max(maxCount, 1),
        totalWeeks: weekIndex
      },
      monthLabels: labels
    };
  }, [todos, selectedDate]);

  // Get intensity level
  const getIntensityLevel = (count: number) => {
    if (count < 0) return -1; // Outside year
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 5) return 3;
    return 4;
  };

  // Get color for intensity level
  const getSquareColor = (level: number) => {
    if (level < 0) return 'transparent';
    if (level === 0) return colors.backgroundSecondary;
    const opacities = [0.2, 0.4, 0.6, 0.9];
    return `${colors.positive}${Math.round(opacities[level - 1] * 255)
      .toString(16)
      .padStart(2, '0')}`;
  };

  // Organize by weeks (columns) and days (rows)
  const weeks: DayData[][] = [];
  for (let w = 0; w <= stats.totalWeeks; w++) {
    weeks.push(yearData.filter((d) => d.weekIndex === w));
  }

  const CELL_SIZE = 11;
  const CELL_GAP = 2;

  return (
    <View style={styles.container}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View
          style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.statValue, { color: colors.positive }]}>{stats.totalCompleted}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This Year</Text>
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
            {Math.round((stats.activeDays / 365) * 100)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Consistency</Text>
        </View>
      </View>

      {/* Heatmap */}
      <View
        style={[styles.heatmapCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {selectedDate.getFullYear()} Activity
        </Text>

        {/* Month labels */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={[styles.monthLabels, { marginLeft: 28 }]}>
              {monthLabels.map((label, index) => (
                <Text
                  key={index}
                  style={[
                    styles.monthLabel,
                    {
                      color: colors.textMuted,
                      left: label.weekIndex * (CELL_SIZE + CELL_GAP)
                    }
                  ]}
                >
                  {label.month}
                </Text>
              ))}
            </View>

            {/* Grid */}
            <View style={styles.gridContainer}>
              {/* Day labels */}
              <View style={styles.dayLabels}>
                {DAY_LABELS.map((label, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.dayLabel,
                      { color: colors.textMuted, height: CELL_SIZE + CELL_GAP }
                    ]}
                  >
                    {label}
                  </Text>
                ))}
              </View>

              {/* Weeks */}
              <View style={styles.weeksContainer}>
                {weeks.map((week, weekIndex) => (
                  <View key={weekIndex} style={[styles.weekColumn, { gap: CELL_GAP }]}>
                    {week.map((day, dayIndex) => {
                      const level = getIntensityLevel(day.count);
                      const isSelected = isSameDay(day.date, selectedDate);
                      const isToday = isSameDay(day.date, today);

                      return (
                        <Pressable
                          key={dayIndex}
                          onPress={() => day.count >= 0 && onDayPress?.(day.date)}
                        >
                          <View
                            style={[
                              styles.cell,
                              {
                                width: CELL_SIZE,
                                height: CELL_SIZE,
                                backgroundColor: getSquareColor(level),
                                borderWidth: isSelected || isToday ? 1 : 0,
                                borderColor: isSelected ? colors.tint : colors.text
                              }
                            ]}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <Text style={[styles.legendText, { color: colors.textMuted }]}>Less</Text>
              {[0, 1, 2, 3, 4].map((level) => (
                <View
                  key={level}
                  style={[styles.legendSquare, { backgroundColor: getSquareColor(level) }]}
                />
              ))}
              <Text style={[styles.legendText, { color: colors.textMuted }]}>More</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Year Summary */}
      <View
        style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Year</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {selectedDate.getFullYear()}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total tasks</Text>
          <Text style={[styles.summaryValue, { color: colors.positive }]}>
            {stats.totalCompleted}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Active days</Text>
          <Text style={[styles.summaryValue, { color: colors.tint }]}>{stats.activeDays}</Text>
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
  heatmapCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16
  },
  monthLabels: {
    flexDirection: 'row',
    height: 20,
    position: 'relative'
  },
  monthLabel: {
    fontSize: 10,
    fontWeight: '500',
    position: 'absolute'
  },
  gridContainer: {
    flexDirection: 'row'
  },
  dayLabels: {
    marginRight: 4
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'right',
    width: 24
  },
  weeksContainer: {
    flexDirection: 'row',
    gap: 2
  },
  weekColumn: {
    flexDirection: 'column'
  },
  cell: {
    borderRadius: 2
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 12
  },
  legendText: {
    fontSize: 10,
    fontWeight: '500'
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  summaryLabel: {
    fontSize: 14
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600'
  },
  divider: {
    height: 1,
    marginVertical: 4
  }
});
