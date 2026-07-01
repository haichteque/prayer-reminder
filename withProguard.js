const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withProguard = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const proguardPath = path.join(config.modRequest.platformProjectRoot, 'app', 'proguard-rules.pro');
      const rule = '-keep class expo.modules.kotlin.types.LazyKType { *; }';
      
      if (fs.existsSync(proguardPath)) {
        let content = fs.readFileSync(proguardPath, 'utf-8');
        if (!content.includes('LazyKType')) {
          fs.writeFileSync(proguardPath, content + '\n' + rule + '\n');
        }
      } else {
        fs.writeFileSync(proguardPath, rule + '\n');
      }
      return config;
    },
  ]);
};

module.exports = withProguard;
