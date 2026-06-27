const { withProjectBuildGradle } = require('@expo/config-plugins');

const withNotifeeMaven = (config) => {
  return withProjectBuildGradle(config, async (config) => {
    let buildGradle = config.modResults.contents;
    
    const notifeeRepoUrl = `maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }`;
    
    // Inject the maven repo into allprojects -> repositories
    if (!buildGradle.includes('notifee/react-native/android/libs')) {
      buildGradle = buildGradle.replace(
        /allprojects\s*{\s*repositories\s*{/,
        `allprojects {\n    repositories {\n        ${notifeeRepoUrl}`
      );
    }
    
    config.modResults.contents = buildGradle;
    return config;
  });
};

module.exports = withNotifeeMaven;
