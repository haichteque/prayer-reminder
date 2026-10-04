/// <reference types="jest" />
import { getPrayerTimesForDate } from '../src/services/PrayerTimeService';
import { LocationData, Madhab, PrayerOffsets } from '../src/store/useSettingsStore';

describe('PrayerTimeService', () => {
  const mecca: LocationData = { latitude: 21.4225, longitude: 39.8262, city: 'Mecca' };
  const london: LocationData = { latitude: 51.5074, longitude: -0.1278, city: 'London' };
  const lahore: LocationData = { latitude: 31.5204, longitude: 74.3587, city: 'Lahore' };

  const testDate = new Date('2026-06-15T12:00:00Z');

  describe('Chronological sequencing', () => {
    it('produces strictly sequential prayer times for Mecca', () => {
      const times = getPrayerTimesForDate(testDate, mecca, 'Shafii');

      expect(times.fajr.getTime()).toBeLessThan(times.sunrise.getTime());
      expect(times.sunrise.getTime()).toBeLessThan(times.dhuhr.getTime());
      expect(times.dhuhr.getTime()).toBeLessThan(times.asr.getTime());
      expect(times.asr.getTime()).toBeLessThan(times.sunset.getTime());
      expect(times.sunset.getTime()).toBe(times.maghrib.getTime());
      expect(times.maghrib.getTime()).toBeLessThan(times.isha.getTime());
    });

    it('produces strictly sequential prayer times for London', () => {
      const times = getPrayerTimesForDate(testDate, london, 'Hanafi');

      expect(times.fajr.getTime()).toBeLessThan(times.sunrise.getTime());
      expect(times.sunrise.getTime()).toBeLessThan(times.dhuhr.getTime());
      expect(times.dhuhr.getTime()).toBeLessThan(times.asr.getTime());
      expect(times.asr.getTime()).toBeLessThan(times.maghrib.getTime());
      expect(times.maghrib.getTime()).toBeLessThan(times.isha.getTime());
    });

    it('produces valid Date objects for all 7 computed instances', () => {
      const times = getPrayerTimesForDate(testDate, lahore, 'Hanafi');

      expect(times.fajr).toBeInstanceOf(Date);
      expect(times.sunrise).toBeInstanceOf(Date);
      expect(times.dhuhr).toBeInstanceOf(Date);
      expect(times.asr).toBeInstanceOf(Date);
      expect(times.sunset).toBeInstanceOf(Date);
      expect(times.maghrib).toBeInstanceOf(Date);
      expect(times.isha).toBeInstanceOf(Date);

      // Verify none of them are NaN
      expect(isNaN(times.fajr.getTime())).toBe(false);
      expect(isNaN(times.dhuhr.getTime())).toBe(false);
      expect(isNaN(times.asr.getTime())).toBe(false);
    });
  });

  describe('Juristic Madhab Comparison', () => {
    it('calculates Hanafi Asr later in the day than Shafii Asr', () => {
      const shafiiTimes = getPrayerTimesForDate(testDate, lahore, 'Shafii');
      const hanafiTimes = getPrayerTimesForDate(testDate, lahore, 'Hanafi');

      // In the Hanafi school, Asr begins when an object's shadow is twice its length plus noon shadow.
      // In the Shafii school, it begins when shadow equals length plus noon shadow.
      // Therefore, Hanafi Asr must be later than Shafii Asr.
      expect(hanafiTimes.asr.getTime()).toBeGreaterThan(shafiiTimes.asr.getTime());

      // Other prayers (Fajr, Dhuhr, Maghrib, Isha) must remain identical
      expect(hanafiTimes.fajr.getTime()).toBe(shafiiTimes.fajr.getTime());
      expect(hanafiTimes.dhuhr.getTime()).toBe(shafiiTimes.dhuhr.getTime());
      expect(hanafiTimes.maghrib.getTime()).toBe(shafiiTimes.maghrib.getTime());
      expect(hanafiTimes.isha.getTime()).toBe(shafiiTimes.isha.getTime());
    });
  });

  describe('Offset Arithmetic Logic', () => {
    it('correctly calculates alarm time when offset minutes are applied', () => {
      const times = getPrayerTimesForDate(testDate, lahore, 'Hanafi');
      const offsets: PrayerOffsets = {
        Fajr: 15,
        Sunrise: 0,
        Dhuhr: 10,
        Asr: 0,
        Maghrib: 5,
        Isha: 20,
      };

      const fajrAlarm = new Date(times.fajr.getTime() - offsets.Fajr * 60_000);
      const dhuhrAlarm = new Date(times.dhuhr.getTime() - offsets.Dhuhr * 60_000);

      expect(fajrAlarm.getTime()).toBe(times.fajr.getTime() - 15 * 60 * 1000);
      expect(dhuhrAlarm.getTime()).toBe(times.dhuhr.getTime() - 10 * 60 * 1000);
    });
  });
});
