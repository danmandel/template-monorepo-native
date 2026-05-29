import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type AchievementBannerContextType = {
  isVisible: boolean;
  message: string;
  show: (message?: string) => void;
  hide: () => void;
};

const AchievementBannerContext = createContext<AchievementBannerContextType | null>(null);

const DEFAULT_MESSAGE = 'Completed';
const DISPLAY_DURATION = 2500;

export const AchievementBannerProvider = ({ children }: { children: ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  const show = useCallback(
    (msg?: string) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setMessage(msg ? `Completed: ${msg}` : DEFAULT_MESSAGE);
      setIsVisible(true);

      // Auto-hide after duration
      timeoutRef.current = setTimeout(() => {
        hide();
      }, DISPLAY_DURATION);
    },
    [hide]
  );

  return (
    <AchievementBannerContext.Provider value={{ isVisible, message, show, hide }}>
      {children}
    </AchievementBannerContext.Provider>
  );
};

export const useAchievementBanner = () => {
  const context = useContext(AchievementBannerContext);
  if (!context) {
    throw new Error('useAchievementBanner must be used within AchievementBannerProvider');
  }
  return context;
};
