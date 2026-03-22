import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Chrome } from './Icon';

const COLORS = {
  white: '#FFFFFF',
  gray200: '#E5E7EB',
  gray600: '#4B5563',
  gray900: '#111827',
  googleRed: '#DB4437',
};

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  text?: string;
}

export default function GoogleSignInButton({
  onPress,
  loading = false,
  disabled = false,
  text = 'Continue with Google',
}: GoogleSignInButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        styles.button,
        (pressed || loading || disabled) && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.gray600} />
      ) : (
        <View style={styles.content}>
          <Chrome size={20} color={COLORS.googleRed} />
          <Text style={styles.text}>{text}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.gray900,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});
