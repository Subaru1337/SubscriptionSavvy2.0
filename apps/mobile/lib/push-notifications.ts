import { isRunningInExpoGo } from 'expo';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null = null;

/** Remote/local push via expo-notifications is unavailable in Expo Go (SDK 53+). */
export function arePushNotificationsAvailable(): boolean {
  return !isRunningInExpoGo();
}

async function getNotifications(): Promise<NotificationsModule | null> {
  if (!arePushNotificationsAvailable()) {
    return null;
  }
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
  }
  return notificationsModule;
}

export async function getPushPermissionGranted(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;

  const perms = await Notifications.getPermissionsAsync();
  return (
    perms.granted ||
    perms.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function requestPushPermissions(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function schedulePaymentReminder(
  name: string,
  dateStr: string,
  cost: string,
): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  const triggerDate = new Date(dateStr);
  triggerDate.setDate(triggerDate.getDate() - 1);
  triggerDate.setHours(9, 0, 0, 0);

  if (triggerDate > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Payment Reminder',
        body: `Your subscription to ${name} (${cost}) is due tomorrow!`,
      },
      trigger: triggerDate,
    });
  }
}
