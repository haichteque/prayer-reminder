import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { schedulePrayerNotifications, testAlarm } from '../services/NotificationService';

export default function SettingsScreen() {
  const { 
    madhab, setMadhab, 
    use24HourClock, setUse24HourClock,
    reminderMode, offsets,
    location 
  } = useSettingsStore();

  const handleSaveAndReschedule = async () => {
    if (location) {
      await schedulePrayerNotifications(location, madhab, reminderMode, offsets, 7);
      Alert.alert("Success", "Settings applied and alarms rescheduled.");
    }
  };

  const handleTestAlarm = async () => {
    await testAlarm();
    Alert.alert("Test Alarm Triggered", "An alarm should pop up in exactly 5 seconds. Please put the app in the background (or leave it open) to test.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>SYSTEM_CONFIG</Text>

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>[ DIAGNOSTICS ]</Text>
        <TouchableOpacity style={styles.testButton} onPress={handleTestAlarm}>
          <Text style={styles.testButtonText}>RUN_ALARM_TEST</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveAndReschedule}>
        <Text style={styles.saveButtonText}>EXECUTE_UPDATE</Text>
      </TouchableOpacity>
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
    marginTop: 'auto',
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00FF41',
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  testButtonText: {
    color: '#00FF41',
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
});
