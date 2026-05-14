import { Capacitor } from "@capacitor/core";

import { getNotifications } from "./notificationService";

const SEEN_KEY = "fitaccess_seen_notifications";

function readSeenNotifications() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSeenNotifications(ids) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-50)));
}

export function supportsBrowserNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestBrowserNotificationPermission() {
  if (!supportsBrowserNotifications()) return "unsupported";
  return window.Notification.requestPermission();
}

export async function pollAndDisplayNotifications() {
  if (!supportsBrowserNotifications() || window.Notification.permission !== "granted") {
    return [];
  }

  const notifications = await getNotifications();
  const seen = new Set(readSeenNotifications());
  const unread = notifications.filter((item) => item.status !== "read");
  const fresh = unread.filter((item) => !seen.has(item.id));

  fresh.forEach((item) => {
    const notification = new window.Notification(item.subject, {
      body: item.body,
      tag: `fitaccess-${item.id}`,
    });
    notification.onclick = () => {
      window.focus();
      if (Capacitor.getPlatform() === "web") {
        window.location.href = "/app/notifications";
      }
    };
    seen.add(item.id);
  });

  writeSeenNotifications(Array.from(seen));
  return fresh;
}
