import * as Notifications from "expo-notifications";
import { CookingTimer } from "../stores/cooking-timer-store";

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleTimerNotification(
  timer: CookingTimer
): Promise<void> {
  if (timer.remainingSeconds <= 0) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Timer done!",
      body: `${timer.label} — ${timer.recipeName}`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: timer.remainingSeconds,
      repeats: false,
    },
    identifier: timer.id,
  });
}

export async function cancelTimerNotification(
  timerId: string
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(timerId);
}

export async function cancelAllTimerNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
