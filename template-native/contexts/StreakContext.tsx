import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import type { StreakData } from '@/lib/schedules/types';
import { loadStreak, saveStreak, getTodayDateString } from '@/lib/schedules/storage';

type StreakContextType = {
  streak: number;
  isLoading: boolean;
  recordActivity: () => Promise<void>;
  reload: () => Promise<void>;
};

const StreakContext = createContext<StreakContextType | null>(null);

const getDaysBetween = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const StreakProvider = ({ children }: { children: ReactNode }) => {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    lastActivityDate: null
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadAndCheckStreak = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await loadStreak();
      const today = getTodayDateString();

      if (loaded.lastActivityDate && loaded.lastActivityDate !== today) {
        const daysMissed = getDaysBetween(loaded.lastActivityDate, today);

        if (daysMissed > 1) {
          const resetStreak: StreakData = {
            currentStreak: 0,
            lastActivityDate: loaded.lastActivityDate
          };
          await saveStreak(resetStreak);
          setStreakData(resetStreak);
        } else {
          setStreakData(loaded);
        }
      } else {
        setStreakData(loaded);
      }
    } catch (error) {
      console.error('Failed to load streak:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAndCheckStreak();
  }, [loadAndCheckStreak]);

  const recordActivity = useCallback(async () => {
    const today = getTodayDateString();

    if (streakData.lastActivityDate === today) {
      return;
    }

    let newStreak: number;

    if (streakData.lastActivityDate === null) {
      newStreak = 1;
    } else {
      const daysSinceLastActivity = getDaysBetween(streakData.lastActivityDate, today);

      if (daysSinceLastActivity === 1) {
        newStreak = streakData.currentStreak + 1;
      } else if (daysSinceLastActivity > 1) {
        newStreak = 1;
      } else {
        newStreak = streakData.currentStreak;
      }
    }

    const newStreakData: StreakData = {
      currentStreak: newStreak,
      lastActivityDate: today
    };

    await saveStreak(newStreakData);
    setStreakData(newStreakData);
  }, [streakData]);

  return (
    <StreakContext.Provider
      value={{
        streak: streakData.currentStreak,
        isLoading,
        recordActivity,
        reload: loadAndCheckStreak
      }}
    >
      {children}
    </StreakContext.Provider>
  );
};

export const useStreakContext = () => {
  const context = useContext(StreakContext);
  if (!context) throw new Error('useStreakContext must be used within StreakProvider');
  return context;
};
