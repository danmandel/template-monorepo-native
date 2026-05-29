import type { Schedule, ScheduleDef, ScheduleFrequency, ScheduleMode, ScheduleTask } from './types';

const now = Date.now();

const generateId = (): string => Math.random().toString(36).substring(2, 15);

type ScheduleItemSeed = [
  timeOfDay: string,
  title: string,
  category?: ScheduleTask['category'],
  duration?: number
];

const createTodoDef = (
  scheduleDefId: string,
  sortOrder: number,
  timeOfDay: string,
  title: string,
  category?: ScheduleTask['category'],
  duration?: number
): ScheduleTask => ({
  id: generateId(),
  scheduleDefId,
  timeOfDay,
  title,
  category,
  duration,
  sortOrder
});

const createSchedule = ({
  id,
  title,
  emoji,
  description,
  frequency,
  dayOfWeek,
  dayOfMonth,
  month,
  mode = 'day',
  items
}: {
  id: string;
  title: string;
  emoji: string;
  description: string;
  frequency: ScheduleFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  month?: number;
  mode?: ScheduleMode;
  items: ScheduleItemSeed[];
}): Schedule => {
  const scheduleDefId = `${id}-def`;
  const scheduleDef: ScheduleDef = {
    id: scheduleDefId,
    title,
    emoji,
    description,
    mode,
    visibility: 'private',
    frequency,
    dayOfWeek,
    dayOfMonth,
    month,
    createdAt: now,
    updatedAt: now,
    todoDefs: items.map((item, index) => createTodoDef(scheduleDefId, index, ...item))
  };

  return {
    id,
    scheduleDefId,
    scheduleDef,
    isActive: true,
    installedAt: now,
    createdAt: now,
    updatedAt: now
  };
};

export const DEFAULT_SCHEDULE: Schedule = createSchedule({
  id: 'default-daily-routine',
  title: 'Daily Routine',
  emoji: '☀️',
  description: 'A simple daily routine to keep you on track',
  frequency: 'daily',
  items: [
    ['06:30', 'Wake up', 'personal'],
    ['06:35', 'Brush teeth', 'health', 5],
    ['06:45', 'Shower', 'health', 15],
    ['07:00', 'Breakfast', 'health', 30],
    ['07:30', 'Review daily goals', 'work', 10],
    ['12:00', 'Lunch', 'health', 45],
    ['15:00', 'Afternoon break', 'personal', 15],
    ['18:00', 'Exercise', 'fitness', 45],
    ['19:00', 'Dinner', 'health', 45],
    ['21:00', 'Wind down / Read', 'personal', 30],
    ['21:30', 'Brush teeth', 'health', 5],
    ['22:00', 'Go to sleep', 'health']
  ]
});

const WEEKLY_SCHEDULE: Schedule = createSchedule({
  id: 'weekly-review',
  title: 'Weekly Review',
  emoji: '📅',
  description: 'Weekly planning and reflection',
  frequency: 'weekly',
  dayOfWeek: 0,
  items: [
    ['09:00', 'Review last week accomplishments', 'work', 20],
    ['09:30', 'Plan upcoming week goals', 'work', 30],
    ['10:00', 'Clean and organize workspace', 'personal', 30],
    ['14:00', 'Grocery shopping', 'personal', 60],
    ['16:00', 'Call family', 'personal', 30]
  ]
});

const MONTHLY_SCHEDULE: Schedule = createSchedule({
  id: 'monthly-tasks',
  title: 'Monthly Tasks',
  emoji: '📊',
  description: 'Monthly maintenance and reviews',
  frequency: 'monthly',
  dayOfMonth: 1,
  items: [
    ['10:00', 'Review monthly budget', 'finance', 45],
    ['11:00', 'Pay bills', 'finance', 30],
    ['14:00', 'Deep clean home', 'personal', 120],
    ['17:00', 'Review subscriptions', 'finance', 20]
  ]
});

const YEARLY_SCHEDULE: Schedule = createSchedule({
  id: 'yearly-tasks',
  title: 'Yearly Tasks',
  emoji: '🎯',
  description: 'Annual reviews and planning',
  frequency: 'yearly',
  month: 0,
  dayOfMonth: 1,
  items: [
    ['09:00', 'Annual health checkup', 'health', 120],
    ['13:00', 'Review yearly goals', 'personal', 60],
    ['15:00', 'Update emergency contacts', 'personal', 30],
    ['16:00', 'Review insurance policies', 'finance', 45]
  ]
});

export const SAMPLE_SCHEDULES: Schedule[] = [
  DEFAULT_SCHEDULE,
  WEEKLY_SCHEDULE,
  MONTHLY_SCHEDULE,
  YEARLY_SCHEDULE
];
