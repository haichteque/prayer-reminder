import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReminderMode = 'Auto' | 'Manual';
export type Madhab = 'Hanafi' | 'Shafii';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
}

export interface PrayerOffsets {
  Fajr: number;
  Sunrise: number;
  Dhuhr: number;
  Asr: number;
  Maghrib: number;
  Isha: number;
}

export type ManualTime = { hours: number; minutes: number };
export type ManualPrayerTimes = Record<keyof PrayerOffsets, ManualTime>;

interface SettingsState {
  madhab: Madhab;
  reminderMode: ReminderMode;
  offsets: PrayerOffsets;
  use24HourClock: boolean;
  selectedSound: string;
  location: LocationData | null;
  manualPrayerTimes: ManualPrayerTimes | null;
  setMadhab: (madhab: Madhab) => void;
  setReminderMode: (mode: ReminderMode) => void;
  setOffset: (prayer: keyof PrayerOffsets, minutes: number) => void;
  setUse24HourClock: (use24Hour: boolean) => void;
  setSelectedSound: (sound: string) => void;
  setLocation: (location: LocationData | null) => void;
  setManualPrayerTime: (prayer: keyof PrayerOffsets, hours: number, minutes: number) => void;
  syncManualPrayerTimes: (times: any) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      madhab: 'Hanafi',
      reminderMode: 'Auto',
      offsets: {
        Fajr: 0,
        Sunrise: 0,
        Dhuhr: 0,
        Asr: 0,
        Maghrib: 0,
        Isha: 0,
      },
      use24HourClock: false,
      selectedSound: 'adhan',
      location: null,
      manualPrayerTimes: null,
      setMadhab: (madhab) => set({ madhab }),
      setReminderMode: (reminderMode) => set({ reminderMode }),
      setOffset: (prayer, minutes) => set((state) => ({ 
        offsets: { ...state.offsets, [prayer]: minutes } 
      })),
      setUse24HourClock: (use24HourClock) => set({ use24HourClock }),
      setSelectedSound: (selectedSound) => set({ selectedSound }),
      setLocation: (location) => set({ location }),
      setManualPrayerTime: (prayer, hours, minutes) => set((state) => {
        const currentManual = state.manualPrayerTimes || {
          Fajr: { hours: 5, minutes: 0 },
          Sunrise: { hours: 6, minutes: 0 },
          Dhuhr: { hours: 13, minutes: 0 },
          Asr: { hours: 16, minutes: 0 },
          Maghrib: { hours: 18, minutes: 0 },
          Isha: { hours: 20, minutes: 0 },
        };
        return {
          manualPrayerTimes: {
            ...currentManual,
            [prayer]: { hours, minutes }
          }
        };
      }),
      syncManualPrayerTimes: (times) => set(() => {
        return {
          manualPrayerTimes: {
            Fajr: { hours: times.fajr.getHours(), minutes: times.fajr.getMinutes() },
            Sunrise: { hours: times.sunrise.getHours(), minutes: times.sunrise.getMinutes() },
            Dhuhr: { hours: times.dhuhr.getHours(), minutes: times.dhuhr.getMinutes() },
            Asr: { hours: times.asr.getHours(), minutes: times.asr.getMinutes() },
            Maghrib: { hours: times.maghrib.getHours(), minutes: times.maghrib.getMinutes() },
            Isha: { hours: times.isha.getHours(), minutes: times.isha.getMinutes() },
          }
        };
      }),
    }),
    {
      name: 'prayer-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
