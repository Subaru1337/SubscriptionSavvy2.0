const { withAppBuildGradle } = require("@expo/config-plugins");

const REACT_NATIVE_DIR_RESOLVER =
  'def reactNativePackageDir = new File(["node", "--print", "require.resolve(\'react-native/package.json\')"].execute(null, rootDir).text.trim()).getParentFile().getAbsoluteFile()';

const OLD_REACT_NATIVE_DIR =
  'reactNativeDir = new File(["node", "--print", "require.resolve(\'react-native/package.json\')"].execute(null, rootDir).text.trim()).getParentFile().getAbsoluteFile()';

const OLD_HERMES_COMMAND =
  'hermesCommand = new File(["node", "--print", "require.resolve(\'hermes-compiler/package.json\', { paths: [require.resolve(\'react-native/package.json\')] })"].execute(null, rootDir).text.trim()).getParentFile().getAbsolutePath() + "/hermesc/%OS-BIN%/hermesc"';

function patchBuildGradle(contents) {
  let patched = contents;

  if (!patched.includes(REACT_NATIVE_DIR_RESOLVER)) {
    patched = patched.replace(
      "def projectRoot = rootDir.getAbsoluteFile().getParentFile().getAbsolutePath()",
      `def projectRoot = rootDir.getAbsoluteFile().getParentFile().getAbsolutePath()\n${REACT_NATIVE_DIR_RESOLVER}`
    );
  }

  patched = patched.replace(
    OLD_REACT_NATIVE_DIR,
    "reactNativeDir = reactNativePackageDir"
  );

  patched = patched.replace(
    OLD_HERMES_COMMAND,
    'hermesCommand = new File(reactNativePackageDir, "sdks/hermesc/%OS-BIN%/hermesc").getAbsolutePath()'
  );

  return patched;
}

module.exports = function withReactNativeHermesCommand(config) {
  return withAppBuildGradle(config, (config) => {
    config.modResults.contents = patchBuildGradle(config.modResults.contents);
    return config;
  });
};
