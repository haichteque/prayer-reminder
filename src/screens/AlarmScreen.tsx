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
    case 'adhan': asset = require('../../assets/sounds/adhan.mp3'); break;
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
      <Text style={styles.title}>Time to Pray</Text>
      <Text style={styles.time}>
        {currentTime.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: !use24HourClock
        })}
      </Text>
      
      <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
        <Text style={styles.dismissText}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#36393f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    color: '#f2f3f5',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  time: {
    fontSize: 72,
    color: '#10b981',
    fontWeight: 'bold',
    marginBottom: 60,
  },
  dismissButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dismissText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
