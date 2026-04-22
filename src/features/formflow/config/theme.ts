export const COLORS = {
  dark: {
    bg: '#0D0F14',
    surface: '#161A24',
    surface2: '#1E2333',
    surfaceTraditional: '#1A1814',  // warmer — "old world"
    surfaceAI: '#141824',            // cooler — "new world"
    border: '#2A3045',
    accent: '#6C63FF',
    accentDim: '#3D3880',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    text1: '#F0F2F8',
    text2: '#8B92A8',
    text3: '#545B72',
  },
  light: {
    bg: '#F8F9FC',
    surface: '#FFFFFF',
    surface2: '#F0F2F8',
    surfaceTraditional: '#FBF9F6',
    surfaceAI: '#F4F6FB',
    border: '#E2E6EF',
    accent: '#6C63FF',
    accentDim: '#C4C0FF',
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    text1: '#111827',
    text2: '#6B7280',
    text3: '#9CA3AF',
  },
} as const;

export type ColorMode = keyof typeof COLORS;
export type ColorToken = keyof typeof COLORS.dark;
