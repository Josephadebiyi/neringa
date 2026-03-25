/**
 * Config plugin: patch Folly preprocessor definitions to fix EAS iOS builds (RN 0.83.x).
 *
 * Fixes:
 *  1. 'folly/coro/Coroutine.h' file not found — prebuilt ReactNativeDependencies
 *     pod does not ship folly/coro/ headers.
 *  2. Undefined symbol folly::f14::detail::F14LinkCheck<kAuto>::check() — the
 *     prebuilt Folly pod does not export this SIMD intrinsics link-check symbol.
 *     Setting FOLLY_F14_VECTOR_INTRINSICS_ENABLE=0 prevents the link-time check
 *     from being emitted during reanimated compilation.
 */
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const follyFix = `
    # Fix Folly incompatibilities with prebuilt ReactNativeDependencies pod (RN 0.83.x)
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_NO_CONFIG=1'
        build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_CFG_NO_COROUTINES=1'
        build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_HAS_COROUTINES=0'
        build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_F14_VECTOR_INTRINSICS_ENABLE=0'
      end
    end`;

const withFollyCoroutinesFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      if (!podfile.includes('FOLLY_HAS_COROUTINES')) {
        // Insert the fix right before the closing `  end` of the post_install block.
        // The post_install block ends with `  )` then `  end` (2-space indent).
        // Podfile ends with: `    )\n  end\nend\n`
        // Insert fix before the post_install's closing `  end`
        podfile = podfile.replace(
          /\n  end\nend\n$/,
          `\n${follyFix}\n  end\nend\n`
        );
        fs.writeFileSync(podfilePath, podfile);
      }

      return config;
    },
  ]);
};

module.exports = withFollyCoroutinesFix;
