import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Modal, TextInput, Switch } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useSettingsStore, PrayerOffsets } from '../store/useSettingsStore';
import { getPrayerTimesForDate, DailyPrayerTimes } from '../services/PrayerTimeService';
import { schedulePrayerNotifications } from '../services/NotificationService';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const GRADIENTS: Record<string, [string, string]> = {
  Fajr: ['#38bdf8', '#818cf8'],     // Sky to Indigo
  Dhuhr: ['#fbbf24', '#f59e0b'],    // Amber
  Asr: ['#f472b6', '#db2777'],      // Pink to Rose
  Maghrib: ['#c084fc', '#9333ea'],  // Purple
  Isha: ['#818cf8', '#4f46e5'],     // Indigo
};

type Props = {
  navigation: NativeStackNavigationProp<any, any>;
};

export default function HomeScreen({ navigation }: Props) {
  const { 
    location, setLocation, 
    madhab, 
    reminderMode, setReminderMode,
    offsets,
    manualPrayerTimes, setManualPrayerTime, syncManualPrayerTimes,
    use24HourClock,
    selectedSound
  } = useSettingsStore();
  
  const [prayerTimes, setPrayerTimes] = useState<DailyPrayerTimes | null>(null);
  const [loading, setLoading] = useState(false);
  const [cityName, setCityName] = useState<string>('Current Location');
  const [nextPrayerInfo, setNextPrayerInfo] = useState<{name: string, timeDiff: string} | null>(null);

  // Modal State
  const [selectedPrayer, setSelectedPrayer] = useState<keyof PrayerOffsets | null>(null);
  const [tempHours, setTempHours] = useState<string>('');
  const [tempMinutes, setTempMinutes] = useState<string>('');

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

      // Reverse geocode for city name
      try {
        const geocode = await Location.reverseGeocodeAsync(newLoc);
        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          setCityName(place.city || place.region || place.country || 'Current Location');
        }
      } catch (err) {
        console.log("Reverse geocoding failed", err);
      }

      await schedulePrayerNotifications(newLoc, madhab, reminderMode, offsets, manualPrayerTimes, selectedSound, 7);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (location) {
      const autoTimes = getPrayerTimesForDate(new Date(), location, madhab);
      if (reminderMode === 'Manual' && manualPrayerTimes) {
        const buildManualDate = (hm: {hours: number, minutes: number}) => {
          const d = new Date();
          d.setHours(hm.hours, hm.minutes, 0, 0);
          return d;
        };
        setPrayerTimes({
          fajr: buildManualDate(manualPrayerTimes.Fajr),
          sunrise: buildManualDate(manualPrayerTimes.Sunrise),
          dhuhr: buildManualDate(manualPrayerTimes.Dhuhr),
          asr: buildManualDate(manualPrayerTimes.Asr),
          sunset: autoTimes.sunset, // Keep sunset auto since it's just for display
          maghrib: buildManualDate(manualPrayerTimes.Maghrib),
          isha: buildManualDate(manualPrayerTimes.Isha),
        });
      } else {
        setPrayerTimes(autoTimes);
      }
    }
  }, [location, madhab, reminderMode, manualPrayerTimes]);

  useEffect(() => {
    if (location) {
      schedulePrayerNotifications(location, madhab, reminderMode, offsets, manualPrayerTimes, selectedSound, 7);
    }
  }, [reminderMode, offsets, manualPrayerTimes, selectedSound]);

  // Next prayer countdown timer
  useEffect(() => {
    if (!prayerTimes) return;

    const timer = setInterval(() => {
      const now = new Date();
      const prayers = [
        { name: 'Fajr', time: prayerTimes.fajr },
        { name: 'Sunrise', time: prayerTimes.sunrise },
        { name: now.getDay() === 5 ? 'Jummah' : 'Dhuhr', time: prayerTimes.dhuhr },
        { name: 'Asr', time: prayerTimes.asr },
        { name: 'Maghrib', time: prayerTimes.maghrib },
        { name: 'Isha', time: prayerTimes.isha },
      ];

      let next = prayers.find(p => p.time > now);
      if (!next) {
        // If all prayers today have passed, Fajr tomorrow is next (roughly +24h for now)
        const tmrwFajr = new Date(prayerTimes.fajr);
        tmrwFajr.setDate(tmrwFajr.getDate() + 1);
        next = { name: 'Fajr', time: tmrwFajr };
      }

      const diffMs = next.time.getTime() - now.getTime();
      if (diffMs <= 0) {
        setNextPrayerInfo(null);
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      let diffStr = '';
      if (hours > 0) diffStr += `${hours}h `;
      if (mins > 0 || hours > 0) diffStr += `${mins}m `;
      diffStr += `${secs}s`;

      setNextPrayerInfo({ name: next.name, timeDiff: diffStr });
    }, 1000);

    return () => clearInterval(timer);
  }, [prayerTimes]);

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
      const currentTime = manualPrayerTimes?.[prayer] || { hours: 12, minutes: 0 };
      setTempHours(String(currentTime.hours).padStart(2, '0'));
      setTempMinutes(String(currentTime.minutes).padStart(2, '0'));
    } else {
      alert("Switch to Manual mode to edit individual prayer times.");
    }
  };

  const saveTime = () => {
    if (selectedPrayer && tempHours && tempMinutes) {
      let h = parseInt(tempHours, 10);
      let m = parseInt(tempMinutes, 10);
      if (!isNaN(h) && !isNaN(m)) {
        if (h < 0) h = 0; if (h > 23) h = 23;
        if (m < 0) m = 0; if (m > 59) m = 59;
        setManualPrayerTime(selectedPrayer, h, m);
      }
    }
    setSelectedPrayer(null);
  };

  const handleSync = () => {
    if (location) {
      const autoTimes = getPrayerTimesForDate(new Date(), location, madhab);
      syncManualPrayerTimes(autoTimes);
      alert("Prayer times synchronized to current auto times!");
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Feather name="arrow-left" size={24} color="transparent" />
        <Text style={styles.topHeaderTitle}>PRAYER TIMES</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Settings')}>
          <Feather name="settings" size={22} color="#F8FAFC" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoCardWrapper}>
        <LinearGradient 
          colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} 
          style={styles.infoPanel}
        >
        <View style={styles.sunBlock}>
          <Text style={styles.sunLabel}>Sunrise</Text>
          <Feather name="sun" size={28} color="#fff" style={styles.sunIcon} />
          <Text style={styles.sunTime}>
            {prayerTimes ? formatTime(prayerTimes.sunrise) : '--:--'}
          </Text>
        </View>

        <View style={styles.centerBlock}>
          <Text style={styles.cityName}>{cityName}</Text>
          <Text style={styles.madhabName}>{madhab.toUpperCase()}</Text>
          <Text style={styles.zawalTime}>--------------</Text>
          {nextPrayerInfo && (
            <Text style={styles.nextPrayerText}>
              Next Prayer {nextPrayerInfo.name.toUpperCase()} {nextPrayerInfo.timeDiff}
            </Text>
          )}
        </View>

        <View style={styles.sunBlock}>
          <Text style={styles.sunLabel}>Sunset</Text>
          <Feather name="sunset" size={28} color="#fff" style={styles.sunIcon} />
          <Text style={styles.sunTime}>
            {prayerTimes ? formatTime(prayerTimes.sunset) : '--:--'}
          </Text>
        </View>
        </LinearGradient>
      </View>



      <View style={styles.modeContainer}>
        <View style={styles.modeToggleRow}>
          <Text style={styles.modeLabel}>Reminder Mode: {reminderMode}</Text>
          <Switch
            value={reminderMode === 'Auto'}
            onValueChange={(val) => setReminderMode(val ? 'Auto' : 'Manual')}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#818cf8' }}
            thumbColor={'#ffffff'}
          />
        </View>
        {reminderMode === 'Manual' && (
          <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
            <Feather name="refresh-cw" size={16} color="#818cf8" />
            <Text style={styles.syncButtonText}>SYNC TIMES</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#f3d29a" style={{ marginTop: 50 }} />
      ) : prayerTimes ? (
        <ScrollView style={styles.cardsContainer} contentContainerStyle={{ paddingBottom: 20 }}>
          {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((prayer) => (
            <TouchableOpacity 
              key={prayer} 
              activeOpacity={0.8}
              onPress={() => handlePrayerPress(prayer as keyof PrayerOffsets)}
              style={styles.cardWrapper}
            >
              <LinearGradient 
                colors={GRADIENTS[prayer] || ['#333', '#555']} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }}
                style={styles.gradientCard}
              >
                <Text style={styles.cardPrayerName}>
                  {prayer === 'Dhuhr' && new Date().getDay() === 5 ? 'JUMMAH' : prayer.toUpperCase()}
                </Text>
                
                <View style={styles.cardRight}>
                  <Text style={styles.cardPrayerTime}>
                    {formatTime(prayerTimes[prayer.toLowerCase() as keyof DailyPrayerTimes])}
                  </Text>
                  
                  <Feather 
                    name={reminderMode === 'Auto' ? 'bell' : 'bell-off'} 
                    size={32} 
                    color="#fff" 
                    style={styles.cardBellIcon} 
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.infoText}>Waiting for location data...</Text>
      )}

      <Modal visible={!!selectedPrayer} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set {selectedPrayer} Time</Text>
            <Text style={styles.modalLabel}>Enter time (24-hour format):</Text>
            
            <View style={styles.timeInputRow}>
              <TextInput
                style={[styles.modalInput, styles.timeInput]}
                keyboardType="numeric"
                value={tempHours}
                onChangeText={setTempHours}
                placeholder="HH"
                placeholderTextColor="#64748b"
                maxLength={2}
              />
              <Text style={styles.timeColon}>:</Text>
              <TextInput
                style={[styles.modalInput, styles.timeInput]}
                keyboardType="numeric"
                value={tempMinutes}
                onChangeText={setTempMinutes}
                placeholder="MM"
                placeholderTextColor="#64748b"
                maxLength={2}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setSelectedPrayer(null)}>
                <Text style={styles.modalButtonText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={saveTime}>
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
    backgroundColor: '#0F172A', // Deep modern slate
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 100,
  },
  infoCardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  infoPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sunBlock: {
    alignItems: 'center',
  },
  sunLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  sunIcon: {
    marginVertical: 5,
  },
  sunTime: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  centerBlock: {
    alignItems: 'center',
    flex: 1,
  },
  cityName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  madhabName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  zawalTime: {
    color: '#aaa',
    fontSize: 14,
    marginVertical: 4,
  },
  nextPrayerText: {
    color: '#fff',
    fontSize: 14,
  },
  modeContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 16,
  },
  modeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.2)',
  },
  syncButtonText: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  gradientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 28,
    borderRadius: 100,
  },
  cardPrayerName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  cardPrayerTime: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
  cardOffsetBadge: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardBellIcon: {
    opacity: 0.7,
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#aaa',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    padding: 24,
    borderRadius: 24,
    width: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalLabel: {
    color: '#94a3b8',
    marginBottom: 16,
    fontSize: 14,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    fontSize: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  timeInput: {
    flex: 1,
    textAlign: 'center',
    marginBottom: 0,
  },
  timeColon: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 100,
  },
  modalButtonPrimary: {
    backgroundColor: '#818cf8',
  },
  modalButtonText: {
    color: '#cbd5e1',
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
