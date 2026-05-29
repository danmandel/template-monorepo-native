import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useSelectedDate } from './SelectedDateContext';

import type {
  DailyProgress,
  Schedule,
  ScheduleDraft,
  ScheduleTask,
  TaskCompletion,
  TaskStatus
} from '@/lib/schedules/types';
import {
  loadSchedules,
  loadDailyProgress,
  saveSchedules,
  saveDailyProgress,
  formatDateString
} from '@/lib/schedules/storage';
import { SAMPLE_SCHEDULES } from '@/lib/schedules/defaults';

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

type ScheduleTaskInput = Omit<ScheduleTask, 'id' | 'scheduleDefId' | 'sortOrder'> &
  Partial<Pick<ScheduleTask, 'scheduleDefId' | 'sortOrder'>>;

export type SchedulesState = {
  schedules: Schedule[];
  selectedDateProgress: DailyProgress[];
  isLoading: boolean;
  activeSchedule: Schedule | null;
};

export type SchedulesActions = {
  // Schedule CRUD
  createSchedule: (schedule: ScheduleDraft) => Promise<Schedule>;
  updateSchedule: (id: string, updates: Partial<ScheduleDraft>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  duplicateSchedule: (id: string) => Promise<Schedule>;
  setActiveSchedule: (id: string | null) => void;

  // Task CRUD
  addTask: (scheduleId: string, task: ScheduleTaskInput) => Promise<void>;
  updateTask: (
    scheduleId: string,
    taskId: string,
    updates: Partial<Omit<ScheduleTask, 'id' | 'scheduleDefId'>>
  ) => Promise<void>;
  deleteTask: (scheduleId: string, taskId: string) => Promise<void>;
  reorderTasks: (scheduleId: string, taskIds: string[]) => Promise<void>;

  // Progress tracking
  setTaskStatus: (scheduleId: string, taskId: string, status: TaskStatus) => Promise<void>;
  getTaskStatus: (scheduleId: string, taskId: string) => TaskStatus;
  getTaskCompletion: (scheduleId: string, taskId: string) => TaskCompletion | null;
  getScheduleProgress: (scheduleId: string) => {
    completed: number;
    total: number;
    percentage: number;
  };

  // Utilities
  reload: () => Promise<void>;
};

type SchedulesContextValue = SchedulesState & SchedulesActions;

const SchedulesContext = createContext<SchedulesContextValue | null>(null);

export const SchedulesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedDate } = useSelectedDate();
  const selectedDateString = formatDateString(selectedDate);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDateProgress, setSelectedDateProgress] = useState<DailyProgress[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [activeSchedule, setActiveScheduleState] = useState<Schedule | null>(null);

  // Load schedules (independent of selected date)
  const loadSchedulesData = useCallback(async () => {
    setIsLoadingSchedules(true);
    try {
      const loadedSchedules = await loadSchedules();
      const schedulesToUse = loadedSchedules ?? SAMPLE_SCHEDULES;
      setSchedules(schedulesToUse);

      // Set active schedule to the first active one
      const active = schedulesToUse.find((s) => s.isActive);
      setActiveScheduleState(active ?? null);
    } catch (error) {
      console.error('Failed to load schedules:', error);
      setSchedules(SAMPLE_SCHEDULES);
    } finally {
      setIsLoadingSchedules(false);
    }
  }, []);

  useEffect(() => {
    void loadSchedulesData();
  }, [loadSchedulesData]);

  // Load progress for the selected date
  const loadSelectedDateProgress = useCallback(async () => {
    setIsLoadingProgress(true);
    try {
      const loadedProgress = await loadDailyProgress(selectedDateString);
      setSelectedDateProgress(loadedProgress ?? []);
    } catch (error) {
      console.error('Failed to load schedule progress:', error);
      setSelectedDateProgress([]);
    } finally {
      setIsLoadingProgress(false);
    }
  }, [selectedDateString]);

  useEffect(() => {
    void loadSelectedDateProgress();
  }, [loadSelectedDateProgress]);

  // Persist schedules whenever they change
  const persistSchedules = useCallback(async (newSchedules: Schedule[]) => {
    setSchedules(newSchedules);
    await saveSchedules(newSchedules);
  }, []);

  // Persist progress for the selected date whenever it changes
  const persistSelectedDateProgress = useCallback(
    async (date: string, newProgress: DailyProgress[]) => {
      setSelectedDateProgress(newProgress);
      await saveDailyProgress(date, newProgress);
    },
    []
  );

  // --- Schedule CRUD ---

  const createSchedule = useCallback(
    async (scheduleData: ScheduleDraft): Promise<Schedule> => {
      const now = Date.now();
      const scheduleId = generateId();
      const scheduleDefId = generateId();
      const newSchedule: Schedule = {
        id: scheduleId,
        scheduleDefId,
        scheduleDef: {
          id: scheduleDefId,
          title: scheduleData.title,
          emoji: scheduleData.emoji,
          description: scheduleData.description,
          mode: scheduleData.mode ?? 'day',
          visibility: scheduleData.visibility ?? 'private',
          frequency: scheduleData.frequency ?? 'daily',
          dayOfWeek: scheduleData.dayOfWeek,
          dayOfMonth: scheduleData.dayOfMonth,
          month: scheduleData.month,
          todoDefs: (scheduleData.todoDefs ?? []).map((todoDef, index) => ({
            ...todoDef,
            scheduleDefId,
            sortOrder: todoDef.sortOrder ?? index
          })),
          createdAt: now,
          updatedAt: now
        },
        isActive: scheduleData.isActive,
        color: scheduleData.color,
        installedAt: now,
        createdAt: now,
        updatedAt: now
      };
      const newSchedules = [...schedules, newSchedule];
      await persistSchedules(newSchedules);
      return newSchedule;
    },
    [schedules, persistSchedules]
  );

  const updateSchedule = useCallback(
    async (id: string, updates: Partial<ScheduleDraft>) => {
      const now = Date.now();
      const newSchedules = schedules.map((s) => {
        if (s.id !== id) return s;

        return {
          ...s,
          isActive: updates.isActive ?? s.isActive,
          color: 'color' in updates ? updates.color : s.color,
          updatedAt: now,
          scheduleDef: {
            ...s.scheduleDef,
            title: updates.title ?? s.scheduleDef.title,
            emoji: 'emoji' in updates ? updates.emoji : s.scheduleDef.emoji,
            description: 'description' in updates ? updates.description : s.scheduleDef.description,
            mode: updates.mode ?? s.scheduleDef.mode,
            visibility: updates.visibility ?? s.scheduleDef.visibility,
            frequency: updates.frequency ?? s.scheduleDef.frequency,
            dayOfWeek: 'dayOfWeek' in updates ? updates.dayOfWeek : s.scheduleDef.dayOfWeek,
            dayOfMonth: 'dayOfMonth' in updates ? updates.dayOfMonth : s.scheduleDef.dayOfMonth,
            month: 'month' in updates ? updates.month : s.scheduleDef.month,
            todoDefs: updates.todoDefs ?? s.scheduleDef.todoDefs,
            updatedAt: now
          }
        };
      });
      await persistSchedules(newSchedules);

      // Update activeSchedule if it was the one modified
      if (activeSchedule?.id === id) {
        const updated = newSchedules.find((s) => s.id === id);
        setActiveScheduleState(updated ?? null);
      }
    },
    [schedules, activeSchedule, persistSchedules]
  );

  const deleteSchedule = useCallback(
    async (id: string) => {
      const newSchedules = schedules.filter((s) => s.id !== id);
      await persistSchedules(newSchedules);

      // Clear activeSchedule if it was deleted
      if (activeSchedule?.id === id) {
        const nextActive = newSchedules.find((s) => s.isActive);
        setActiveScheduleState(nextActive ?? null);
      }
    },
    [schedules, activeSchedule, persistSchedules]
  );

  const duplicateSchedule = useCallback(
    async (id: string): Promise<Schedule> => {
      const original = schedules.find((s) => s.id === id);
      if (!original) throw new Error(`Schedule ${id} not found`);

      const now = Date.now();
      const scheduleDefId = generateId();
      const duplicated: Schedule = {
        ...original,
        id: generateId(),
        scheduleDefId,
        isActive: false,
        createdAt: now,
        updatedAt: now,
        installedAt: now,
        scheduleDef: {
          ...original.scheduleDef,
          id: scheduleDefId,
          title: `${original.scheduleDef.title} (Copy)`,
          visibility: 'private',
          createdAt: now,
          updatedAt: now,
          todoDefs: original.scheduleDef.todoDefs.map((todoDef, index) => ({
            ...todoDef,
            id: generateId(),
            scheduleDefId,
            sortOrder: index
          }))
        }
      };
      const newSchedules = [...schedules, duplicated];
      await persistSchedules(newSchedules);
      return duplicated;
    },
    [schedules, persistSchedules]
  );

  const setActiveSchedule = useCallback(
    (id: string | null) => {
      const schedule = id ? schedules.find((s) => s.id === id) : null;
      setActiveScheduleState(schedule ?? null);
    },
    [schedules]
  );

  // --- Task CRUD ---

  const addTask = useCallback(
    async (scheduleId: string, taskData: ScheduleTaskInput) => {
      const schedule = schedules.find((s) => s.id === scheduleId);
      if (!schedule) return;

      const newTask: ScheduleTask = {
        ...taskData,
        id: generateId(),
        scheduleDefId: schedule.scheduleDefId,
        sortOrder: taskData.sortOrder ?? schedule.scheduleDef.todoDefs.length
      };

      const newSchedules = schedules.map((s) => {
        if (s.id !== scheduleId) return s;
        const todoDefs = [...s.scheduleDef.todoDefs, newTask].sort((a, b) => {
          const aTime = a.timeOfDay ?? '';
          const bTime = b.timeOfDay ?? '';
          if (aTime !== bTime) return aTime.localeCompare(bTime);
          return a.sortOrder - b.sortOrder;
        });
        return {
          ...s,
          scheduleDef: {
            ...s.scheduleDef,
            todoDefs: todoDefs.map((todoDef, index) => ({ ...todoDef, sortOrder: index })),
            updatedAt: Date.now()
          },
          updatedAt: Date.now()
        };
      });

      await persistSchedules(newSchedules);

      if (activeSchedule?.id === scheduleId) {
        const updated = newSchedules.find((s) => s.id === scheduleId);
        setActiveScheduleState(updated ?? null);
      }
    },
    [schedules, activeSchedule, persistSchedules]
  );

  const updateTask = useCallback(
    async (
      scheduleId: string,
      taskId: string,
      updates: Partial<Omit<ScheduleTask, 'id' | 'scheduleDefId'>>
    ) => {
      const newSchedules = schedules.map((s) => {
        if (s.id !== scheduleId) return s;
        const todoDefs = s.scheduleDef.todoDefs.map((t) =>
          t.id === taskId ? { ...t, ...updates } : t
        );
        if (updates.timeOfDay) {
          todoDefs.sort((a, b) => (a.timeOfDay ?? '').localeCompare(b.timeOfDay ?? ''));
        }
        return {
          ...s,
          scheduleDef: {
            ...s.scheduleDef,
            todoDefs: todoDefs.map((todoDef, index) => ({ ...todoDef, sortOrder: index })),
            updatedAt: Date.now()
          },
          updatedAt: Date.now()
        };
      });

      await persistSchedules(newSchedules);

      if (activeSchedule?.id === scheduleId) {
        const updated = newSchedules.find((s) => s.id === scheduleId);
        setActiveScheduleState(updated ?? null);
      }
    },
    [schedules, activeSchedule, persistSchedules]
  );

  const deleteTask = useCallback(
    async (scheduleId: string, taskId: string) => {
      const newSchedules = schedules.map((s) => {
        if (s.id !== scheduleId) return s;
        return {
          ...s,
          scheduleDef: {
            ...s.scheduleDef,
            todoDefs: s.scheduleDef.todoDefs
              .filter((t) => t.id !== taskId)
              .map((todoDef, index) => ({ ...todoDef, sortOrder: index })),
            updatedAt: Date.now()
          },
          updatedAt: Date.now()
        };
      });

      await persistSchedules(newSchedules);

      if (activeSchedule?.id === scheduleId) {
        const updated = newSchedules.find((s) => s.id === scheduleId);
        setActiveScheduleState(updated ?? null);
      }
    },
    [schedules, activeSchedule, persistSchedules]
  );

  const reorderTasks = useCallback(
    async (scheduleId: string, taskIds: string[]) => {
      const newSchedules = schedules.map((s) => {
        if (s.id !== scheduleId) return s;
        const taskMap = new Map(s.scheduleDef.todoDefs.map((t) => [t.id, t]));
        const reordered = taskIds
          .map((id) => taskMap.get(id))
          .filter(Boolean)
          .map((todoDef, index) => ({ ...(todoDef as ScheduleTask), sortOrder: index }));
        return {
          ...s,
          scheduleDef: { ...s.scheduleDef, todoDefs: reordered, updatedAt: Date.now() },
          updatedAt: Date.now()
        };
      });

      await persistSchedules(newSchedules);

      if (activeSchedule?.id === scheduleId) {
        const updated = newSchedules.find((s) => s.id === scheduleId);
        setActiveScheduleState(updated ?? null);
      }
    },
    [schedules, activeSchedule, persistSchedules]
  );

  // --- Progress Tracking ---

  const setTaskStatus = useCallback(
    async (scheduleId: string, taskId: string, status: TaskStatus) => {
      const now = Date.now();
      let updated = false;

      const newProgress = selectedDateProgress.map((p) => {
        if (p.scheduleId !== scheduleId || p.date !== selectedDateString) return p;
        updated = true;
        const completion = {
          status,
          completedAt: status === 'completed' ? now : undefined
        };
        return {
          ...p,
          taskStatus: { ...p.taskStatus, [taskId]: status },
          taskCompletions: { ...(p.taskCompletions ?? {}), [taskId]: completion }
        };
      });

      if (!updated) {
        const completion = {
          status,
          completedAt: status === 'completed' ? now : undefined
        };
        newProgress.push({
          date: selectedDateString,
          scheduleId,
          taskStatus: { [taskId]: status },
          taskCompletions: { [taskId]: completion }
        });
      }

      await persistSelectedDateProgress(selectedDateString, newProgress);
    },
    [selectedDateProgress, persistSelectedDateProgress, selectedDateString]
  );

  const getTaskStatus = useCallback(
    (scheduleId: string, taskId: string): TaskStatus => {
      const progress = selectedDateProgress.find(
        (p) => p.scheduleId === scheduleId && p.date === selectedDateString
      );
      return progress?.taskStatus[taskId] ?? 'pending';
    },
    [selectedDateProgress, selectedDateString]
  );

  const getTaskCompletion = useCallback(
    (scheduleId: string, taskId: string): TaskCompletion | null => {
      const progress = selectedDateProgress.find(
        (p) => p.scheduleId === scheduleId && p.date === selectedDateString
      );
      return progress?.taskCompletions?.[taskId] ?? null;
    },
    [selectedDateProgress, selectedDateString]
  );

  const getScheduleProgress = useCallback(
    (scheduleId: string): { completed: number; total: number; percentage: number } => {
      const schedule = schedules.find((s) => s.id === scheduleId);
      if (!schedule) return { completed: 0, total: 0, percentage: 0 };

      const progress = selectedDateProgress.find(
        (p) => p.scheduleId === scheduleId && p.date === selectedDateString
      );

      const total = schedule.scheduleDef.todoDefs.length;
      const completed = progress
        ? Object.values(progress.taskStatus).filter((s) => s === 'completed').length
        : 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { completed, total, percentage };
    },
    [schedules, selectedDateProgress, selectedDateString]
  );

  const value: SchedulesContextValue = {
    // State
    schedules,
    selectedDateProgress,
    isLoading: isLoadingSchedules || isLoadingProgress,
    activeSchedule,
    // Schedule CRUD
    createSchedule,
    updateSchedule,
    deleteSchedule,
    duplicateSchedule,
    setActiveSchedule,
    // Task CRUD
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    // Progress
    setTaskStatus,
    getTaskStatus,
    getTaskCompletion,
    getScheduleProgress,
    // Utils
    reload: async () => {
      await loadSchedulesData();
      await loadSelectedDateProgress();
    }
  };

  return <SchedulesContext.Provider value={value}>{children}</SchedulesContext.Provider>;
};

export const useSchedules = (): SchedulesContextValue => {
  const context = useContext(SchedulesContext);
  if (!context) {
    throw new Error('useSchedules must be used within a SchedulesProvider');
  }
  return context;
};
