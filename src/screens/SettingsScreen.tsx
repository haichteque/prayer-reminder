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

      <TouchableOpacity 
        onPress={async () => {
          import('@notifee/react-native').then(async (notifee) => {
            const channelId = `prayer-alarms-${selectedSound}-v3`;
            await notifee.default.displayNotification({
              title: 'Test Notification',
              body: 'If you see this, basic notifications are working!',
              android: { channelId }
            });
          });
        }} 
        style={[styles.saveButtonWrapper, { marginTop: 12, shadowColor: '#f472b6' }]}
      >
        <LinearGradient 
          colors={['#f472b6', '#db2777']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }}
          style={styles.saveButton}
        >
          <Text style={styles.saveButtonText}>Test Instant Notification</Text>
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 2,
  },
  iconButton: {
    padding: 10,
    borderRadius: 100,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 60,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 20,
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
    padding: 14,
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
  helperText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
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
    fontSize: 16,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  saveButtonWrapper: {
    marginTop: 20,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  saveButton: {
    padding: 20,
    borderRadius: 100,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
