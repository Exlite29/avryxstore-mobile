import { useTheme } from '@/context/theme';

export const lightColors = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#18181B',
  muted: '#71717A',
  border: '#E4E4E7',
  primary: '#18181B',
  primaryMuted: '#F4F4F5',
  primaryForeground: '#FFFFFF',
  danger: '#EF4444',
  dangerForeground: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  white: '#FFFFFF',
};

export const darkColors: typeof lightColors = {
  background: '#18181B',
  card: '#27272A',
  text: '#FAFAFA',
  muted: '#A1A1AA',
  border: '#3F3F46',
  primary: '#E4E4E7',
  primaryMuted: '#3F3F46',
  primaryForeground: '#18181B',
  danger: '#F87171',
  dangerForeground: '#18181B',
  success: '#34D399',
  warning: '#FBBF24',
  white: '#FFFFFF',
};

export type ThemeColors = typeof lightColors;

export function useAppColors(): ThemeColors {
  const { resolvedScheme } = useTheme();
  return resolvedScheme === 'dark' ? darkColors : lightColors;
}

export function formatPHP(value: unknown): string {
  const n = Number(value || 0);
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(value: number | string): string {
  return Number(value || 0).toLocaleString('en-PH');
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}