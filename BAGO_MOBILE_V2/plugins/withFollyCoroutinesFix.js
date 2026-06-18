const { withPodfileProperties } = require('@expo/config-plugins');

module.exports = function withFollyCoroutinesFix(config) {
  return withPodfileProperties(config, (config) => {
    config.modResults['ios.useFrameworks'] = 'static';
    return config;
  });
};
