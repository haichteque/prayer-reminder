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

interface SettingsState {
  madhab: Madhab;
  reminderMode: ReminderMode;
  offsets: PrayerOffsets;
  use24HourClock: boolean;
  selectedSound: string;
  location: LocationData | null;
  setMadhab: (madhab: Madhab) => void;
  setReminderMode: (mode: ReminderMode) => void;
  setOffset: (prayer: keyof PrayerOffsets, minutes: number) => void;
  setUse24HourClock: (use24Hour: boolean) => void;
  setSelectedSound: (sound: string) => void;
  setLocation: (location: LocationData | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      madhab: 'Hanafi',
      reminderMode: 'Auto',
      offsets: {
        Fajr: 15,
        Sunrise: 15,
        Dhuhr: 15,
        Asr: 15,
        Maghrib: 15,
        Isha: 15,
      },
      use24HourClock: false,
      selectedSound: 'default',
      location: null,
      setMadhab: (madhab) => set({ madhab }),
      setReminderMode: (reminderMode) => set({ reminderMode }),
      setOffset: (prayer, minutes) => set((state) => ({ 
        offsets: { ...state.offsets, [prayer]: minutes } 
      })),
      setUse24HourClock: (use24HourClock) => set({ use24HourClock }),
      setSelectedSound: (selectedSound) => set({ selectedSound }),
      setLocation: (location) => set({ location }),
    }),
    {
      name: 'prayer-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
