import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { getPrayerTimesForDate } from './PrayerTimeService';
import { LocationData, Madhab, ReminderMode, PrayerOffsets } from '../store/useSettingsStore';

const ALARM_CHANNEL_ID = 'prayer-alarms-1';

export async function requestNotificationPermission() {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

export async function createNotificationChannel() {
  await notifee.createChannel({
    id: ALARM_CHANNEL_ID,
    name: 'Prayer Alarms',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    sound: 'default',
    bypassDnd: true,
  });
}

/**
 * Schedules notifications for the next `daysToSchedule` days based on user settings.
 */
export async function schedulePrayerNotifications(
  location: LocationData,
  madhab: Madhab,
  reminderMode: ReminderMode,
  offsets: PrayerOffsets,
  daysToSchedule: number = 7
) {
  // Clear previously scheduled notifications
  await notifee.cancelAllNotifications();
  await createNotificationChannel();

  const now = new Date();

  for (let i = 0; i < daysToSchedule; i++) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + i);

    const prayerTimes = getPrayerTimesForDate(targetDate, location, madhab);

    const prayers: Array<{ name: keyof PrayerOffsets, time: Date }> = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Sunrise', time: prayerTimes.sunrise },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha },
    ];

    for (const prayer of prayers) {
      let alarmTime = new Date(prayer.time);
      const offset = offsets[prayer.name];

      if (reminderMode === 'Manual') {
        alarmTime.setMinutes(alarmTime.getMinutes() - offset);
      }

      // Ensure we don't schedule alarms in the past
      if (alarmTime.getTime() > Date.now()) {
        const trigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: alarmTime.getTime(),
        };

        await notifee.createTriggerNotification(
          {
            id: `prayer-${prayer.name.toLowerCase()}-${targetDate.toISOString()}`,
            title: `Time for ${prayer.name} Prayer`,
            body: reminderMode === 'Auto'
              ? `It is now time for ${prayer.name}.`
              : `${prayer.name} is in ${offset} minutes.`,
            android: {
              channelId: ALARM_CHANNEL_ID,
              pressAction: {
                id: 'default',
              },
              fullScreenAction: {
                id: 'default',
              },
              autoCancel: false,
              ongoing: true,
            },
          },
          trigger
        );
      }
    }
  }
}

/**
 * Triggers an immediate test alarm (in 5 seconds) so the user can verify it works.
 */
export async function testAlarm() {
  await createNotificationChannel();
  
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: Date.now() + 5000, // Trigger in 5 seconds
  };

  await notifee.createTriggerNotification(
    {
      id: 'test-alarm',
      title: 'SYSTEM_TEST_ALARM',
      body: 'This is a test of the alarm system.',
      android: {
        channelId: ALARM_CHANNEL_ID,
        pressAction: {
          id: 'default',
        },
        fullScreenAction: {
          id: 'default',
        },
        autoCancel: false,
        ongoing: true,
      },
    },
    trigger
  );
}
