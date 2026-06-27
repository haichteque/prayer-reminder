const { withGradleProperties } = require('@expo/config-plugins');

const withNdkVersion = (config) => {
  return withGradleProperties(config, (config) => {
    config.modResults.push({
      type: 'property',
      key: 'reactNativeNdkVersion',
      value: '26.1.10909125',
    });
    config.modResults.push({
      type: 'property',
      key: 'ndkVersion',
      value: '26.1.10909125',
    });
    return config;
  });
};

module.exports = withNdkVersion;
