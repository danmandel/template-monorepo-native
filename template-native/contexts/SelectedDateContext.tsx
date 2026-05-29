import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export type ProgressPeriod = 'day' | 'week' | 'month' | 'year';

type SelectedDateContextType = {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  isToday: boolean;
  goToToday: () => void;
  formatHeader: () => string;
  // Progress period
  selectedPeriod: ProgressPeriod;
  setSelectedPeriod: (period: ProgressPeriod) => void;
  formatProgressHeader: () => string;
  // Date picker visibility
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
};

const SelectedDateContext = createContext<SelectedDateContextType | null>(null);

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Get ISO week number
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

export const SelectedDateProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<ProgressPeriod>('day');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isToday = isSameDay(selectedDate, new Date());

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const formatHeader = useCallback(() => {
    const weekday = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const month = selectedDate.toLocaleDateString('en-US', { month: 'short' });
    const day = selectedDate.getDate();
    return `${weekday} ${month} ${day}`;
  }, [selectedDate]);

  const formatProgressHeader = useCallback(() => {
    switch (selectedPeriod) {
      case 'day': {
        const weekday = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
        const month = selectedDate.toLocaleDateString('en-US', { month: 'short' });
        const day = selectedDate.getDate();
        return `${weekday} ${month} ${day}`;
      }
      case 'week': {
        const weekNum = getWeekNumber(selectedDate);
        return `Week ${weekNum}`;
      }
      case 'month': {
        return selectedDate.toLocaleDateString('en-US', { month: 'long' });
      }
      case 'year': {
        return selectedDate.getFullYear().toString();
      }
    }
  }, [selectedDate, selectedPeriod]);

  return (
    <SelectedDateContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        isToday,
        goToToday,
        formatHeader,
        selectedPeriod,
        setSelectedPeriod,
        formatProgressHeader,
        showDatePicker,
        setShowDatePicker
      }}
    >
      {children}
    </SelectedDateContext.Provider>
  );
};

export const useSelectedDate = () => {
  const context = useContext(SelectedDateContext);
  if (!context) throw new Error('useSelectedDate must be used within SelectedDateProvider');
  return context;
};
