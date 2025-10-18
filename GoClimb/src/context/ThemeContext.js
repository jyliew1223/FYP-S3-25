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

  const colors = resolvedMode === 'light' ? lightColors : darkColors;
  const navTheme = resolvedMode === 'light' ? navLight : navDark;

  const setPreference = async (p) => {
    setPreferenceState(p);
    try { await AsyncStorage.setItem(KEY, p); } catch {}
  };

  const value = useMemo(() => ({ preference, colors, navTheme, setPreference }), [preference, colors, navTheme]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
