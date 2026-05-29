import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import type { Todo } from '@/lib/todos';
import { useThemedColors } from '@/lib/utils';

type WeekViewProps = {
  todos: Todo[];
  selectedDate: Date;
  onDayPress?: (date: Date) => void;
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

export const WeekView = ({ todos, selectedDate, onDayPress }: WeekViewProps) => {
  const colors = useThemedColors();
  const today = new Date();

  // Get the week containing the selected date
  const weekStart = getStartOfWeek(selectedDate);

  // Build 7 days of the week
  const weekDays = useMemo(() => {
    const days: { date: Date; dayName: string; dateNum: number; count: number }[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayStart = getStartOfDay(date);
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const count = todos.filter((t) => {
        if (t.completedAt) {
          return t.completedAt >= dayStart && t.completedAt < dayEnd;
        }
        return false;
      }).length;

      days.push({
        date,
        dayName: DAY_NAMES[i],
        dateNum: date.getDate(),
        count
      });
    }

    return days;
  }, [todos, weekStart]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = weekDays.reduce((sum, d) => sum + d.count, 0);
    const maxCount = Math.max(...weekDays.map((d) => d.count), 1);
    const average = weekDays.length > 0 ? (total / 7).toFixed(1) : '0';
    const bestDay = weekDays.reduce(
      (best, day) => (day.count > best.count ? day : best),
      weekDays[0]
    );

    return { total, maxCount, average, bestDay };
  }, [weekDays]);

  return (
    <View style={styles.container}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View
          style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.statValue, { color: colors.positive }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This Week</Text>
        </View>
        <View
          style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.statValue, { color: colors.tint }]}>{stats.average}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Daily Avg</Text>
        </View>
        <View
          style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.bestDay?.dayName ?? '-'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Best Day</Text>
        </View>
      </View>

      {/* Week Bar Chart */}
      <View
        style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Activity</Text>
        <View style={styles.chart}>
          {weekDays.map((day, index) => {
            const isSelected = isSameDay(day.date, selectedDate);
            const isToday = isSameDay(day.date, today);
            const barHeight = stats.maxCount > 0 ? (day.count / stats.maxCount) * 100 : 0;

            return (
              <Pressable
                key={index}
                style={styles.barColumn}
                onPress={() => onDayPress?.(day.date)}
              >
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max(barHeight, 5)}%`,
                        backgroundColor: isSelected ? colors.tint : colors.positive,
                        opacity: day.count === 0 ? 0.3 : 1
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.barCount, { color: colors.text }]}>
                  {day.count > 0 ? day.count : ''}
                </Text>
                <Text
                  style={[
                    styles.dayLabel,
                    {
                      color: isSelected
                        ? colors.tint
                        : isToday
                          ? colors.positive
                          : colors.textSecondary
                    }
                  ]}
                >
                  {day.dayName}
                </Text>
                <Text
                  style={[
                    styles.dateLabel,
                    {
                      color: isSelected ? colors.tint : colors.textMuted
                    }
                  ]}
                >
                  {day.dateNum}
                </Text>
                {isToday && (
                  <View style={[styles.todayDot, { backgroundColor: colors.positive }]} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Week Summary */}
      <View
        style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Week of</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
            {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Tasks completed
          </Text>
          <Text style={[styles.summaryValue, { color: colors.positive }]}>{stats.total}</Text>
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
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180
  },
  barColumn: {
    flex: 1,
    alignItems: 'center'
  },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 4
  },
  bar: {
    width: '80%',
    borderRadius: 4,
    minHeight: 4
  },
  barCount: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    height: 16
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4
  },
  dateLabel: {
    fontSize: 11,
    marginTop: 2
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4
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
