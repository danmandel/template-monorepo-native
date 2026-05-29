import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { DailyProgress, Schedule, ScheduleDef, ScheduleTask, StreakData } from './types';

const SCHEDULES_STORAGE_KEY = 'schedules_v1';
const PROGRESS_STORAGE_KEY_PREFIX = 'schedule_progress_';
const STREAK_STORAGE_KEY = 'streak_v1';

const safeJsonParse = <T>(raw: string): T | null => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const asNumber = (value: unknown, fallback: number): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};

const asString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
};

const normalizeTodoDef = (
  raw: unknown,
  scheduleDefId: string,
  sortOrder: number
): ScheduleTask | null => {
  if (!isRecord(raw)) return null;

  const title = asString(raw.title);
  if (!title) return null;

  return {
    id: asString(raw.id) ?? `${scheduleDefId}-${sortOrder}`,
    scheduleDefId: asString(raw.scheduleDefId) ?? scheduleDefId,
    title,
    notes: asString(raw.notes),
    timeOfDay: asString(raw.timeOfDay) ?? asString(raw.time),
    offsetMinutes: asNumber(raw.offsetMinutes, NaN),
    duration: asNumber(raw.duration, NaN),
    category: asString(raw.category) as ScheduleTask['category'] | undefined,
    sortOrder: asNumber(raw.sortOrder, sortOrder)
  };
};

const compactTodoDef = (todoDef: ScheduleTask): ScheduleTask => ({
  ...todoDef,
  offsetMinutes: Number.isFinite(todoDef.offsetMinutes) ? todoDef.offsetMinutes : undefined,
  duration: Number.isFinite(todoDef.duration) ? todoDef.duration : undefined
});

const normalizeSchedule = (raw: unknown): Schedule | null => {
  if (!isRecord(raw)) return null;

  const now = Date.now();
  const id = asString(raw.id);
  if (!id) return null;

  if (isRecord(raw.scheduleDef)) {
    const scheduleDefId =
      asString(raw.scheduleDefId) ?? asString(raw.scheduleDef.id) ?? `${id}-def`;
    const rawTodoDefs = Array.isArray(raw.scheduleDef.todoDefs) ? raw.scheduleDef.todoDefs : [];
    const todoDefs = rawTodoDefs
      .map((todoDef, index) => normalizeTodoDef(todoDef, scheduleDefId, index))
      .filter(Boolean)
      .map((todoDef) => compactTodoDef(todoDef as ScheduleTask));

    const scheduleDef: ScheduleDef = {
      id: scheduleDefId,
      authorId: asString(raw.scheduleDef.authorId),
      title: asString(raw.scheduleDef.title) ?? 'Untitled Schedule',
      emoji: asString(raw.scheduleDef.emoji),
      description: asString(raw.scheduleDef.description),
      mode: raw.scheduleDef.mode === 'sequence' ? 'sequence' : 'day',
      visibility:
        raw.scheduleDef.visibility === 'public' || raw.scheduleDef.visibility === 'unlisted'
          ? raw.scheduleDef.visibility
          : 'private',
      frequency:
        raw.scheduleDef.frequency === 'weekly' ||
        raw.scheduleDef.frequency === 'monthly' ||
        raw.scheduleDef.frequency === 'yearly'
          ? raw.scheduleDef.frequency
          : 'daily',
      dayOfWeek: asNumber(raw.scheduleDef.dayOfWeek, NaN),
      dayOfMonth: asNumber(raw.scheduleDef.dayOfMonth, NaN),
      month: asNumber(raw.scheduleDef.month, NaN),
      starCount: asNumber(raw.scheduleDef.starCount, NaN),
      createdAt: asNumber(raw.scheduleDef.createdAt, asNumber(raw.createdAt, now)),
      updatedAt: asNumber(raw.scheduleDef.updatedAt, asNumber(raw.updatedAt, now)),
      todoDefs
    };

    return {
      id,
      userId: asString(raw.userId),
      scheduleDefId,
      scheduleDef: {
        ...scheduleDef,
        dayOfWeek: Number.isFinite(scheduleDef.dayOfWeek) ? scheduleDef.dayOfWeek : undefined,
        dayOfMonth: Number.isFinite(scheduleDef.dayOfMonth) ? scheduleDef.dayOfMonth : undefined,
        month: Number.isFinite(scheduleDef.month) ? scheduleDef.month : undefined,
        starCount: Number.isFinite(scheduleDef.starCount) ? scheduleDef.starCount : undefined
      },
      isActive: typeof raw.isActive === 'boolean' ? raw.isActive : true,
      color: asString(raw.color),
      installedAt: asNumber(raw.installedAt, asNumber(raw.createdAt, now)),
      createdAt: asNumber(raw.createdAt, now),
      updatedAt: asNumber(raw.updatedAt, now)
    };
  }

  const scheduleDefId = `${id}-def`;
  const rawTasks = Array.isArray(raw.tasks) ? raw.tasks : [];
  const todoDefs = rawTasks
    .map((task, index) => normalizeTodoDef(task, scheduleDefId, index))
    .filter(Boolean)
    .map((todoDef) => compactTodoDef(todoDef as ScheduleTask));
  const dayOfWeek = asNumber(raw.dayOfWeek, NaN);
  const dayOfMonth = asNumber(raw.dayOfMonth, NaN);
  const month = asNumber(raw.month, NaN);

  return {
    id,
    scheduleDefId,
    scheduleDef: {
      id: scheduleDefId,
      title: asString(raw.name) ?? 'Untitled Schedule',
      emoji: asString(raw.emoji),
      description: asString(raw.description),
      mode: 'day',
      visibility: 'private',
      frequency:
        raw.frequency === 'weekly' || raw.frequency === 'monthly' || raw.frequency === 'yearly'
          ? raw.frequency
          : 'daily',
      dayOfWeek: Number.isFinite(dayOfWeek) ? dayOfWeek : undefined,
      dayOfMonth: Number.isFinite(dayOfMonth) ? dayOfMonth : undefined,
      month: Number.isFinite(month) ? month : undefined,
      createdAt: asNumber(raw.createdAt, now),
      updatedAt: asNumber(raw.updatedAt, now),
      todoDefs
    },
    isActive: typeof raw.isActive === 'boolean' ? raw.isActive : true,
    installedAt: asNumber(raw.createdAt, now),
    createdAt: asNumber(raw.createdAt, now),
    updatedAt: asNumber(raw.updatedAt, now)
  };
};

