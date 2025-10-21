// GoClimb/src/theme/themes.js
import { DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';

export const lightColors = {
  mode: 'light',
  bg: '#FFFFFF',
  surface: '#F7F7F7',
  surfaceAlt: '#EFEFEF',
  text: '#111111',
  textDim: '#555555',
  border: 'rgba(0,0,0,0.08)',
  divider: 'rgba(0,0,0,0.08)',
  overlay: 'rgba(0,0,0,0.35)',
  accent: '#379636',
  danger: '#D32F2F',
};

export const darkColors = {
  mode: 'dark',
  bg: '#121212',
  surface: '#1E1E1E',
  surfaceAlt: '#2A2A2A',
  text: '#DDDDDD',
  textDim: '#AAAAAA',
  border: 'rgba(255,255,255,0.10)',
  divider: 'rgba(255,255,255,0.06)',
  overlay: 'rgba(0,0,0,0.45)',
  accent: '#379636',
  danger: '#EF5350',
};

// IMPORTANT: inherit nav defaults (brings in `fonts` + other keys),
// then override only colors so the shape stays correct.
export const navLight = {
  ...NavDefaultTheme,
  colors: {
    ...NavDefaultTheme.colors,
    primary: lightColors.accent,
    background: lightColors.bg,
    card: lightColors.surface,
    text: lightColors.text,
    border: lightColors.border,
    notification: lightColors.accent,
  },
};

export const navDark = {
  ...NavDarkTheme,
  colors: {
    ...NavDarkTheme.colors,
    primary: darkColors.accent,
    background: darkColors.bg,
    card: darkColors.surface,
    text: darkColors.text,
    border: darkColors.border,
    notification: darkColors.accent,
  },
};
