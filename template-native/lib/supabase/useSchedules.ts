import { useCallback, useEffect, useState } from 'react';

import { useSelectedDate } from '@/contexts';

import { useSupabaseContext } from './provider';
import type { Database, TaskCategory, TaskStatus } from './types';

type DbSchedule = Database['public']['Tables']['schedules']['Row'];
type DbScheduleTask = Database['public']['Tables']['schedule_tasks']['Row'];
type DbDailyProgress = Database['public']['Tables']['daily_progress']['Row'];

export type ScheduleTask = {
  id: string;
  scheduleId: string;
  title: string;
  time: string; // "HH:mm"
  duration?: number;
  category?: TaskCategory;
  sortOrder: number;
};

export type Schedule = {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  isActive: boolean;
  tasks: ScheduleTask[];
  createdAt: Date;
  updatedAt: Date;
};

export type DailyProgress = {
  scheduleId: string;
  taskId: string;
  date: string;
  status: TaskStatus;
};

// Convert database time (HH:MM:SS) to app format (HH:mm)
const formatTime = (dbTime: string): string => {
  const [hours, minutes] = dbTime.split(':');
  return `${hours}:${minutes}`;
};

// Convert app time (HH:mm) to database format
const toDbTime = (time: string): string => {
  return `${time}:00`;
};

const taskFromDb = (row: DbScheduleTask): ScheduleTask => ({
  id: row.id,
  scheduleId: row.schedule_id,
  title: row.title,
  time: formatTime(row.time),
  duration: row.duration ?? undefined,
  category: row.category ?? undefined,
  sortOrder: row.sort_order
});

