const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Resolve native-only modules for web platform
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // List of native-only modules that should be mocked on web
  const nativeOnlyModules = [
    '@stripe/stripe-react-native',
    'expo-local-authentication',
    'expo-notifications',
  ];

  if (platform === 'web' && nativeOnlyModules.some(mod => moduleName.startsWith(mod))) {
    // Return a mock module for web
    return {
      type: 'empty',
    };
  }

  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
