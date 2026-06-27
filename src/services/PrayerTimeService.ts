import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  Madhab as AdhanMadhab,
} from 'adhan';
import { Madhab, LocationData } from '../store/useSettingsStore';

export interface DailyPrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

/**
 * Calculates prayer times for a given date, location, and madhab.
 */
export function getPrayerTimesForDate(
  date: Date,
  location: LocationData,
  madhabSetting: Madhab
): DailyPrayerTimes {
  const coordinates = new Coordinates(location.latitude, location.longitude);
  
  // Defaulting to Muslim World League calculation method as a standard.
  // We can also allow the user to select this later if needed.
  let params = CalculationMethod.MuslimWorldLeague();

  if (madhabSetting === 'Hanafi') {
    params.madhab = AdhanMadhab.Hanafi;
  } else {
    params.madhab = AdhanMadhab.Shafi;
  }

  const prayerTimes = new PrayerTimes(coordinates, date, params);

  return {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
  };
}
