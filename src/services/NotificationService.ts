import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TimestampTrigger,
  TriggerType,
  AndroidCategory,
  AndroidNotificationSetting,
} from '@notifee/react-native';
import { getPrayerTimesForDate } from './PrayerTimeService';
import { LocationData, Madhab, ReminderMode, PrayerOffsets, ManualPrayerTimes } from '../store/useSettingsStore';

export async function requestNotificationPermission() {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

export async function checkExactAlarmPermission() {
  const settings = await notifee.getNotificationSettings();
  if (settings.android.alarm === AndroidNotificationSetting.DISABLED) {
    import('react-native').then(({ Alert }) => {
      Alert.alert(
        "Alarms & Reminders Disabled",
        "Your device has blocked exact alarms for this app. Please open settings and allow 'Alarms & reminders' for alarms to work.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => notifee.openAlarmPermissionSettings() }
        ]
      );
    });
    return false;
  }
  return true;
}

export async function createNotificationChannel(sound: string) {
  const channelId = `prayer-alarms-${sound}-v5`;
  
  await notifee.createChannel({
    id: channelId,
    name: `Prayer Alarms (${sound})`,
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    sound: sound === 'default' ? 'default' : sound,
    bypassDnd: true,
  });

  return channelId;
}

/**
 * Schedules notifications for the next `daysToSchedule` days based on user settings.
 */
export async function schedulePrayerNotifications(
  location: LocationData,
  madhab: Madhab,
  reminderMode: ReminderMode,
  offsets: PrayerOffsets,
  manualPrayerTimes: ManualPrayerTimes | null,
  selectedSound: string = 'default',
  daysToSchedule: number = 7
) {
  // Clear previously scheduled notifications
  await notifee.cancelAllNotifications();
  const channelId = await createNotificationChannel(selectedSound);

  const now = new Date();

  for (let i = 0; i < daysToSchedule; i++) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + i);

    const prayerTimes = getPrayerTimesForDate(targetDate, location, madhab);

    const prayers: Array<{ name: keyof PrayerOffsets, time: Date }> = [
      { name: 'Fajr', time: prayerTimes.fajr },
      // Sunrise is intentionally excluded — it is not a prayer with an azaan
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha },
    ];

    for (const prayer of prayers) {
      let alarmTime = new Date(prayer.time);

      if (reminderMode === 'Manual' && manualPrayerTimes) {
        // In Manual mode, the time is strictly fixed to the user's manual settings
        const manualSetting = manualPrayerTimes[prayer.name];
        if (manualSetting) {
          alarmTime.setHours(manualSetting.hours, manualSetting.minutes, 0, 0);
        }
      }

      // Apply per-prayer offset: ring the alarm N minutes before the prayer time
      const offsetMinutes = offsets[prayer.name] ?? 0;
      if (offsetMinutes > 0) {
        alarmTime = new Date(alarmTime.getTime() - offsetMinutes * 60_000);
      }

      // Ensure we don't schedule alarms in the past
      if (alarmTime.getTime() > Date.now()) {
        const trigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: alarmTime.getTime(),
          alarmManager: {
            allowWhileIdle: true,
          },
        };

        const offsetLabel = offsetMinutes > 0 ? ` (in ${offsetMinutes} min)` : '';
        const modeLabel   = reminderMode === 'Manual' ? ' · Manual' : '';

        try {
          await notifee.createTriggerNotification(
            {
              id: `prayer-${prayer.name.toLowerCase()}-${targetDate.toISOString()}`,
              title: `${prayer.name} Prayer${offsetLabel}`,
              body: offsetMinutes > 0
                ? `${prayer.name} begins in ${offsetMinutes} minutes.${modeLabel}`
                : `It is time for ${prayer.name}.${modeLabel}`,
              android: {
                channelId: channelId,
                pressAction: { id: 'default' },
              },
            },
            trigger
          );
        } catch (err: any) {
          console.error('Failed to schedule trigger for', prayer.name, err);
          import('react-native').then(({ Alert }) => {
            Alert.alert('Scheduling Error', err.message);
          });
        }
      }
    }
  }
}

