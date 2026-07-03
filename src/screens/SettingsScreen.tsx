import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { schedulePrayerNotifications } from '../services/NotificationService';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

const SOUNDS = ['default', 'adhan', 'beep', 'chime', 'digital', 'echo', 'matrix'];

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any, any>;
};

export default function SettingsScreen({ navigation }: Props) {
  const { 
    madhab, setMadhab, 
    use24HourClock, setUse24HourClock,
    reminderMode, offsets,
    selectedSound, setSelectedSound,
    location, manualPrayerTimes
  } = useSettingsStore();

  const [soundObject, setSoundObject] = useState<AudioPlayer | null>(null);

  useEffect(() => {
    return soundObject
      ? () => {
          soundObject.remove();
        }
      : undefined;
  }, [soundObject]);

  const handleSaveAndReschedule = async () => {
    if (location) {
      await schedulePrayerNotifications(location, madhab, reminderMode, offsets, manualPrayerTimes, selectedSound, 7);
      Alert.alert("Success", "Settings applied and alarms rescheduled.");
    }
  };

  const handleSoundSelect = async (sound: string) => {
    setSelectedSound(sound);
    
    try {
      if (soundObject) {
        soundObject.remove();
      }
      
      let soundFile;
      switch (sound) {
        case 'adhan': soundFile = require('../../assets/sounds/adhan.mp3'); break;
        case 'beep': soundFile = require('../../assets/sounds/beep.wav'); break;
        case 'chime': soundFile = require('../../assets/sounds/chime.wav'); break;
        case 'digital': soundFile = require('../../assets/sounds/digital.wav'); break;
        case 'echo': soundFile = require('../../assets/sounds/echo.wav'); break;
        case 'matrix': soundFile = require('../../assets/sounds/matrix.wav'); break;
        default: return; // 'default' sound handles itself, no specific asset preview here
      }

      if (soundFile) {
        const newSound = createAudioPlayer(soundFile);
        setSoundObject(newSound);
        newSound.play();
        
        setTimeout(() => {
          newSound.pause();
        }, 5000);
      }
    } catch (error) {
      console.log('Error playing preview:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>SETTINGS</Text>
        <View style={{ width: 42 }} />
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer}>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alarm Sound</Text>
        <View style={styles.soundGrid}>
          {SOUNDS.map((sound) => (
            <TouchableOpacity 
              key={sound}
              style={[styles.soundButton, selectedSound === sound && styles.soundButtonActive]}
              onPress={() => handleSoundSelect(sound)}
            >
              <Text style={[styles.soundButtonText, selectedSound === sound && styles.soundButtonTextActive]}>
                {sound.charAt(0).toUpperCase() + sound.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Asr Calculation Method</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[styles.button, madhab === 'Hanafi' && styles.buttonActive]}
            onPress={() => setMadhab('Hanafi')}
          >
            <Text style={[styles.buttonText, madhab === 'Hanafi' && styles.buttonTextActive]}>Hanafi</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, madhab === 'Shafii' && styles.buttonActive]}
            onPress={() => setMadhab('Shafii')}
          >
            <Text style={[styles.buttonText, madhab === 'Shafii' && styles.buttonTextActive]}>Standard</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time Format</Text>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Use 24-Hour Clock</Text>
          <Switch
            value={use24HourClock}
            onValueChange={setUse24HourClock}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#818cf8' }}
            thumbColor={'#ffffff'}
          />
        </View>
      </View>

      <TouchableOpacity onPress={handleSaveAndReschedule} style={styles.saveButtonWrapper}>
        <LinearGradient 
          colors={['#38bdf8', '#818cf8']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }}
          style={styles.saveButton}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </LinearGradient>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  topHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 2,
  },
  iconButton: {
    padding: 10,
    borderRadius: 100,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 16,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  soundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  soundButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 100,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    minWidth: '46%',
  },
  soundButtonActive: {
    backgroundColor: '#818cf8',
    borderColor: '#818cf8',
  },
  soundButtonText: {
    color: '#cbd5e1',
    fontWeight: '600',
  },
  soundButtonTextActive: {
    color: '#ffffff',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 100,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  buttonActive: {
    backgroundColor: '#818cf8',
    borderColor: '#818cf8',
  },
  buttonText: {
    color: '#cbd5e1',
    fontWeight: '600',
  },
  buttonTextActive: {
    color: '#ffffff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  saveButtonWrapper: {
    marginTop: 16,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  saveButton: {
    padding: 16,
    borderRadius: 100,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
