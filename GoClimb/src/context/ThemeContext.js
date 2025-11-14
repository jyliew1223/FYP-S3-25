// GoClimb/src/context/ThemeContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, navDark, navLight } from '../theme/themes';

const KEY = '@themePreference'; // 'dark' | 'light' | 'system'

const ThemeCtx = createContext({
  preference: 'system',
  colors: darkColors,
  navTheme: navDark,
  setPreference: (_p) => {},
});

export function ThemeProvider({ children }) {
  const system = useColorScheme(); // 'dark' | 'light' | null
  const [preference, setPreferenceState] = useState('system');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(KEY);
        if (saved) setPreferenceState(saved);
      } catch {}
    })();
  }, []);

  const resolvedMode = useMemo(() => {
    if (preference === 'system') return system === 'light' ? 'light' : 'dark';
    return preference;
  }, [preference, system]);

  const colors = useMemo(() => {
    const selectedColors = resolvedMode === 'light' ? lightColors : darkColors;
    // Ensure all required color properties exist
    return {
      mode: selectedColors.mode || 'dark',
      bg: selectedColors.bg || '#121212',
      surface: selectedColors.surface || '#1E1E1E',
      surfaceAlt: selectedColors.surfaceAlt || '#2A2A2A',
      text: selectedColors.text || '#DDDDDD',
      textDim: selectedColors.textDim || '#AAAAAA',
      border: selectedColors.border || 'rgba(255,255,255,0.10)',
      divider: selectedColors.divider || 'rgba(255,255,255,0.06)',
      overlay: selectedColors.overlay || 'rgba(0,0,0,0.45)',
      accent: selectedColors.accent || '#379636',
      danger: selectedColors.danger || '#EF5350',
    };
  }, [resolvedMode]);
  
  const navTheme = useMemo(() => {
    return resolvedMode === 'light' ? navLight : navDark;
  }, [resolvedMode]);

  const setPreference = async (p) => {
    console.log('[ThemeContext] Setting preference to:', p);
    console.log('[ThemeContext] Current system theme:', system);
    setPreferenceState(p);
    try { 
      await AsyncStorage.setItem(KEY, p); 
      console.log('[ThemeContext] Preference saved to AsyncStorage');
    } catch (error) {
      console.log('[ThemeContext] Error saving preference:', error);
    }
  };

  const value = useMemo(() => {
    // Ensure we never provide undefined values
    return {
      preference: preference || 'system',
      colors: colors || darkColors,
      navTheme: navTheme || navDark,
      setPreference: setPreference || (() => {}),
    };
  }, [preference, colors, navTheme, setPreference]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
