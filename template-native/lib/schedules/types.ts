import type { TodoDef, TodoDefCompletion, TodoDefStatus } from '@/src/modules/todoDef';

export type { Schedule, ScheduleDraft } from '@/src/modules/schedule';
export {
  getScheduleDescription,
  getScheduleEmoji,
  getScheduleFrequency,
  getScheduleMode,
  getScheduleTitle,
  getScheduleTodoDefs,
  shouldScheduleAppearOnDate
} from '@/src/modules/schedule';
export type {
  ScheduleDef,
  ScheduleFrequency,
  ScheduleMode,
  ScheduleVisibility
} from '@/src/modules/scheduleDef';
export type {
  TaskCategory,
  TodoDef,
  TodoDefCompletion,
  TodoDefStatus
} from '@/src/modules/todoDef';

export type ScheduleTask = TodoDef;
export type TaskStatus = TodoDefStatus;
export type TaskCompletion = TodoDefCompletion;

export type DailyProgress = {
  date: string;
  scheduleId: string;
  taskStatus: Record<string, TaskStatus>;
  taskCompletions?: Record<string, TaskCompletion>;
};

export type StreakData = {
  currentStreak: number;
  lastActivityDate: string | null;
};
