const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Root of the monorepo
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Resolve order: local first, then root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Explicitly map all @react-native/* sub-packages that live nested
//    inside the root react-native copy (they are not hoisted)
config.resolver.extraNodeModules = {
  "@react-native/virtualized-lists": path.resolve(
    workspaceRoot,
    "node_modules/react-native/node_modules/@react-native/virtualized-lists"
  ),
};

// 4. Disable package exports so Metro uses classic node resolution
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./global.css" });
