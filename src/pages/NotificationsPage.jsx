import { useEffect, useState } from "react";

import PageHeader from "../components/PageHeader";
import { getNotifications, markNotificationRead } from "../services/notificationService";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  const load = () => getNotifications().then(setNotifications).catch(() => setNotifications([]));

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        compact
        eyebrow="Notifications"
        title="Smart nudges and alerts"
        description="Workout consistency, hydration, recovery, and momentum nudges from the backend."
        notificationsTo="/app/notifications"
      />

      <div className="space-y-3">
        {notifications.length ? (
          notifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-[28px] border p-5 shadow-card ${
                notification.status === "read" ? "border-ink/10 bg-white/70" : "border-ember/20 bg-[#fff5ef]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-ember">{notification.status}</p>
                  <h2 className="mt-2 font-display text-2xl text-ink">{notification.subject}</h2>
                  <p className="mt-3 text-sm leading-7 text-ink/75">{notification.body}</p>
                </div>
                {notification.status !== "read" ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await markNotificationRead(notification.id);
                      await load();
                    }}
                    className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-cream"
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
              <p className="mt-4 text-xs text-ink/45">
                {notification.sent_at ? new Date(notification.sent_at).toLocaleString() : "Just now"}
              </p>
            </article>
          ))
        ) : (
          <div className="rounded-[28px] border border-dashed border-ink/15 bg-white/70 p-8 text-center text-sm text-ink/60">
            No notifications yet.
          </div>
        )}
      </div>
    </div>
  );
}
