import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { NOTIFICATION_IDS, INACTIVITY_THRESHOLD_MS } from "../constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return false;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#6366f1",
      });
    }

    return true;
  },

  async scheduleInactivityReminder(): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(
      NOTIFICATION_IDS.INACTIVITY_REMINDER
    );

    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_IDS.INACTIVITY_REMINDER,
      content: {
        title: "We miss you! 📚",
        body: "You have courses waiting for you. Continue your learning journey today!",
        data: { type: "inactivity_reminder" },
        sound: true,
      },
      trigger: {
        seconds: INACTIVITY_THRESHOLD_MS / 1000,
        repeats: false,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });
  },

  async cancelInactivityReminder(): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(
      NOTIFICATION_IDS.INACTIVITY_REMINDER
    );
  },

  async sendBookmarkMilestoneNotification(count: number): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      identifier: `${NOTIFICATION_IDS.BOOKMARK_MILESTONE}-${count}`,
      content: {
        title: "Great collection! 🎯",
        body: `You've bookmarked ${count} courses. Ready to start learning?`,
        data: { type: "bookmark_milestone", count },
        sound: true,
      },
      trigger: null,
    });
  },

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(listener);
  },

  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  },
};
