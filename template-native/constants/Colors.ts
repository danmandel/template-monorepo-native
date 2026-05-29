// Dail.ly refined color palette
// Design direction: Warm, elegant minimalism with subtle depth

export const Colors = {
  light: {
    text: '#1c1917', // stone-900 - warm black
    textSecondary: '#57534e', // stone-600
    textMuted: '#a8a29e', // stone-400
    background: '#fafaf9', // stone-50 - warm white
    backgroundSecondary: '#f5f5f4', // stone-100
    card: '#ffffff',
    border: 'rgba(28, 25, 23, 0.08)', // subtle warm border
    tint: '#3b82f6', // blue-500 - refined blue
    tintMuted: 'rgba(59, 130, 246, 0.12)',
    tabIconDefault: '#a8a29e',
    tabIconSelected: '#3b82f6',
    positive: '#22c55e', // green-500
    negative: '#ef4444', // red-500
    warning: '#f59e0b' // amber-500
  },
  dark: {
    text: '#fafaf9', // stone-50 - warm white
    textSecondary: '#a8a29e', // stone-400
    textMuted: '#78716c', // stone-500
    background: '#0c0a09', // stone-950 - warm black
    backgroundSecondary: '#1c1917', // stone-900
    card: '#292524', // stone-800
    border: 'rgba(250, 250, 249, 0.06)', // subtle warm border
    tint: '#60a5fa', // blue-400 - softer blue for dark mode
    tintMuted: 'rgba(96, 165, 250, 0.15)',
    tabIconDefault: '#78716c',
    tabIconSelected: '#60a5fa',
    positive: '#4ade80', // green-400
    negative: '#f87171', // red-400
    warning: '#fbbf24' // amber-400
  }
};

export type ColorScheme = keyof typeof Colors;
export type ColorName = keyof typeof Colors.dark;
