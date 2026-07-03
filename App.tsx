import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import notifee, { EventType } from '@notifee/react-native';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AlarmScreen from './src/screens/AlarmScreen';
import { registerBackgroundPrayerSync } from './src/services/BackgroundTasks';

// Register Notifee background event handler
notifee.onBackgroundEvent(async ({ type, detail }) => {
  // If the app is killed, the intent will still launch the main activity.
  // We don't need to do anything here for now, just register it so Notifee doesn't throw a warning.
});

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    // Register background tasks
    registerBackgroundPrayerSync();

    // Handle initial notification if app was opened from a notification/full-screen intent
    notifee.getInitialNotification().then((initialNotification) => {
      if (initialNotification) {
        setTimeout(() => {
          navigationRef.current?.navigate('Alarm');
        }, 100);
      }
    });

    // Handle foreground events (if notification triggers while app is open)
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.DELIVERED || type === EventType.PRESS) {
        navigationRef.current?.navigate('Alarm');
      }
    });

    return unsubscribe;
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#36393f',
          }
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
        />
        <Stack.Screen 
          name="Alarm" 
          component={AlarmScreen} 
          options={{ gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
