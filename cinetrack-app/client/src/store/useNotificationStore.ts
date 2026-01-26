import { create } from "zustand";
import { toast } from "sonner";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification,
} from "../services/dbService";
import { socketService } from "../services/socketService";
import { useEffect } from "react";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  // Actions
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  loadNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await getNotifications();
      set({
        notifications: response.notifications,
        unreadCount: response.unreadCount,
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to load notifications:", err);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    const { notifications } = get();
    // Optimistic update
    const updated = notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n));
    const unreadCount = updated.filter((n) => !n.isRead).length;

    set({ notifications: updated, unreadCount });

    try {
      await markNotificationAsRead(id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      // Revert if needed? Usually OK to leave it read locally.
    }
  },

  markAllAsRead: async () => {
    const { notifications } = get();
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    set({ notifications: updated, unreadCount: 0 });

    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      toast.error("Failed to update notifications");
      // Revert could be complicated, just reload
      get().loadNotifications();
    }
  },

  removeNotification: async (id: string) => {
    const { notifications } = get();
    const target = notifications.find((n) => n._id === id);
    const updated = notifications.filter((n) => n._id !== id);
    const unreadCount = updated.filter((n) => !n.isRead).length;

    set({ notifications: updated, unreadCount });

    try {
      await deleteNotification(id);
    } catch (err) {
      console.error("Failed to delete notification:", err);
      if (target) {
        set({ notifications: notifications, unreadCount: get().unreadCount }); // Revert
      }
      toast.error("Failed to delete notification");
    }
  },

  addNotification: (notification: Notification) => {
    const { notifications, unreadCount } = get();
    // Avoid duplicates
    if (notifications.some((n) => n._id === notification._id)) return;

    set({
      notifications: [notification, ...notifications],
      unreadCount: unreadCount + 1,
    });

    // Show toast for new notification
    toast(notification.title, {
      description: notification.message,
    });
  },
}));

// Hook to initialize notifications and subscriptions
export const useNotificationInit = () => {
  const loadNotifications = useNotificationStore((state) => state.loadNotifications);
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    loadNotifications();

    const unsub = socketService.onNotification((notification) => {
      addNotification(notification);
    });

    return () => {
      unsub();
    };
  }, [loadNotifications, addNotification]);
};
