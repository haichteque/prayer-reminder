# Prayer Reminder 🕌

A modern, highly customizable Islamic prayer times application built with React Native and Expo.

## 🎯 The Purpose

While there are countless prayer reminder apps available on the market, almost all of them suffer from a rigid notification system: they remind you *exactly* when the Azaan goes off. 

**This app solves a very specific problem:** What if you need exactly 15 minutes before Fajr to wake up and perform Wudu? What if you want a 10-minute heads-up before Maghrib? 

This application gives you the unprecedented ability to set **custom offset times (X minutes before)** for *every individual prayer*. You are in complete control of your daily routine.

## ✨ Key Features

- **Custom Alarm Offsets**: Set specific "X minutes before" reminders for Fajr, Sunrise, Dhuhr, Asr, Maghrib, and Isha independently.
- **Auto & Manual Modes**: Switch between standard Azaan time notifications (Auto) or custom pre-prayer alarms (Manual).
- **Offline First**: Uses astronomical algorithms (`adhan` library) to calculate accurate prayer times entirely on-device based on your coordinates. No internet required for daily use!
- **Custom Native Sounds**: Choose between multiple custom alarm sounds (Digital, Matrix, Echo, Chime, Beep) natively integrated into Android channels.
- **Background Scheduling**: Alarms are reliably scheduled natively up to 7 days in advance using `@notifee/react-native`. 
- **Cyberpunk Terminal Aesthetic**: A sleek, high-contrast, terminal-inspired dark mode UI.

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
- **Notifications**: [@notifee/react-native](https://notifee.app/) (for robust local scheduling and custom sound channels)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Prayer Calculation**: [Adhan.js](https://github.com/batoulapps/adhan-js)
- **Location**: [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- **Navigation**: [React Navigation](https://reactnavigation.org/)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- EAS CLI (`npm install -g eas-cli`)
- Android Studio / Android SDK (for local builds)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/prayer-reminder.git
   cd prayer-reminder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate the native Android directories (Prebuild):
   ```bash
   npx expo prebuild -p android --clean
   ```

4. Start the Expo development server:
   ```bash
   npx expo start
   ```

### Building the APK

Because this app uses custom native code (for Notifee and custom audio files in Android's `res/raw`), it cannot be run in Expo Go. You must build a native client.

**Option A: Cloud Build (Recommended)**
```bash
eas build -p android --profile development
```

**Option B: Local Build**
```bash
npx expo run:android
```

## 📂 Project Structure

- `/src/screens` - UI Views (Home, Settings, Alarms)
- `/src/store` - Zustand global state management
- `/src/services` - Core business logic (Notifications, Prayer Calculations, Background Tasks)
- `/assets/sounds` - Custom `.wav` alarm audio files
- `withAndroidSounds.js` - Expo Config Plugin to inject sounds into the native Android build
- `withNotifeeMaven.js` - Expo Config Plugin for Notifee gradle support

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
