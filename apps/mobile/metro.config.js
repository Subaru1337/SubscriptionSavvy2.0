const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Root of the monorepo
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

// Ensure worker processes can find packages in apps/mobile/node_modules
// This is critical for babel-preset-expo and its @babel/* dependencies
const mobileNodeModules = path.resolve(projectRoot, "node_modules");
const rootNodeModules = path.resolve(workspaceRoot, "node_modules");

// Add mobile node_modules to NODE_PATH so worker subprocess can find packages
if (!process.env.NODE_PATH) {
  process.env.NODE_PATH = mobileNodeModules;
} else if (!process.env.NODE_PATH.includes(mobileNodeModules)) {
  process.env.NODE_PATH = mobileNodeModules + path.delimiter + process.env.NODE_PATH;
}

// Lazy-load nativewind/metro to avoid it running before NODE_PATH is set
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo (preserve Expo defaults)
config.watchFolders = [...new Set([...(config.watchFolders ?? []), workspaceRoot])];

// 2. Resolve order: local first, then root
config.resolver.nodeModulesPaths = [
  mobileNodeModules,
  rootNodeModules,
];

// 3. Explicitly map packages that may not resolve correctly across workspaces
config.resolver.extraNodeModules = {
  // Some @react-native/* packages live nested inside the root react-native copy
  "@react-native/virtualized-lists": path.resolve(
    rootNodeModules,
    "react-native/node_modules/@react-native/virtualized-lists"
  ),
};

// 4. Disable package exports so Metro uses classic node resolution
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./global.css" });
