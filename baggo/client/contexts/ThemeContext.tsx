import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';
type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setTheme: (theme: Theme) => void;
  colors: typeof lightColors;
}

const lightColors = {
  primary: '#5845D8',
  primaryDark: '#4534B8',
  secondary: '#E8B86D',
  gold: '#F5C563',
  white: '#FFFFFF',
  background: '#F8F6F3',
  backgroundLight: '#FDF9F1',
  cream: '#E8D5B7',
  text: '#1A1A1A',
  textLight: '#6B6B6B',
  textMuted: '#9E9E9E',
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  success: '#4CAF50',
  successLight: '#81C784',
  error: '#F44336',
  warning: '#FF9800',
  cardBg: '#FFFFFF',
  purple: '#5845D8',
  purpleLight: '#7B68EE',
  shadow: 'rgba(0, 0, 0, 0.08)',
};

const darkColors = {
  primary: '#7B68EE',
  primaryDark: '#6B58DE',
  secondary: '#F5C563',
  gold: '#FFD700',
  white: '#1E1E1E',
  background: '#121212',
  backgroundLight: '#1E1E1E',
  cream: '#2A2A2A',
  text: '#FFFFFF',
  textLight: '#B0B0B0',
  textMuted: '#808080',
  border: '#333333',
  borderLight: '#2A2A2A',
  success: '#66BB6A',
  successLight: '#4CAF50',
  error: '#EF5350',
  warning: '#FFA726',
  cardBg: '#1E1E1E',
  purple: '#7B68EE',
  purpleLight: '#9B88FF',
  shadow: 'rgba(0, 0, 0, 0.3)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  const [themeMode, setThemeMode] = useState<ThemeMode>(systemColorScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    if (theme === 'system') {
      setThemeMode(systemColorScheme === 'dark' ? 'dark' : 'light');
    }
  }, [systemColorScheme, theme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme) {
        setThemeState(savedTheme as Theme);
        if (savedTheme !== 'system') {
          setThemeMode(savedTheme as ThemeMode);
        }
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem('app_theme', newTheme);

      if (newTheme === 'system') {
        setThemeMode(systemColorScheme === 'dark' ? 'dark' : 'light');
      } else {
        setThemeMode(newTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const colors = themeMode === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
