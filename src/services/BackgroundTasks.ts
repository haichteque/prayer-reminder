import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { schedulePrayerNotifications } from './NotificationService';
import { useSettingsStore } from '../store/useSettingsStore';

const BACKGROUND_PRAYER_SYNC_TASK = 'BACKGROUND_PRAYER_SYNC_TASK';

// Define the background task
TaskManager.defineTask(BACKGROUND_PRAYER_SYNC_TASK, async () => {
  try {
    const store = useSettingsStore.getState();

    // If the user hasn't set a location yet, we can't schedule prayers
    if (!store.location) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    await schedulePrayerNotifications(
      store.location,
      store.madhab,
      store.reminderMode,
      store.offsets,
      store.selectedSound,
      7 // Schedule for the next 7 days
    );

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Registers the background task to run periodically.
 */
export async function registerBackgroundPrayerSync() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_PRAYER_SYNC_TASK);
  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_PRAYER_SYNC_TASK, {
      minimumInterval: 60 * 60 * 24, // Run once a day
      stopOnTerminate: false, // Continue running after app is killed (Android only)
      startOnBoot: true, // Start task after device reboot (Android only)
    });
  }
}
