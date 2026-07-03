import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { schedulePrayerNotifications } from '../services/NotificationService';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';

const SOUNDS = ['default', 'beep', 'chime', 'digital', 'echo', 'matrix'];

export default function SettingsScreen() {
  const { 
    madhab, setMadhab, 
    use24HourClock, setUse24HourClock,
    reminderMode, offsets,
    selectedSound, setSelectedSound,
    location 
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
      await schedulePrayerNotifications(location, madhab, reminderMode, offsets, selectedSound, 7);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>Settings</Text>

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
        <Text style={styles.helperText}>Selecting a sound will play a brief 5-second preview alarm.</Text>
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
            trackColor={{ false: '#42464D', true: '#10b981' }}
            thumbColor={'#ffffff'}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveAndReschedule}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#36393f',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#f2f3f5',
  },
  section: {
    marginBottom: 32,
    backgroundColor: '#2f3136',
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#f2f3f5',
  },
  soundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  soundButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#42464D',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#36393f',
    minWidth: '46%',
  },
  soundButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  soundButtonText: {
    color: '#b9bbbe',
    fontWeight: '600',
  },
  soundButtonTextActive: {
    color: '#ffffff',
  },
  helperText: {
    color: '#b9bbbe',
    fontSize: 13,
    marginTop: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: '#42464D',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#36393f',
  },
  buttonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  buttonText: {
    color: '#b9bbbe',
    fontWeight: '600',
  },
  buttonTextActive: {
    color: '#ffffff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 16,
    color: '#b9bbbe',
  },
  saveButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