const normalizeSchedules = (raw: unknown): Schedule[] | null => {
  if (!Array.isArray(raw)) return null;
  return raw.map(normalizeSchedule).filter(Boolean) as Schedule[];
};

// Helper to get today's date as "YYYY-MM-DD"
export const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayDateString = (): string => {
  return formatDateString(new Date());
};

// --- Schedules ---

export const loadSchedules = async (): Promise<Schedule[] | null> => {
  try {
    if (Platform.OS === 'web') {
      const raw = globalThis.localStorage?.getItem(SCHEDULES_STORAGE_KEY);
      if (!raw) return null;
      return normalizeSchedules(safeJsonParse<unknown>(raw));
    }

    const raw = await SecureStore.getItemAsync(SCHEDULES_STORAGE_KEY);
    if (!raw) return null;
    return normalizeSchedules(safeJsonParse<unknown>(raw));
  } catch {
    return null;
  }
};

export const saveSchedules = async (schedules: Schedule[]): Promise<void> => {
  const raw = JSON.stringify(schedules);

  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(SCHEDULES_STORAGE_KEY, raw);
      return;
    }

    await SecureStore.setItemAsync(SCHEDULES_STORAGE_KEY, raw);
  } catch {
    // Best-effort persistence.
  }
};

// --- Daily Progress ---

const getProgressStorageKey = (date: string): string => {
  return `${PROGRESS_STORAGE_KEY_PREFIX}${date}`;
};

export const loadDailyProgress = async (date: string): Promise<DailyProgress[] | null> => {
  const key = getProgressStorageKey(date);

  try {
    if (Platform.OS === 'web') {
      const raw = globalThis.localStorage?.getItem(key);
      if (!raw) return null;
      return safeJsonParse<DailyProgress[]>(raw);
    }

    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return null;
    return safeJsonParse<DailyProgress[]>(raw);
  } catch {
    return null;
  }
};

export const saveDailyProgress = async (date: string, progress: DailyProgress[]): Promise<void> => {
  const key = getProgressStorageKey(date);
  const raw = JSON.stringify(progress);

  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, raw);
      return;
    }

    await SecureStore.setItemAsync(key, raw);
  } catch {
    // Best-effort persistence.
  }
};

// Load today's progress
export const loadTodayProgress = async (): Promise<DailyProgress[] | null> => {
  return loadDailyProgress(getTodayDateString());
};

// Save today's progress
export const saveTodayProgress = async (progress: DailyProgress[]): Promise<void> => {
  return saveDailyProgress(getTodayDateString(), progress);
};

// --- Streak ---

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  lastActivityDate: null
};

export const loadStreak = async (): Promise<StreakData> => {
  try {
    if (Platform.OS === 'web') {
      const raw = globalThis.localStorage?.getItem(STREAK_STORAGE_KEY);
      if (!raw) return DEFAULT_STREAK;
      return safeJsonParse<StreakData>(raw) ?? DEFAULT_STREAK;
    }

    const raw = await SecureStore.getItemAsync(STREAK_STORAGE_KEY);
    if (!raw) return DEFAULT_STREAK;
    return safeJsonParse<StreakData>(raw) ?? DEFAULT_STREAK;
  } catch {
    return DEFAULT_STREAK;
  }
};

export const saveStreak = async (streak: StreakData): Promise<void> => {
  const raw = JSON.stringify(streak);

  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(STREAK_STORAGE_KEY, raw);
      return;
    }

    await SecureStore.setItemAsync(STREAK_STORAGE_KEY, raw);
  } catch {
    // Best-effort persistence.
  }
};
