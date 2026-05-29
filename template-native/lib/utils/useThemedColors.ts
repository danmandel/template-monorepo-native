import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';

/**
 * Hook that returns the current theme colors
 * Reduces boilerplate from:
 *   const colorScheme = useColorScheme() ?? 'dark';
 *   const colors = Colors[colorScheme];
 * To:
 *   const colors = useThemedColors();
 */
export const useThemedColors = () => {
  const colorScheme = useColorScheme() ?? 'dark';
  return Colors[colorScheme];
};
