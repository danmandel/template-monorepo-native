export type TaskCategory = 'health' | 'fitness' | 'work' | 'finance' | 'personal' | 'other';

export type TodoDefStatus = 'pending' | 'completed' | 'skipped';

export type TodoDef = {
  id: string;
  scheduleDefId: string;
  title: string;
  notes?: string;
  timeOfDay?: string; // "HH:mm" for day schedules.
  offsetMinutes?: number; // Relative position for sequence schedules.
  duration?: number;
  category?: TaskCategory;
  sortOrder: number;
};

export type TodoDefCompletion = {
  status: TodoDefStatus;
  completedAt?: number;
};

export type TodoDefProgress = {
  scheduleId: string;
  todoDefId: string;
  occurrenceKey: string;
  status: TodoDefStatus;
  completedAt?: number;
};
