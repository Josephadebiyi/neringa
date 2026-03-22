import { Text, TextProps, StyleSheet, Platform } from 'react-native';
import { TYPOGRAPHY } from '../../constants/theme';

export function AppText(props: TextProps) {
  // Use System font as default, but ready for custom when loaded
  let fontFamily = Platform.select({
    ios: 'System', // This is SF Pro
    android: 'sans-serif-medium',
    default: 'system-ui'
  });
  
  const styleObj = StyleSheet.flatten(props.style || {});
  
  // Mapping standard weights to system weights more explicitly
  const fontWeight = styleObj.fontWeight || '400';

  // SF Pro Guidelines: Tight letter spacing for display
  const globalStyles = {
    fontFamily: fontFamily,
    letterSpacing: -0.2, 
    fontWeight: fontWeight,
  };

  return <Text {...props} style={[globalStyles, props.style]} />;
}
