import type { ColorScheme } from '@/constants/Colors';
import { useTheme } from '@/contexts';

export const useColorScheme = (): ColorScheme => {
  return useTheme().colorScheme;
};
