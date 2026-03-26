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
 *    check symbol is missing. We create a local pod (FollyF14Stub) that provides a
 *    weak no-op definition to satisfy the linker. The ios/ directory is git-ignored
 *    in Expo managed workflow, so the plugin writes the stub files at prebuild time.
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

// The weak no-op C++ stub that satisfies the missing F14LinkCheck symbol.
// Uses __asm__ to bind to the exact Itanium-mangled name so it works whether
// or not the real Folly symbol is present (weak wins over nothing, real wins over weak).
const STUB_CPP = `/**
 * Weak no-op stub for the missing Folly F14 link check symbol.
 *
 * When using the prebuilt ReactNativeDependencies pod (React Native 0.83.x),
 * folly/container/detail/F14Table.cpp is NOT compiled from source. That file
 * normally provides the explicit template instantiation for:
 *
 *   folly::f14::detail::F14LinkCheck<(F14IntrinsicsMode)1>::check()
 *
 * react-native-reanimated 4.2.1's CSSAnimationsRegistry.cpp uses folly::dynamic
 * (which internally uses F14NodeMap), triggering a link-time reference to this
 * symbol on arm64 (NEON intrinsics mode = 1). Without the source compilation, the
 * symbol is absent and the linker fails.
 *
 * This file provides a WEAK no-op definition so that:
 * - If the real symbol exists (from RCT-Folly source build), it takes precedence.
 * - If the real symbol is absent (prebuilt), this stub satisfies the linker.
 */

// Declare stub with __asm__ binding to the exact C++ mangled symbol name.
// On Apple platforms, C++ symbols in .o files have a leading _ added by the ABI,
// so the mangled form "__ZN..." maps to the linker symbol "_ZN...".
__attribute__((visibility("default"), weak))
void folly_f14_link_check_stub_noop() noexcept
    __asm__("__ZN5folly3f146detail12F14LinkCheckILNS1_17F14IntrinsicsModeE1EE5checkEv");

__attribute__((visibility("default"), weak))
void folly_f14_link_check_stub_noop() noexcept {}
`;

const STUB_PODSPEC = `Pod::Spec.new do |s|
  s.name         = 'FollyF14Stub'
  s.version      = '1.0.0'
  s.summary      = 'Weak no-op stub for missing Folly F14 link check symbol (RN 0.83.x + reanimated 4.2.1)'
  s.homepage     = 'https://github.com/facebook/folly'
  s.license      = { :type => 'MIT' }
  s.authors      = 'stub'
  s.platforms    = { :ios => '15.1' }
  s.source       = { :path => '.' }
  s.source_files = '*.cpp'
  # No dependencies — this file intentionally avoids including Folly headers
  # to prevent ODR violations. The function is bound to the C++ symbol via __asm__.
  s.pod_target_xcconfig = {
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++20',
  }
end
`;

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

      // ── 2. Write FollyStubs pod files into the ios/ directory ───────────
      // ios/ is git-ignored in Expo managed workflow, so we must create these
      // files at prebuild time so pod install can find them.
      const stubsDir = path.join(platformRoot, 'FollyStubs');
      if (!fs.existsSync(stubsDir)) {
        fs.mkdirSync(stubsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(stubsDir, 'FollyF14Stub.cpp'), STUB_CPP);
      fs.writeFileSync(path.join(stubsDir, 'FollyF14Stub.podspec'), STUB_PODSPEC);

      // ── 3. Modify Podfile ───────────────────────────────────────────────
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      // 3a. Inject FollyF14Stub pod into the app target block (before post_install)
      if (!podfile.includes("FollyF14Stub")) {
        podfile = podfile.replace(
          /^(\s+post_install do \|installer\|)/m,
          `${STUB_POD_LINE}\n\n$1`
        );
      }

      // 3b. Inject preprocessor flag fix into post_install block
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
