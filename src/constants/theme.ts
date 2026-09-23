import { useColorScheme } from 'react-native';

export const lightColors = {
  background: '#F4F6F8',
  card: '#FFFFFF',
  text: '#101828',
  muted: '#667085',
  border: '#EAECF0',
  primary: '#0A7EA4',
  primaryMuted: '#E0F2F8',
  danger: '#D92D20',
  success: '#079455',
  warning: '#B54708',
  white: '#FFFFFF',
};

export const darkColors: typeof lightColors = {
  background: '#0B0F19',
  card: '#151B26',
  text: '#F2F4F7',
  muted: '#98A2B3',
  border: '#1D2939',
  primary: '#41B6E6',
  primaryMuted: '#123047',
  danger: '#F97066',
  success: '#32D583',
  warning: '#FDB022',
  white: '#FFFFFF',
};

export type ThemeColors = typeof lightColors;

export function useAppColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
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