export type {
  Schedule,
  ScheduleDef,
  ScheduleDraft,
  ScheduleTask,
  ScheduleFrequency,
  ScheduleMode,
  ScheduleVisibility,
  TaskCategory,
  TaskStatus,
  TaskCompletion,
  TodoDef,
  DailyProgress,
  StreakData
} from './types';

export {
  getScheduleDescription,
  getScheduleEmoji,
  getScheduleFrequency,
  getScheduleMode,
  getScheduleTitle,
  getScheduleTodoDefs,
  shouldScheduleAppearOnDate
} from './types';

export {
  loadSchedules,
  saveSchedules,
  loadDailyProgress,
  saveDailyProgress,
  loadTodayProgress,
  saveTodayProgress,
  getTodayDateString,
  loadStreak,
  saveStreak
} from './storage';

export { DEFAULT_SCHEDULE, SAMPLE_SCHEDULES } from './defaults';

// Re-export from context for shared state across components
export { useSchedules, SchedulesProvider } from '@/contexts/SchedulesContext';
export type { SchedulesState, SchedulesActions } from '@/contexts/SchedulesContext';

export { useStreak } from './useStreak';
export type { StreakState, StreakActions } from './useStreak';
