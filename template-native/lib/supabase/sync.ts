import { supabase } from './client';
import { loadTodos, saveTodos } from '../todos/storage';
import { loadSchedules, saveSchedules } from '../schedules/storage';
import type { Todo } from '../todos/types';
import type { Schedule, ScheduleTask, TaskCategory } from '../schedules/types';

export type SyncResult = {
  success: boolean;
  error?: string;
  stats?: {
    todosUploaded: number;
    todosDownloaded: number;
    schedulesUploaded: number;
    schedulesDownloaded: number;
  };
};

// Database row types for queries
type TodoRow = {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  priority: string | null;
  due_at: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ScheduleRow = {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type ScheduleTaskRow = {
  id: string;
  schedule_id: string;
  title: string;
  time: string;
  duration: number | null;
  category: string | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type ScheduleWithTasks = ScheduleRow & { schedule_tasks: ScheduleTaskRow[] };

// Convert local Todo to Supabase insert format
const todoToSupabase = (todo: Todo, userId: string) => ({
  id: todo.id,
  user_id: userId,
  title: todo.title,
  notes: todo.notes ?? null,
  priority: todo.priority,
  due_at: todo.dueAt ? new Date(todo.dueAt).toISOString() : null,
  scheduled_at: todo.scheduledAt ? new Date(todo.scheduledAt).toISOString() : null,
  completed_at: todo.completedAt ? new Date(todo.completedAt).toISOString() : null,
  created_at: new Date(todo.createdAt).toISOString(),
  updated_at: new Date(todo.updatedAt).toISOString()
});

// Convert Supabase todo to local format
const supabaseTodoToLocal = (row: TodoRow): Todo => ({
  id: row.id,
  title: row.title,
  notes: row.notes ?? undefined,
  priority: (row.priority as Todo['priority']) ?? 'medium',
  dueAt: row.due_at ? new Date(row.due_at).getTime() : undefined,
  scheduledAt: row.scheduled_at ? new Date(row.scheduled_at).getTime() : undefined,
  completedAt: row.completed_at ? new Date(row.completed_at).getTime() : undefined,
  createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now()
});

// Convert local Schedule to Supabase insert format
const scheduleToSupabase = (schedule: Schedule, userId: string) => ({
  id: schedule.id,
  user_id: userId,
  name: schedule.scheduleDef.title,
  emoji: schedule.scheduleDef.emoji ?? null,
  description: schedule.scheduleDef.description ?? null,
  is_active: schedule.isActive,
  created_at: new Date(schedule.createdAt).toISOString(),
  updated_at: new Date(schedule.updatedAt).toISOString()
});

// Convert local ScheduleTask to Supabase insert format
const taskToSupabase = (task: ScheduleTask, scheduleId: string, index: number) => ({
  id: task.id,
  schedule_id: scheduleId,
  title: task.title,
  time: task.timeOfDay ?? '00:00',
  duration: task.duration ?? null,
  category: task.category ?? null,
  sort_order: index
});

// Convert Supabase schedule + tasks to local format
const supabaseScheduleToLocal = (row: ScheduleRow, tasks: ScheduleTaskRow[]): Schedule => {
  const now = Date.now();
  const createdAt = row.created_at ? new Date(row.created_at).getTime() : now;
  const updatedAt = row.updated_at ? new Date(row.updated_at).getTime() : now;
  const scheduleDefId = `${row.id}-def`;

  return {
    id: row.id,
    scheduleDefId,
    scheduleDef: {
      id: scheduleDefId,
      title: row.name,
      emoji: row.emoji ?? undefined,
      description: row.description ?? undefined,
      mode: 'day',
      visibility: 'private',
      frequency: 'daily',
      createdAt,
      updatedAt,
      todoDefs: tasks
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((t, index) => ({
          id: t.id,
          scheduleDefId,
          title: t.title,
          timeOfDay: t.time,
          duration: t.duration ?? undefined,
          category: t.category as TaskCategory | undefined,
          sortOrder: t.sort_order ?? index
        }))
    },
    isActive: row.is_active ?? true,
    installedAt: createdAt,
    createdAt,
    updatedAt
  };
};

// Sync todos to cloud
async function syncTodos(userId: string): Promise<{ uploaded: number; downloaded: number }> {
  const localTodos = await loadTodos();

  // Get cloud todos
  const { data: cloudTodos, error: fetchError } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId);

  if (fetchError) throw new Error(`Failed to fetch todos: ${fetchError.message}`);

  const cloudTodosList = (cloudTodos ?? []) as TodoRow[];
  const cloudTodosMap = new Map(cloudTodosList.map((t) => [t.id, t]));

  // Merge: newer version wins
  const mergedTodos: Todo[] = [];
  const todosToUpload: ReturnType<typeof todoToSupabase>[] = [];
  let downloadedCount = 0;

  // Process local todos
  for (const local of localTodos ?? []) {
    const cloud = cloudTodosMap.get(local.id);
    if (!cloud) {
      // Local only - upload it
      todosToUpload.push(todoToSupabase(local, userId));
      mergedTodos.push(local);
    } else {
      // Both exist - newer wins
      const cloudUpdated = cloud.updated_at ? new Date(cloud.updated_at).getTime() : 0;
      if (local.updatedAt > cloudUpdated) {
        todosToUpload.push(todoToSupabase(local, userId));
        mergedTodos.push(local);
      } else {
        mergedTodos.push(supabaseTodoToLocal(cloud));
      }
      cloudTodosMap.delete(local.id);
    }
  }

  // Remaining cloud todos (not in local)
  for (const cloud of cloudTodosMap.values()) {
    mergedTodos.push(supabaseTodoToLocal(cloud));
    downloadedCount++;
  }

  // Upload local changes
  if (todosToUpload.length > 0) {
    const { error: upsertError } = await supabase
      .from('todos')
      .upsert(todosToUpload as never[], { onConflict: 'id' });

    if (upsertError) throw new Error(`Failed to upload todos: ${upsertError.message}`);
  }

  // Save merged result locally
  await saveTodos(mergedTodos);

  return {
    uploaded: todosToUpload.length,
    downloaded: downloadedCount
  };
}

// Sync schedules to cloud
async function syncSchedules(userId: string): Promise<{ uploaded: number; downloaded: number }> {
  const localSchedules = await loadSchedules();

  // Get cloud schedules with tasks
  const { data: cloudSchedules, error: fetchError } = await supabase
    .from('schedules')
    .select('*, schedule_tasks(*)')
    .eq('user_id', userId);

  if (fetchError) throw new Error(`Failed to fetch schedules: ${fetchError.message}`);

  const cloudSchedulesList = (cloudSchedules ?? []) as ScheduleWithTasks[];
  const cloudSchedulesMap = new Map(cloudSchedulesList.map((s) => [s.id, s]));

  const mergedSchedules: Schedule[] = [];
  const schedulesToUpload: ReturnType<typeof scheduleToSupabase>[] = [];
  const tasksToUpload: ReturnType<typeof taskToSupabase>[] = [];
  const taskIdsToDelete: string[] = [];
  let downloadedCount = 0;

  // Process local schedules
  for (const local of localSchedules ?? []) {
    const cloud = cloudSchedulesMap.get(local.id);
    if (!cloud) {
      // Local only - upload it
      schedulesToUpload.push(scheduleToSupabase(local, userId));
      local.scheduleDef.todoDefs.forEach((t, i) =>
        tasksToUpload.push(taskToSupabase(t, local.id, i))
      );
      mergedSchedules.push(local);
    } else {
      // Both exist - newer wins
      const cloudUpdated = cloud.updated_at ? new Date(cloud.updated_at).getTime() : 0;
      if (local.updatedAt > cloudUpdated) {
        schedulesToUpload.push(scheduleToSupabase(local, userId));
        // Delete old tasks and upload new ones
        cloud.schedule_tasks.forEach((t) => taskIdsToDelete.push(t.id));
        local.scheduleDef.todoDefs.forEach((t, i) =>
          tasksToUpload.push(taskToSupabase(t, local.id, i))
        );
        mergedSchedules.push(local);
      } else {
        mergedSchedules.push(supabaseScheduleToLocal(cloud, cloud.schedule_tasks));
      }
      cloudSchedulesMap.delete(local.id);
    }
  }

  // Remaining cloud schedules (not in local)
  for (const cloud of cloudSchedulesMap.values()) {
    mergedSchedules.push(supabaseScheduleToLocal(cloud, cloud.schedule_tasks));
    downloadedCount++;
  }

  // Delete old tasks
  if (taskIdsToDelete.length > 0) {
    await supabase.from('schedule_tasks').delete().in('id', taskIdsToDelete);
  }

  // Upload schedules
  if (schedulesToUpload.length > 0) {
    const { error: upsertError } = await supabase
      .from('schedules')
      .upsert(schedulesToUpload as never[], { onConflict: 'id' });

    if (upsertError) throw new Error(`Failed to upload schedules: ${upsertError.message}`);
  }

  // Upload tasks
  if (tasksToUpload.length > 0) {
    const { error: taskError } = await supabase
      .from('schedule_tasks')
      .upsert(tasksToUpload as never[], { onConflict: 'id' });

    if (taskError) throw new Error(`Failed to upload tasks: ${taskError.message}`);
  }

  // Save merged result locally
  await saveSchedules(mergedSchedules);

  return {
    uploaded: schedulesToUpload.length,
    downloaded: downloadedCount
  };
}

// Main sync function
export const syncToCloud = async (): Promise<SyncResult> => {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const [todosResult, schedulesResult] = await Promise.all([
      syncTodos(user.id),
      syncSchedules(user.id)
    ]);

    return {
      success: true,
      stats: {
        todosUploaded: todosResult.uploaded,
        todosDownloaded: todosResult.downloaded,
        schedulesUploaded: schedulesResult.uploaded,
        schedulesDownloaded: schedulesResult.downloaded
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
