# Prayer Reminder 🕌

A modern, highly customizable Islamic prayer times application built with React Native and Expo.

## 🎯 The Purpose

While there are countless prayer reminder apps available on the market, almost all of them suffer from a rigid notification system: they remind you *exactly* when the Azaan goes off. 

**This app solves a very specific problem:** What if you need exactly 15 minutes before Fajr to wake up and perform Wudu? What if you pray Dhuhr at a specific fixed time every day (e.g., 1:30 PM) rather than exactly at Zawal? 

This application gives you the unprecedented ability to set **custom absolute times** for *every individual prayer*. You are in complete control of your daily routine.

## ✨ Key Features

- **Auto & Manual Modes**: Switch between standard Azaan time notifications (Auto) or custom, user-defined fixed times for each prayer (Manual Mode).
- **12-Hour / 24-Hour Support**: Seamlessly switch between 12-hour AM/PM formats and 24-hour military time formats based on your preference.
- **Offline First**: Uses astronomical algorithms (`adhan` library) to calculate accurate prayer times entirely on-device based on your coordinates. No internet required for daily use!
- **Authentic Adhan & Custom Native Sounds**: Choose an authentic recorded Adhan or multiple custom alarm sounds natively integrated into Android channels.
- **Non-Intrusive Notifications**: Employs standard Android heads-up notifications that play your selected Adhan/alarm seamlessly in the background without abruptly taking over your device screen.
- **Background Scheduling**: Alarms are reliably scheduled natively up to 7 days in advance using `@notifee/react-native`. 
- **Modern Slate UI**: A sleek, high-contrast, modern slate dark mode UI tailored to fit perfectly across various Android device sizes.

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
- **Notifications**: [@notifee/react-native](https://notifee.app/) (robust local scheduling and custom sound channels)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Persisted via AsyncStorage)
- **Prayer Calculation**: [Adhan.js](https://github.com/batoulapps/adhan-js)
- **Location**: [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- **Navigation**: [React Navigation](https://reactnavigation.org/)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- EAS CLI (`npm install -g eas-cli`)
- Android SDK (for local builds)

### Installation

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/yourusername/prayer-reminder.git
   cd prayer-reminder
   npm install
   ```

2. Generate the native Android directories (Prebuild):
   ```bash
   npx expo prebuild -p android --clean
   ```

### Building the APK

Because this app uses custom native code (for Notifee and injecting custom `.mp3` and `.wav` audio files directly into Android's native `res/raw` directory), it cannot be run in Expo Go. You must build a native client.

**Option A: Cloud Production APK Build (EAS)**
Run the following command to utilize our custom `production-apk` profile and compile a standalone, installable APK file on Expo's servers:
```bash
npx eas-cli build -p android --profile production-apk
```

**Option B: Local Build via USB/Emulator**
```bash
npx expo run:android
```

## 📂 Project Structure

- `/src/screens` - Main UI Views (`HomeScreen.tsx`, `SettingsScreen.tsx`)
- `/src/store` - Zustand global state management (`useSettingsStore.ts`)
- `/src/services` - Core business logic (`NotificationService.ts`, `PrayerTimeService.ts`)
- `/assets/sounds` - Custom `.wav` and `.mp3` alarm audio files (including `adhan.mp3`)
- `withAndroidSounds.js` - Expo Config Plugin to inject sounds into the native Android build
- `eas.json` - Defines EAS build profiles, including the custom `production-apk` profile

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
