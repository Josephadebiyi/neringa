import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

interface AppTextProps extends TextProps {
  variant?: 'body' | 'label' | 'heading' | 'caption';
}

export function AppText({ style, variant = 'body', ...props }: AppTextProps) {
  return (
    <Text
      style={[styles.base, styles[variant], style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: COLORS.dark,
    fontFamily: 'System',
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  caption: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray,
  },
});
