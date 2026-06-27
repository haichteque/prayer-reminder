const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAndroidSounds = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const resRawDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'raw');
      const soundsDir = path.join(projectRoot, 'assets', 'sounds');

      // Create res/raw if it doesn't exist
      if (!fs.existsSync(resRawDir)) {
        fs.mkdirSync(resRawDir, { recursive: true });
      }

      // Copy all .wav files
      if (fs.existsSync(soundsDir)) {
        const files = fs.readdirSync(soundsDir);
        for (const file of files) {
          if (file.endsWith('.wav') || file.endsWith('.mp3')) {
            const src = path.join(soundsDir, file);
            const dest = path.join(resRawDir, file);
            fs.copyFileSync(src, dest);
            console.log(`[withAndroidSounds] Copied ${file} to res/raw`);
          }
        }
      } else {
        console.warn('[withAndroidSounds] assets/sounds directory not found!');
      }

      return config;
    },
  ]);
};

module.exports = withAndroidSounds;
