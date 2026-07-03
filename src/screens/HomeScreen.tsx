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
      <Text style={styles.header}>SYSTEM_ACTIVE</Text>
      
      <View style={styles.modeContainer}>
        <Text style={styles.modeLabel}>MODE: {reminderMode.toUpperCase()}</Text>
        <Switch
          value={reminderMode === 'Auto'}
          onValueChange={(val) => setReminderMode(val ? 'Auto' : 'Manual')}
          trackColor={{ false: '#333', true: '#00FF41' }}
          thumbColor={'#000'}
        />
      </View>

      {reminderMode === 'Manual' && (
        <Text style={styles.helperText}>Tap a prayer to edit its offset (minutes before).</Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#00FF41" style={{ marginTop: 50 }} />
      ) : prayerTimes ? (
        <ScrollView style={styles.timesContainer}>
          {(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as Array<keyof PrayerOffsets>).map((prayer) => (
            <TouchableOpacity 
              key={prayer} 
              style={styles.prayerRow}
              disabled={reminderMode !== 'Manual'}
              onPress={() => handlePrayerPress(prayer)}
            >
              <Text style={styles.prayerName}>{prayer.toUpperCase()}</Text>
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
      ) : (
        <Text style={styles.infoText}>AWAITING_LOCATION_DATA...</Text>
      )}

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.settingsButtonText}>[ CONFIGURE ]</Text>
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
    backgroundColor: '#000000',
  },
  header: {
    fontSize: 24,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 40,
    textAlign: 'center',
    color: '#00FF41',
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    gap: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#00FF41',
    borderRadius: 4,
  },
  modeLabel: {
    color: '#00FF41',
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helperText: {
    color: '#00FF41',
    opacity: 0.8,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 12,
  },
  infoText: {
    fontSize: 16,
    fontFamily: 'monospace',
    textAlign: 'center',
    color: '#00FF41',
    marginTop: 20,
  },
  timesContainer: {
    flex: 1,
    marginTop: 10,
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  prayerName: {
    fontSize: 18,
    fontFamily: 'monospace',
    color: '#00FF41',
  },
  timeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  offsetBadge: {
    backgroundColor: '#003300',
    color: '#00FF41',
    fontFamily: 'monospace',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#00FF41',
  },
  prayerTime: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#00FF41',
  },
  settingsButton: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#00FF41',
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  settingsButtonText: {
    color: '#00FF41',
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#00FF41',
    padding: 20,
    borderRadius: 4,
    width: '80%',
  },
  modalTitle: {
    color: '#00FF41',
    fontFamily: 'monospace',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalLabel: {
    color: '#00FF41',
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#00FF41',
    color: '#00FF41',
    fontFamily: 'monospace',
    padding: 10,
    fontSize: 18,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
  },
  modalButton: {
    padding: 10,
  },
  modalButtonPrimary: {
    backgroundColor: '#00FF41',
    borderRadius: 4,
  },
  modalButtonText: {
    color: '#00FF41',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  modalButtonTextPrimary: {
    color: '#000',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
});
