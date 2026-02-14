import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';
type ThemeMode = 'light' | 'dark';

// Comprehensive theme colors for full app coverage
const lightColors = {
  // Core colors
  primary: '#5845D8',
  primaryDark: '#4534B8',
  primaryLight: '#7B68EE',
  secondary: '#E8B86D',
  gold: '#F5C563',
  
  // Backgrounds
  background: '#F8F6F3',
  backgroundLight: '#FDF9F1',
  backgroundDark: '#F0EDE8',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardBg: '#FFFFFF',
  modal: '#FFFFFF',
  
  // Text colors
  text: '#1A1A1A',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textLight: '#6B6B6B',
  textMuted: '#9E9E9E',
  textInverse: '#FFFFFF',
  
  // Borders
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  borderDark: '#D0D0D0',
  
  // Status colors
  success: '#4CAF50',
  successLight: '#81C784',
  successBg: '#E8F5E9',
  error: '#F44336',
  errorLight: '#EF9A9A',
  errorBg: '#FFEBEE',
  warning: '#FF9800',
  warningLight: '#FFB74D',
  warningBg: '#FFF3E0',
  info: '#2196F3',
  infoBg: '#E3F2FD',
  
  // Special colors
  cream: '#E8D5B7',
  purple: '#5845D8',
  purpleLight: '#7B68EE',
  white: '#FFFFFF',
  black: '#000000',
  
  // Shadows and overlays
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Input colors
  inputBackground: '#FFFFFF',
  inputBorder: '#E5E5E5',
  inputText: '#1A1A1A',
  inputPlaceholder: '#9E9E9E',
  
  // Tab/Navigation
  tabActive: '#5845D8',
  tabInactive: '#9E9E9E',
  tabBackground: '#FFFFFF',
  
  // Specific UI elements
  headerBackground: '#FFFFFF',
  footerBackground: '#FFFFFF',
  divider: '#E5E5E5',
  skeleton: '#E0E0E0',
  disabled: '#BDBDBD',
  link: '#5845D8',
};

const darkColors = {
  // Core colors
  primary: '#7B68EE',
  primaryDark: '#6B58DE',
  primaryLight: '#9B88FF',
  secondary: '#F5C563',
  gold: '#FFD700',
  
  // Backgrounds
  background: '#121212',
  backgroundLight: '#1E1E1E',
  backgroundDark: '#0A0A0A',
  surface: '#1E1E1E',
  card: '#1E1E1E',
  cardBg: '#1E1E1E',
  modal: '#2A2A2A',
  
  // Text colors
  text: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textLight: '#B0B0B0',
  textMuted: '#808080',
  textInverse: '#1A1A1A',
  
  // Borders
  border: '#333333',
  borderLight: '#2A2A2A',
  borderDark: '#444444',
  
  // Status colors
  success: '#66BB6A',
  successLight: '#4CAF50',
  successBg: '#1B3D1F',
  error: '#EF5350',
  errorLight: '#E57373',
  errorBg: '#3D1B1B',
  warning: '#FFA726',
  warningLight: '#FFB74D',
  warningBg: '#3D2E1B',
  info: '#42A5F5',
  infoBg: '#1B2E3D',
  
  // Special colors
  cream: '#2A2A2A',
  purple: '#7B68EE',
  purpleLight: '#9B88FF',
  white: '#1E1E1E',
  black: '#FFFFFF',
  
  // Shadows and overlays
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowDark: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Input colors
  inputBackground: '#2A2A2A',
  inputBorder: '#444444',
  inputText: '#FFFFFF',
  inputPlaceholder: '#808080',
  
  // Tab/Navigation
  tabActive: '#7B68EE',
  tabInactive: '#808080',
  tabBackground: '#1E1E1E',
  
  // Specific UI elements
  headerBackground: '#1E1E1E',
  footerBackground: '#1E1E1E',
  divider: '#333333',
  skeleton: '#333333',
  disabled: '#555555',
  link: '#7B68EE',
};

export type ThemeColors = typeof lightColors;

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
  isDark: boolean;
}

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
  const isDark = themeMode === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setTheme, colors, isDark }}>
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

// Export theme colors for type checking
export { lightColors, darkColors };
