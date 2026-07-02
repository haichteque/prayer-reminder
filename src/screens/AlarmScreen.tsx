import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import notifee from '@notifee/react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSettingsStore } from '../store/useSettingsStore';

type Props = {
  navigation: NativeStackNavigationProp<any, any>;
};

export default function AlarmScreen({ navigation }: Props) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { use24HourClock, selectedSound } = useSettingsStore();
  let asset;
  switch (selectedSound) {
    case 'beep': asset = require('../../assets/sounds/beep.wav'); break;
    case 'chime': asset = require('../../assets/sounds/chime.wav'); break;
    case 'digital': asset = require('../../assets/sounds/digital.wav'); break;
    case 'echo': asset = require('../../assets/sounds/echo.wav'); break;
    case 'matrix': asset = require('../../assets/sounds/matrix.wav'); break;
    default: asset = require('../../assets/sounds/digital.wav'); break; // default to digital
  }

  const player = useAudioPlayer(asset);

  useEffect(() => {
    // Start continuous vibration (pattern: wait 0, vibrate 500, wait 500)
    Vibration.vibrate([0, 500, 500], true);

    async function playSound() {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'duckOthers',
      });

      player.loop = true;
      player.play();
    }
    playSound();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
      Vibration.cancel();
    };
  }, [player]);

  const handleDismiss = async () => {
    Vibration.cancel();
    player.pause();
    // Cancel the notification that triggered this
    await notifee.cancelAllNotifications();
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ALERT: PRAYER_TIME</Text>
      <Text style={styles.time}>
        {currentTime.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: !use24HourClock
        })}
      </Text>
      
      <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
        <Text style={styles.dismissText}>DISMISS_ALERT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    color: '#00FF41',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  time: {
    fontSize: 64,
    color: '#00FF41',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 60,
  },
  dismissButton: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#00FF41',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 8,
  },
  dismissText: {
    color: '#00FF41',
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
