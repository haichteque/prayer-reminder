import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { schedulePrayerNotifications } from '../services/NotificationService';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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

const SOUNDS = ['default', 'adhan', 'beep', 'chime', 'digital', 'echo', 'matrix'];

type Props = { navigation: NativeStackNavigationProp<any, any> };

export default function SettingsScreen({ navigation }: Props) {
  const {
    madhab, setMadhab,
    use24HourClock, setUse24HourClock,
    reminderMode, offsets,
    selectedSound, setSelectedSound,
    location, manualPrayerTimes,
  } = useSettingsStore();

  const [soundObject, setSoundObject] = useState<AudioPlayer | null>(null);

  useEffect(() => {
    return soundObject ? () => { soundObject.remove(); } : undefined;
  }, [soundObject]);

  const handleSaveAndReschedule = async () => {
    if (location) {
      await schedulePrayerNotifications(location, madhab, reminderMode, offsets, manualPrayerTimes, selectedSound, 7);
      Alert.alert('Done', 'Alarms rescheduled.');
    }
  };

  const handleSoundSelect = async (sound: string) => {
    setSelectedSound(sound);
    try {
      soundObject?.remove();
      let soundFile;
      switch (sound) {
        case 'adhan':   soundFile = require('../../assets/sounds/adhan.mp3');   break;
        case 'beep':    soundFile = require('../../assets/sounds/beep.wav');    break;
        case 'chime':   soundFile = require('../../assets/sounds/chime.wav');   break;
        case 'digital': soundFile = require('../../assets/sounds/digital.wav'); break;
        case 'echo':    soundFile = require('../../assets/sounds/echo.wav');    break;
        case 'matrix':  soundFile = require('../../assets/sounds/matrix.wav'); break;
        default: return;
      }
      if (soundFile) {
        const p = createAudioPlayer(soundFile);
        setSoundObject(p);
        p.play();
        setTimeout(() => p.pause(), 5000);
      }
    } catch (err) {
      console.log('Error playing preview:', err);
    }
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={18} color={C.textSec} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>

        {/* Alarm Sound */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Alarm Sound</Text>
          <View style={s.soundGrid}>
            {SOUNDS.map(sound => (
              <TouchableOpacity
                key={sound}
                style={[s.soundBtn, selectedSound === sound && s.soundBtnActive]}
                onPress={() => handleSoundSelect(sound)}
              >
                {selectedSound === sound && (
                  <Feather name="check" size={12} color={C.accent} style={{ marginRight: 4 }} />
                )}
                <Text style={[s.soundBtnText, selectedSound === sound && s.soundBtnTextActive]}>
                  {sound.charAt(0).toUpperCase() + sound.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Asr Method */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Asr Calculation</Text>
          <View style={s.segmentRow}>
            {(['Hanafi', 'Shafii'] as const).map(m => (
              <TouchableOpacity
                key={m}
                style={[s.segmentBtn, madhab === m && s.segmentBtnActive]}
                onPress={() => setMadhab(m)}
              >
                <Text style={[s.segmentText, madhab === m && s.segmentTextActive]}>
                  {m === 'Shafii' ? 'Standard' : m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time Format */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Time Format</Text>
          <View style={s.switchRow}>
            <Text style={s.switchLabel}>24-Hour Clock</Text>
            <Switch
              value={use24HourClock}
              onValueChange={setUse24HourClock}
              trackColor={{ false: C.border, true: C.accent }}
              thumbColor={C.textPri}
            />
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity style={s.saveBtn} onPress={handleSaveAndReschedule} activeOpacity={0.7}>
          <Text style={s.saveBtnText}>Apply & Reschedule</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: C.bg },

  // Header
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle:      { fontSize: 15, fontWeight: '600', color: C.textPri, letterSpacing: 0.5 },
  iconBtn:          { padding: 8 },

  // Content
  content:          { padding: 20, paddingBottom: 48 },

  // Section card
  section:          { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  sectionTitle:     { fontSize: 11, fontWeight: '600', color: C.textMut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },

  // Sound grid
  soundGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  soundBtn:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 100, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  soundBtnActive:   { borderColor: C.accent, backgroundColor: 'rgba(99,102,241,0.08)' },
  soundBtnText:     { color: C.textSec, fontSize: 13, fontWeight: '500' },
  soundBtnTextActive:{ color: C.textPri },

  // Segment control
  segmentRow:       { flexDirection: 'row', gap: 8 },
  segmentBtn:       { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: 'center', backgroundColor: C.bg },
  segmentBtnActive: { borderColor: C.accent, backgroundColor: 'rgba(99,102,241,0.08)' },
  segmentText:      { color: C.textSec, fontSize: 14, fontWeight: '500' },
  segmentTextActive:{ color: C.textPri },

  // Switch row
  switchRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel:      { color: C.textSec, fontSize: 14 },

  // Save button
  saveBtn:          { marginTop: 8, backgroundColor: C.accent, borderRadius: 10, paddingVertical: 15, alignItems: 'center' },
  saveBtnText:      { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
});
