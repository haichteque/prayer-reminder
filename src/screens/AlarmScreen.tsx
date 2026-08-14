import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import notifee from '@notifee/react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSettingsStore } from '../store/useSettingsStore';
import { Feather } from '@expo/vector-icons';

// ─── Design tokens (shared palette) ──────────────────────────────────────────
const C = {
  bg:      '#0A0A0A',
  surface: '#141414',
  border:  '#222222',
  accent:  '#6366f1',
  textPri: '#F8FAFC',
  textSec: '#64748B',
  textMut: '#334155',
};

type Props = { navigation: NativeStackNavigationProp<any, any> };

export default function AlarmScreen({ navigation }: Props) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { use24HourClock, selectedSound } = useSettingsStore();

  let asset;
  switch (selectedSound) {
    case 'adhan':   asset = require('../../assets/sounds/adhan.mp3');   break;
    case 'beep':    asset = require('../../assets/sounds/beep.wav');    break;
    case 'chime':   asset = require('../../assets/sounds/chime.wav');   break;
    case 'digital': asset = require('../../assets/sounds/digital.wav'); break;
    case 'echo':    asset = require('../../assets/sounds/echo.wav');    break;
    case 'matrix':  asset = require('../../assets/sounds/matrix.wav'); break;
    default:        asset = require('../../assets/sounds/digital.wav'); break;
  }

  const player = useAudioPlayer(asset);

  useEffect(() => {
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

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { clearInterval(timer); Vibration.cancel(); };
  }, [player]);

  const handleDismiss = async () => {
    Vibration.cancel();
    player.pause();
    await notifee.cancelAllNotifications();
    navigation.replace('Home');
  };

  const timeStr = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24HourClock,
  });

  return (
    <View style={s.container}>
      {/* Prayer indicator dot */}
      <View style={s.dot} />

      <Text style={s.label}>Time to Pray</Text>
      <Text style={s.time}>{timeStr}</Text>

      <TouchableOpacity style={s.dismissBtn} onPress={handleDismiss} activeOpacity={0.7}>
        <Feather name="x" size={18} color={C.textPri} />
        <Text style={s.dismissText}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },

  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent, marginBottom: 32 },

  label:       { fontSize: 13, fontWeight: '500', letterSpacing: 2, textTransform: 'uppercase', color: C.textSec, marginBottom: 12 },

  time:        { fontSize: 80, fontWeight: '200', color: C.textPri, letterSpacing: -3, marginBottom: 64 },

  dismissBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.border, borderRadius: 100, paddingVertical: 14, paddingHorizontal: 32, backgroundColor: C.surface },
  dismissText: { color: C.textPri, fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
});
