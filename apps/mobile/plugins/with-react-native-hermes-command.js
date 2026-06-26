const { withAppBuildGradle, withMainApplication } = require("@expo/config-plugins");

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

function patchMainApplication(contents) {
  const packageMatch = contents.match(/^package\s+(.+)$/m);
  const packageName = packageMatch?.[1] ?? "com.subscriptionsavvy.mobile";

  return `package ${packageName}

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
    this,
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        }

      override fun getJSMainModuleName(): String = "index"

      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
`;
}

module.exports = function withReactNativeHermesCommand(config) {
  config = withAppBuildGradle(config, (config) => {
    config.modResults.contents = patchBuildGradle(config.modResults.contents);
    return config;
  });

  return withMainApplication(config, (config) => {
    if (config.modResults.language === "kt") {
      config.modResults.contents = patchMainApplication(config.modResults.contents);
    }
    return config;
  });
};
