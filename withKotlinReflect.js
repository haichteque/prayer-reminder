const { withAppBuildGradle } = require('@expo/config-plugins');

const withKotlinReflect = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('kotlin-reflect')) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation "org.jetbrains.kotlin:kotlin-reflect:\${rootProject.ext.kotlinVersion}"`
      );
    }
    return config;
  });
};

module.exports = withKotlinReflect;
