import { useTheme, type TimeFormatPreference } from '@/contexts';

type TimeFormatOptions = {
  meridiemCase?: 'lower' | 'upper';
  includeSpaceBeforeMeridiem?: boolean;
};

const DEFAULT_OPTIONS: Required<TimeFormatOptions> = {
  meridiemCase: 'lower',
  includeSpaceBeforeMeridiem: false
};

export const formatHoursAndMinutes = (
  hours: number,
  minutes: number,
  preference: TimeFormatPreference,
  options: TimeFormatOptions = DEFAULT_OPTIONS
) => {
  const normalizedHours = Math.max(0, Math.min(23, hours));
  const normalizedMinutes = Math.max(0, Math.min(59, minutes));

  if (preference === '24h') {
    return `${normalizedHours.toString().padStart(2, '0')}:${normalizedMinutes.toString().padStart(2, '0')}`;
  }

  const meridiem =
    normalizedHours >= 12
      ? options.meridiemCase === 'upper'
        ? 'PM'
        : 'pm'
      : options.meridiemCase === 'upper'
        ? 'AM'
        : 'am';
  const displayHours = normalizedHours % 12 || 12;
  const spacing = options.includeSpaceBeforeMeridiem ? ' ' : '';

  return `${displayHours}:${normalizedMinutes.toString().padStart(2, '0')}${spacing}${meridiem}`;
};

export const formatTimestamp = (
  timestamp: number,
  preference: TimeFormatPreference,
  options: TimeFormatOptions = DEFAULT_OPTIONS
) => {
  const date = new Date(timestamp);
  return formatHoursAndMinutes(date.getHours(), date.getMinutes(), preference, options);
};

export const formatMinutesOfDay = (
  totalMinutes: number,
  preference: TimeFormatPreference,
  options: TimeFormatOptions = DEFAULT_OPTIONS
) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return formatHoursAndMinutes(hours, minutes, preference, options);
};

export const formatStoredTime = (
  time: string,
  preference: TimeFormatPreference,
  options: TimeFormatOptions = DEFAULT_OPTIONS
) => {
  const [hours, minutes] = time.split(':').map(Number);
  return formatHoursAndMinutes(hours, minutes, preference, options);
};

export const useTimeFormatter = () => {
  const { timeFormatPreference } = useTheme();

  return {
    timeFormatPreference,
    formatHoursAndMinutes: (hours: number, minutes: number, options?: TimeFormatOptions) =>
      formatHoursAndMinutes(hours, minutes, timeFormatPreference, options),
    formatTimestamp: (timestamp: number, options?: TimeFormatOptions) =>
      formatTimestamp(timestamp, timeFormatPreference, options),
    formatMinutesOfDay: (totalMinutes: number, options?: TimeFormatOptions) =>
      formatMinutesOfDay(totalMinutes, timeFormatPreference, options),
    formatStoredTime: (time: string, options?: TimeFormatOptions) =>
      formatStoredTime(time, timeFormatPreference, options)
  };
};
