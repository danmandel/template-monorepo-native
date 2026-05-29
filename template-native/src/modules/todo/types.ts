import type { ScheduleFrequency } from '@/src/modules/scheduleDef';

export type TodoPriority = 'low' | 'medium' | 'high';

export type ScheduleSource = {
  scheduleId: string;
  scheduleDefId: string;
  scheduleTitle: string;
  scheduleEmoji?: string;
  scheduleFrequency: ScheduleFrequency;
  todoDefId: string;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type Todo = {
  id: string;
  title: string;
  notes?: string;
  priority: TodoPriority;
  frequency?: ScheduleFrequency;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  dueAt?: number;
  scheduledAt?: number;
  completedAt?: number;
  scheduleSource?: ScheduleSource;
};
