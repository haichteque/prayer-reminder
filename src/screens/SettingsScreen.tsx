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
      <Text style={styles.header}>SYSTEM_CONFIG</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>[ ALARM_SOUND ]</Text>
        <View style={styles.soundGrid}>
          {SOUNDS.map((sound) => (
            <TouchableOpacity 
              key={sound}
              style={[styles.soundButton, selectedSound === sound && styles.soundButtonActive]}
              onPress={() => handleSoundSelect(sound)}
            >
              <Text style={[styles.soundButtonText, selectedSound === sound && styles.soundButtonTextActive]}>
                {sound.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.helperText}>Selecting a sound will play a brief 5-second preview alarm.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>[ ASR_CALCULATION_METHOD ]</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[styles.button, madhab === 'Hanafi' && styles.buttonActive]}
            onPress={() => setMadhab('Hanafi')}
          >
            <Text style={[styles.buttonText, madhab === 'Hanafi' && styles.buttonTextActive]}>HANAFI</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, madhab === 'Shafii' && styles.buttonActive]}
            onPress={() => setMadhab('Shafii')}
          >
            <Text style={[styles.buttonText, madhab === 'Shafii' && styles.buttonTextActive]}>STANDARD</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>[ TIME_FORMAT ]</Text>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Use 24-Hour Clock</Text>
          <Switch
            value={use24HourClock}
            onValueChange={setUse24HourClock}
            trackColor={{ false: '#333', true: '#00FF41' }}
            thumbColor={'#000'}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveAndReschedule}>
        <Text style={styles.saveButtonText}>EXECUTE_UPDATE</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#00FF41',
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: '600',
    marginBottom: 15,
    color: '#00FF41',
  },
  soundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  soundButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#00FF41',
    borderRadius: 4,
    alignItems: 'center',
    backgroundColor: '#000',
    minWidth: '45%',
  },
  soundButtonActive: {
    backgroundColor: '#00FF41',
  },
  soundButtonText: {
    color: '#00FF41',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  soundButtonTextActive: {
    color: '#000000',
  },
  helperText: {
    color: '#00FF41',
    opacity: 0.8,
    fontFamily: 'monospace',
    fontSize: 12,
    marginTop: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#00FF41',
    borderRadius: 4,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  buttonActive: {
    backgroundColor: '#00FF41',
  },
  buttonText: {
    color: '#00FF41',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  buttonTextActive: {
    color: '#000000',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  label: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#00FF41',
  },
  saveButton: {
    backgroundColor: '#00FF41',
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
});
