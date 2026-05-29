import type { TodoDef } from '@/src/modules/todoDef';

export type ScheduleMode = 'day' | 'sequence';
export type ScheduleVisibility = 'private' | 'public' | 'unlisted';
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ScheduleDef = {
  id: string;
  authorId?: string;
  title: string;
  emoji?: string;
  description?: string;
  mode: ScheduleMode;
  visibility: ScheduleVisibility;
  frequency: ScheduleFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  month?: number;
  todoDefs: TodoDef[];
  starCount?: number;
  createdAt: number;
  updatedAt: number;
};

export const shouldScheduleDefAppearOnDate = (scheduleDef: ScheduleDef, date: Date): boolean => {
  if (scheduleDef.mode === 'sequence') return true;

  switch (scheduleDef.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      return date.getDay() === (scheduleDef.dayOfWeek ?? 0);
    case 'monthly':
      return date.getDate() === (scheduleDef.dayOfMonth ?? 1);
    case 'yearly':
      return (
        date.getMonth() === (scheduleDef.month ?? 0) &&
        date.getDate() === (scheduleDef.dayOfMonth ?? 1)
      );
    default:
      return true;
  }
};
