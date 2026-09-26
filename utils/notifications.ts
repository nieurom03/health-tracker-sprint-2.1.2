import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { HealthReminder, RepeatRule } from "@/types/health";

const CHANNEL_ID = "health-reminders";

export function configureNotificationPresentation() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensurePermission() {
  const current = await Notifications.getPermissionsAsync();
  const result = current.granted
    ? current
    : await Notifications.requestPermissionsAsync();
  if (!result.granted)
    throw new Error(
      "Bạn cần cho phép thông báo trong Cài đặt để bật lời nhắc.",
    );
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Nhắc lịch sức khỏe",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }
}

function triggerFor(
  date: Date,
  repeat: RepeatRule,
): Notifications.NotificationTriggerInput {
  const common = Platform.OS === "android" ? { channelId: CHANNEL_ID } : {};
  if (repeat === "daily")
    return {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: date.getHours(),
      minute: date.getMinutes(),
      ...common,
    };
  if (repeat === "weekly")
    return {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: date.getDay() + 1,
      hour: date.getHours(),
      minute: date.getMinutes(),
      ...common,
    };
  if (repeat === "monthly")
    return {
      type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      ...common,
    };
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date,
    ...common,
  };
}

export async function scheduleHealthReminder(input: {
  title: string;
  notes?: string | null;
  patientId: number;
  scheduledAt: string;
  repeatRule: RepeatRule;
}) {
  await ensurePermission();
  const date = new Date(input.scheduledAt);
  if (input.repeatRule === "none" && date.getTime() <= Date.now())
    throw new Error("Thời điểm nhắc một lần phải ở trong tương lai.");
  return Notifications.scheduleNotificationAsync({
    content: {
      title: input.title,
      body: input.notes || "Đã đến giờ chăm sóc sức khỏe.",
      sound: "default",
      data: { patientId: input.patientId },
    },
    trigger: triggerFor(date, input.repeatRule),
  });
}

export async function cancelHealthReminder(notificationId?: string | null) {
  if (notificationId)
    await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllHealthReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleSavedReminder(item: HealthReminder) {
  return scheduleHealthReminder({
    title: item.title,
    notes: item.notes,
    patientId: item.patient_id,
    scheduledAt: item.scheduled_at,
    repeatRule: item.repeat_rule,
  });
}
