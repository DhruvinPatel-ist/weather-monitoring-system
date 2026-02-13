import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(relativeTime);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export interface Notification {
  id: string;
  message: string;
  created_at: string;
}

export const getTimeGroupLabel = (
  date: string,
  t: (key: string, params?: any) => string
): string => {
  const notificationDate = dayjs(date);
  const now = dayjs();

  // Today
  if (notificationDate.isSame(now, "day")) {
    return t("today");
  }

  // Yesterday
  if (notificationDate.isSame(now.subtract(1, "day"), "day")) {
    return t("yesterday");
  }

  // This week (within last 7 days)
  if (
    notificationDate.isAfter(now.subtract(7, "day")) &&
    notificationDate.isBefore(now)
  ) {
    const daysAgo = now.diff(notificationDate, "day");
    return t("daysAgo", { count: daysAgo });
  }

  // Last week (7-14 days ago)
  if (
    notificationDate.isAfter(now.subtract(14, "day")) &&
    notificationDate.isSameOrBefore(now.subtract(7, "day"))
  ) {
    return t("lastWeek");
  }

  // This month
  if (notificationDate.isSame(now, "month")) {
    const weeksAgo = Math.floor(now.diff(notificationDate, "day") / 7);
    return t("weeksAgo", { count: weeksAgo });
  }

  // Last month
  if (notificationDate.isSame(now.subtract(1, "month"), "month")) {
    return t("lastMonth");
  }

  // Older than last month
  const monthsAgo = now.diff(notificationDate, "month");
  if (monthsAgo <= 6) {
    return t("monthsAgo", { count: monthsAgo });
  }

  return t("older");
};

export const groupNotificationsByTime = (
  notifications: Notification[],
  t: (key: string, params?: any) => string
): Record<string, Notification[]> => {
  const groups: Record<string, Notification[]> = {};

  notifications.forEach((notification) => {
    const label = getTimeGroupLabel(notification.created_at, t);

    if (!groups[label]) {
      groups[label] = [];
    }

    groups[label].push(notification);
  });

  // Sort groups by priority (Today first, then Yesterday, etc.)
  const sortedGroups: Record<string, Notification[]> = {};
  const groupOrder = [
    t("today"),
    t("yesterday"),
    t("lastWeek"),
    t("lastMonth"),
    t("older"),
  ];

  // Add groups in order
  groupOrder.forEach((groupName) => {
    if (groups[groupName]) {
      sortedGroups[groupName] = groups[groupName];
    }
  });

  // Add any remaining groups (like "X days ago", "X weeks ago")
  Object.keys(groups).forEach((groupName) => {
    if (!sortedGroups[groupName]) {
      sortedGroups[groupName] = groups[groupName];
    }
  });

  return sortedGroups;
};
