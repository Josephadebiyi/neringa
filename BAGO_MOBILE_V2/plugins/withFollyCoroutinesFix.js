/**
 * Config plugin: patch iOS build to fix Folly incompatibilities with the
 * prebuilt ReactNativeDependencies pod (RN 0.83.x + reanimated 4.2.1).
 *
 * Fixes applied:
 *
 * 1. 'folly/coro/Coroutine.h' file not found
 *    The prebuilt pod does not ship folly/coro/ headers. We suppress coroutine
 *    usage via preprocessor flags.
 *
 * 2. Undefined symbol F14LinkCheck<(F14IntrinsicsMode)1>::check()
 *    When using the prebuilt, F14Table.cpp is not compiled, so the F14 link-time
 *    check symbol is missing. We add a local pod (FollyF14Stub) that provides a
 *    weak no-op definition to satisfy the linker.
 *
 * 3. ShadowTreeCloner.cpp — no matching constructor for initialization of 'RawProps'
 *    RN 0.83.x's RawProps has an explicit copy constructor, so passing an lvalue
 *    requires std::move(). We patch the reanimated source file at prebuild time.
 */
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Ruby snippet inserted inside the post_install block
const postInstallFix = `
    # Fix Folly incompatibilities with prebuilt ReactNativeDependencies pod (RN 0.83.x)
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_NO_CONFIG=1'
        build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_CFG_NO_COROUTINES=1'
        build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_HAS_COROUTINES=0'
      end
    end`;

// Pod line inserted into the app target block
const STUB_POD_LINE = "  pod 'FollyF14Stub', :path => './FollyStubs'";

const withFollyCoroutinesFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const platformRoot = config.modRequest.platformProjectRoot;
      const podfilePath = path.join(platformRoot, 'Podfile');

      // ── 1. Patch ShadowTreeCloner.cpp (explicit RawProps copy ctor issue) ──
      // RN 0.83.x's RawProps has `explicit RawProps(const RawProps&)`.
      // Passing an lvalue rawProps to cloneProps(…, RawProps) requires std::move.
      const shadowTreeClonerPath = path.join(
        config.modRequest.projectRoot,
        'node_modules/react-native-reanimated/Common/cpp/Fabric/ShadowTreeCloner.cpp'
      );
      if (fs.existsSync(shadowTreeClonerPath)) {
        let src = fs.readFileSync(shadowTreeClonerPath, 'utf8');
        if (src.includes('source->getProps(), rawProps)') && !src.includes('std::move(rawProps)')) {
          src = src.replace(
            'source->getProps(), rawProps)',
            'source->getProps(), std::move(rawProps))'
          );
          fs.writeFileSync(shadowTreeClonerPath, src);
        }
      }

      // ── 2. Modify Podfile ───────────────────────────────────────────────
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      // 2a. Inject FollyF14Stub pod into the app target block (before closing end)
      //     We look for the use_react_native!(...) block end and insert after it.
      if (!podfile.includes("FollyF14Stub")) {
        // Insert just before `  post_install do` or before the target's closing `end`
        podfile = podfile.replace(
          /^(\s+post_install do \|installer\|)/m,
          `${STUB_POD_LINE}\n\n$1`
        );
      }

      // 2b. Inject preprocessor flag fix into post_install block
      if (!podfile.includes('FOLLY_CFG_NO_COROUTINES')) {
        podfile = podfile.replace(
          /\n  end\nend\n$/,
          `\n${postInstallFix}\n  end\nend\n`
        );
      }

      fs.writeFileSync(podfilePath, podfile);

      return config;
    },
  ]);
};

module.exports = withFollyCoroutinesFix;
