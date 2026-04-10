const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Find the project and workspace root
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Enable package exports and symbolic links for better monorepo support
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_enableSymlinks = true;

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

module.exports = withNativeWind(config, { input: "./global.css" });
