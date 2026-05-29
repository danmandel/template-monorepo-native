import type { ScheduleDef } from '@/src/modules/scheduleDef';
import { shouldScheduleDefAppearOnDate } from '@/src/modules/scheduleDef';
import type { TodoDef } from '@/src/modules/todoDef';

export type Schedule = {
  id: string;
  userId?: string;
  scheduleDefId: string;
  scheduleDef: ScheduleDef;
  isActive: boolean;
  color?: string;
  installedAt: number;
  createdAt: number;
  updatedAt: number;
};

export type ScheduleDraft = {
  title: string;
  emoji?: string;
  description?: string;
  mode?: ScheduleDef['mode'];
  visibility?: ScheduleDef['visibility'];
  frequency?: ScheduleDef['frequency'];
  dayOfWeek?: number;
  dayOfMonth?: number;
  month?: number;
  todoDefs?: TodoDef[];
  isActive: boolean;
  color?: string;
};

export const getScheduleTitle = (schedule: Schedule): string => schedule.scheduleDef.title;

export const getScheduleEmoji = (schedule: Schedule): string | undefined =>
  schedule.scheduleDef.emoji;

export const getScheduleDescription = (schedule: Schedule): string | undefined =>
  schedule.scheduleDef.description;

export const getScheduleMode = (schedule: Schedule): ScheduleDef['mode'] =>
  schedule.scheduleDef.mode;

export const getScheduleFrequency = (schedule: Schedule): ScheduleDef['frequency'] =>
  schedule.scheduleDef.frequency;

export const getScheduleTodoDefs = (schedule: Schedule): TodoDef[] => schedule.scheduleDef.todoDefs;

export const shouldScheduleAppearOnDate = (schedule: Schedule, date: Date): boolean =>
  shouldScheduleDefAppearOnDate(schedule.scheduleDef, date);