const scheduleFromDb = (row: DbSchedule, tasks: ScheduleTask[]): Schedule => ({
  id: row.id,
  name: row.name,
  emoji: row.emoji ?? undefined,
  description: row.description ?? undefined,
  isActive: row.is_active,
  tasks: tasks.filter((t) => t.scheduleId === row.id).sort((a, b) => a.sortOrder - b.sortOrder),
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export type CreateScheduleInput = {
  name: string;
  emoji?: string;
  description?: string;
  isActive?: boolean;
};

export type CreateTaskInput = {
  scheduleId: string;
  title: string;
  time: string;
  duration?: number;
  category?: TaskCategory;
};

export const useSchedules = () => {
  const { selectedDate } = useSelectedDate();
  const selectedDateString = formatDateString(selectedDate);

  const { supabase, profile, isLoading: contextLoading } = useSupabaseContext();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDateProgress, setSelectedDateProgress] = useState<DailyProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load schedules with tasks
  const loadSchedules = useCallback(async () => {
    if (!supabase || !profile) {
      setSchedules([]);
      setSelectedDateProgress([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Load schedules
      const { data: scheduleRows, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .returns<DbSchedule[]>();

      if (scheduleError) throw scheduleError;

      // Load all tasks for user's schedules
      const scheduleIds = (scheduleRows ?? []).map((s) => s.id);
      let tasks: ScheduleTask[] = [];

      if (scheduleIds.length > 0) {
        const { data: taskRows, error: taskError } = await supabase
          .from('schedule_tasks')
          .select('*')
          .in('schedule_id', scheduleIds)
          .order('sort_order', { ascending: true })
          .returns<DbScheduleTask[]>();

        if (taskError) throw taskError;
        tasks = (taskRows ?? []).map(taskFromDb);
      }

      // Load progress for selected date
      const { data: progressRows, error: progressError } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date', selectedDateString)
        .returns<DbDailyProgress[]>();

      if (progressError) throw progressError;

      const progress: DailyProgress[] = (progressRows ?? []).map((p) => ({
        scheduleId: p.schedule_id,
        taskId: p.task_id,
        date: p.date,
        status: p.status
      }));

      setSchedules((scheduleRows ?? []).map((s) => scheduleFromDb(s, tasks)));
      setSelectedDateProgress(progress);
    } catch (err) {
      console.error('Error loading schedules:', err);
      setError(err instanceof Error ? err : new Error('Failed to load schedules'));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, profile, selectedDateString]);

  // Initial load
  useEffect(() => {
    if (!contextLoading) {
      void loadSchedules();
    }
  }, [contextLoading, loadSchedules]);

  // Create schedule
  const createSchedule = useCallback(
    async (input: CreateScheduleInput): Promise<Schedule | null> => {
      if (!supabase || !profile) return null;

      try {
        const { data, error: insertError } = await supabase
          .from('schedules')
          .insert({
            user_id: profile.id,
            name: input.name,
            emoji: input.emoji ?? null,
            description: input.description ?? null,
            is_active: input.isActive ?? true
          })
          .select()
          .single<DbSchedule>();

        if (insertError) throw insertError;

        const schedule = scheduleFromDb(data!, []);
        setSchedules((prev) => [schedule, ...prev]);
        return schedule;
      } catch (err) {
        console.error('Error creating schedule:', err);
        throw err;
      }
    },
    [supabase, profile]
  );

  // Update schedule
  const updateSchedule = useCallback(
    async (id: string, input: Partial<CreateScheduleInput>): Promise<Schedule | null> => {
      if (!supabase || !profile) return null;

      try {
        const updateData: Record<string, unknown> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.emoji !== undefined) updateData.emoji = input.emoji;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.isActive !== undefined) updateData.is_active = input.isActive;

        const { data, error: updateError } = await supabase
          .from('schedules')
          .update(updateData)
          .eq('id', id)
          .select()
          .single<DbSchedule>();

        if (updateError) throw updateError;

        const existingTasks = schedules.find((s) => s.id === id)?.tasks ?? [];
        const schedule = scheduleFromDb(data!, existingTasks);
        setSchedules((prev) => prev.map((s) => (s.id === id ? schedule : s)));
        return schedule;
      } catch (err) {
        console.error('Error updating schedule:', err);
        throw err;
      }
    },
    [supabase, profile, schedules]
  );

  // Delete schedule
  const deleteSchedule = useCallback(
    async (id: string): Promise<void> => {
      if (!supabase || !profile) return;

      try {
        const { error: deleteError } = await supabase.from('schedules').delete().eq('id', id);

        if (deleteError) throw deleteError;

        setSchedules((prev) => prev.filter((s) => s.id !== id));
      } catch (err) {
        console.error('Error deleting schedule:', err);
        throw err;
      }
    },
    [supabase, profile]
  );

  // Add task to schedule
  const addTask = useCallback(
    async (input: CreateTaskInput): Promise<ScheduleTask | null> => {
      if (!supabase || !profile) return null;

      const schedule = schedules.find((s) => s.id === input.scheduleId);
      if (!schedule) return null;

      try {
        const maxOrder = Math.max(0, ...schedule.tasks.map((t) => t.sortOrder));

        const { data, error: insertError } = await supabase
          .from('schedule_tasks')
          .insert({
            schedule_id: input.scheduleId,
            title: input.title,
            time: toDbTime(input.time),
            duration: input.duration ?? null,
            category: input.category ?? null,
            sort_order: maxOrder + 1
          })
          .select()
          .single<DbScheduleTask>();

        if (insertError) throw insertError;

        const task = taskFromDb(data!);
        setSchedules((prev) =>
          prev.map((s) => (s.id === input.scheduleId ? { ...s, tasks: [...s.tasks, task] } : s))
        );
        return task;
      } catch (err) {
        console.error('Error adding task:', err);
        throw err;
      }
    },
    [supabase, profile, schedules]
  );

  // Update task
  const updateTask = useCallback(
    async (
      taskId: string,
      input: Partial<Omit<CreateTaskInput, 'scheduleId'>>
    ): Promise<ScheduleTask | null> => {
      if (!supabase || !profile) return null;

      try {
        const updateData: Record<string, unknown> = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.time !== undefined) updateData.time = toDbTime(input.time);
        if (input.duration !== undefined) updateData.duration = input.duration;
        if (input.category !== undefined) updateData.category = input.category;

        const { data, error: updateError } = await supabase
          .from('schedule_tasks')
          .update(updateData)
          .eq('id', taskId)
          .select()
          .single<DbScheduleTask>();

        if (updateError) throw updateError;

        const task = taskFromDb(data!);
        setSchedules((prev) =>
          prev.map((s) => ({
            ...s,
            tasks: s.tasks.map((t) => (t.id === taskId ? task : t))
          }))
        );
        return task;
      } catch (err) {
        console.error('Error updating task:', err);
        throw err;
      }
    },
    [supabase, profile]
  );

  // Delete task
  const deleteTask = useCallback(
    async (taskId: string): Promise<void> => {
      if (!supabase || !profile) return;

      try {
        const { error: deleteError } = await supabase
          .from('schedule_tasks')
          .delete()
          .eq('id', taskId);

        if (deleteError) throw deleteError;

        setSchedules((prev) =>
          prev.map((s) => ({
            ...s,
            tasks: s.tasks.filter((t) => t.id !== taskId)
          }))
        );
      } catch (err) {
        console.error('Error deleting task:', err);
        throw err;
      }
    },
    [supabase, profile]
  );

  // Get task status for today
  const getTaskStatus = useCallback(
    (scheduleId: string, taskId: string): TaskStatus => {
      const progress = selectedDateProgress.find(
        (p) => p.scheduleId === scheduleId && p.taskId === taskId
      );
      return progress?.status ?? 'pending';
    },
    [selectedDateProgress]
  );

  // Set task status for today
  const setTaskStatus = useCallback(
    async (scheduleId: string, taskId: string, status: TaskStatus): Promise<void> => {
      if (!supabase || !profile) return;

      try {
        // Upsert progress
        const { error: upsertError } = await supabase.from('daily_progress').upsert(
          {
            user_id: profile.id,
            schedule_id: scheduleId,
            task_id: taskId,
            date: selectedDateString,
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : null
          },
          {
            onConflict: 'task_id,date'
          }
        );

        if (upsertError) throw upsertError;

        // Update local state
        setSelectedDateProgress((prev) => {
          const existing = prev.find((p) => p.scheduleId === scheduleId && p.taskId === taskId);
          if (existing) {
            return prev.map((p) =>
              p.scheduleId === scheduleId && p.taskId === taskId ? { ...p, status } : p
            );
          }
          return [...prev, { scheduleId, taskId, date: selectedDateString, status }];
        });
      } catch (err) {
        console.error('Error setting task status:', err);
        throw err;
      }
    },
    [supabase, profile, selectedDateString]
  );

  // Get schedule progress for today
  const getScheduleProgress = useCallback(
    (scheduleId: string): { completed: number; total: number } => {
      const schedule = schedules.find((s) => s.id === scheduleId);
      if (!schedule) return { completed: 0, total: 0 };

      const completed = schedule.tasks.filter(
        (t) => getTaskStatus(scheduleId, t.id) === 'completed'
      ).length;

      return { completed, total: schedule.tasks.length };
    },
    [schedules, getTaskStatus]
  );

  return {
    schedules,
    selectedDateProgress,
    isLoading: contextLoading || isLoading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    addTask,
    updateTask,
    deleteTask,
    getTaskStatus,
    setTaskStatus,
    getScheduleProgress,
    reload: loadSchedules
  };
};
