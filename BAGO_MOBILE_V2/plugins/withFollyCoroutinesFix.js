/**
 * Config plugin: disable Folly coroutines to fix
 * 'folly/coro/Coroutine.h' file not found on EAS iOS builds (RN 0.83.x).
 */
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const follyFix = `
    # Fix: 'folly/coro/Coroutine.h' file not found on EAS builds (RN 0.83.x)
    # folly/Expected.h unconditionally includes folly/coro/Coroutine.h but the
    # prebuilt ReactNativeDependencies pod does not ship that header.
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_NO_CONFIG=1'
        build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_CFG_NO_COROUTINES=1'
        build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_HAS_COROUTINES=0'
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
