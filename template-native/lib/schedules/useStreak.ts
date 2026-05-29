import { useCallback, useEffect, useState } from 'react';

import type { StreakData } from './types';
import { loadStreak, saveStreak, getTodayDateString } from './storage';

export type StreakState = {
  streak: number;
  isLoading: boolean;
};

export type StreakActions = {
  recordActivity: () => Promise<void>;
  reload: () => Promise<void>;
};

const getDaysBetween = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const useStreak = (): StreakState & StreakActions => {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    lastActivityDate: null
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load and check streak data
  const loadAndCheckStreak = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await loadStreak();
      const today = getTodayDateString();

      // Check if a day was missed
      if (loaded.lastActivityDate && loaded.lastActivityDate !== today) {
        const daysMissed = getDaysBetween(loaded.lastActivityDate, today);

        if (daysMissed > 1) {
          // Missed more than one day - reset streak to 0
          const resetStreak: StreakData = {
            currentStreak: 0,
            lastActivityDate: loaded.lastActivityDate
          };
          await saveStreak(resetStreak);
          setStreakData(resetStreak);
        } else {
          // Yesterday was last activity, streak is still valid (will increment on next completion)
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

  // Load streak on mount
  useEffect(() => {
    void loadAndCheckStreak();
  }, [loadAndCheckStreak]);

  // Record activity for today (call when a todo is completed)
  const recordActivity = useCallback(async () => {
    const today = getTodayDateString();

    // Already recorded activity today
    if (streakData.lastActivityDate === today) {
      return;
    }

    let newStreak: number;

    if (streakData.lastActivityDate === null) {
      // First ever activity
      newStreak = 1;
    } else {
      const daysSinceLastActivity = getDaysBetween(streakData.lastActivityDate, today);

      if (daysSinceLastActivity === 1) {
        // Consecutive day - increment streak
        newStreak = streakData.currentStreak + 1;
      } else if (daysSinceLastActivity > 1) {
        // Missed days - start fresh at 1
        newStreak = 1;
      } else {
        // Same day (shouldn't happen due to early return)
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

  return {
    streak: streakData.currentStreak,
    isLoading,
    recordActivity,
    reload: loadAndCheckStreak
  };
};
