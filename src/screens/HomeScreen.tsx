import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Switch, TextInput, Modal } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useSettingsStore, PrayerOffsets } from '../store/useSettingsStore';
import { getPrayerTimesForDate, DailyPrayerTimes } from '../services/PrayerTimeService';
import { schedulePrayerNotifications } from '../services/NotificationService';

type Props = {
  navigation: NativeStackNavigationProp<any, any>;
};

export default function HomeScreen({ navigation }: Props) {
  const { 
    location, setLocation, 
    madhab, 
    reminderMode, setReminderMode, 
    offsets, setOffset,
    use24HourClock,
    selectedSound
  } = useSettingsStore();
  
  const [prayerTimes, setPrayerTimes] = useState<DailyPrayerTimes | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [selectedPrayer, setSelectedPrayer] = useState<keyof PrayerOffsets | null>(null);
  const [tempOffset, setTempOffset] = useState<string>('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        setLoading(false);
        return;
      }

      let currentLoc;
      try {
        currentLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (error) {
        console.log("Failed to get current position, trying last known...", error);
        currentLoc = await Location.getLastKnownPositionAsync({});
      }

      if (!currentLoc) {
        alert('Could not fetch location. Please ensure location services are enabled on your device/emulator.');
        setLoading(false);
        return;
      }

      const newLoc = {
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
      };
      setLocation(newLoc);

      await schedulePrayerNotifications(newLoc, madhab, reminderMode, offsets, selectedSound, 7);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (location) {
      setPrayerTimes(getPrayerTimesForDate(new Date(), location, madhab));
    }
  }, [location, madhab]);

  // Reschedule whenever mode or offsets change
  useEffect(() => {
    if (location) {
      schedulePrayerNotifications(location, madhab, reminderMode, offsets, selectedSound, 7);
    }
  }, [reminderMode, offsets, selectedSound]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: !use24HourClock 
    });
  };

  const handlePrayerPress = (prayer: keyof PrayerOffsets) => {
    if (reminderMode === 'Manual') {
      setSelectedPrayer(prayer);
      setTempOffset(String(offsets[prayer]));
    }
  };

  const saveOffset = () => {
    if (selectedPrayer && tempOffset) {
      const num = parseInt(tempOffset, 10);
      if (!isNaN(num)) {
        setOffset(selectedPrayer, num);
      }
    }
    setSelectedPrayer(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Prayer Times</Text>
      
      <View style={styles.modeContainer}>
        <Text style={styles.modeLabel}>Mode: {reminderMode}</Text>
        <Switch
          value={reminderMode === 'Auto'}
          onValueChange={(val) => setReminderMode(val ? 'Auto' : 'Manual')}
          trackColor={{ false: '#42464D', true: '#10b981' }}
          thumbColor={'#ffffff'}
        />
      </View>

      {reminderMode === 'Manual' && (
        <Text style={styles.helperText}>Tap a prayer to edit its offset (minutes before).</Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 50 }} />
      ) : prayerTimes ? (
        <View style={styles.timesCard}>
          <ScrollView style={styles.timesContainer}>
            {(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as Array<keyof PrayerOffsets>).map((prayer, index) => (
              <TouchableOpacity 
                key={prayer} 
                style={[
                  styles.prayerRow,
                  index === 5 && styles.lastPrayerRow
                ]}
                disabled={reminderMode !== 'Manual'}
                onPress={() => handlePrayerPress(prayer)}
              >
                <Text style={styles.prayerName}>{prayer}</Text>
                <View style={styles.timeGroup}>
                  {reminderMode === 'Manual' && (
                    <Text style={styles.offsetBadge}>-{offsets[prayer]}m</Text>
                  )}
                  <Text style={styles.prayerTime}>
                    {prayer === 'Sunrise' ? formatTime(prayerTimes.sunrise) : formatTime(prayerTimes[prayer.toLowerCase() as keyof DailyPrayerTimes])}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <Text style={styles.infoText}>Waiting for location data...</Text>
      )}

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.settingsButtonText}>Settings</Text>
      </TouchableOpacity>

      {/* Modal for setting individual offset */}
      <Modal visible={!!selectedPrayer} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set {selectedPrayer} Offset</Text>
            <Text style={styles.modalLabel}>Minutes before Azaan:</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={tempOffset}
              onChangeText={setTempOffset}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setSelectedPrayer(null)}>
                <Text style={styles.modalButtonText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={saveOffset}>
                <Text style={styles.modalButtonTextPrimary}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#36393f',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 40,
    textAlign: 'center',
    color: '#f2f3f5',
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2f3136',
    borderRadius: 12,
  },
  modeLabel: {
    color: '#f2f3f5',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    color: '#b9bbbe',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 13,
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#b9bbbe',
    marginTop: 20,
  },
  timesCard: {
    flexShrink: 1,
    backgroundColor: '#2f3136',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  timesContainer: {
    flexGrow: 0,
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#42464D',
  },
  lastPrayerRow: {
    borderBottomWidth: 0,
  },
  prayerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f2f3f5',
  },
  timeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  offsetBadge: {
    backgroundColor: '#36393f',
    color: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  prayerTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  settingsButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#36393f',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    color: '#f2f3f5',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalLabel: {
    color: '#b9bbbe',
    marginBottom: 16,
    fontSize: 14,
  },
  modalInput: {
    backgroundColor: '#2f3136',
    color: '#f2f3f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 18,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalButtonPrimary: {
    backgroundColor: '#10b981',
  },
  modalButtonText: {
    color: '#b9bbbe',
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
