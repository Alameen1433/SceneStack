import React from "react";
import { FiBell, FiX, FiCheck, FiTrash2, FiInfo, FiAward, FiTv } from "react-icons/fi";
import { useNotificationStore } from "../../store/useNotificationStore";
import type { Notification } from "../../services/dbService";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const timeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const NotificationIcon = ({ type }: { type: Notification["type"] }) => {
  switch (type) {
    case "milestone":
      return <FiAward className="text-yellow-400 w-5 h-5" />;
    case "premiere":
      return <FiTv className="text-purple-400 w-5 h-5" />;
    default:
      return <FiInfo className="text-blue-400 w-5 h-5" />;
  }
};

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, markAllAsRead, removeNotification } = useNotificationStore();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="backdrop-blur-xl bg-brand-surface border border-white/10 rounded-3xl shadow-2xl w-full max-w-md h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiBell className="h-5 w-5 text-brand-primary" />
            Notifications
          </h2>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs font-medium text-brand-primary hover:text-brand-primary/80 transition-colors px-3 py-1.5 rounded-full bg-brand-primary/10"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-brand-text-dim hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              aria-label="Close"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-brand-surface/50 flex items-center justify-center mb-4 text-brand-text-dim">
                <FiBell className="h-8 w-8" />
              </div>
              <p className="text-brand-text-dim">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`relative group p-4 rounded-xl border transition-all duration-200 ${
                  n.isRead
                    ? "bg-transparent border-transparent hover:bg-white/5"
                    : "bg-white/5 border-brand-primary/20 hover:border-brand-primary/40"
                }`}
              >
                <div className="flex gap-4">
                  <div
                    className={`mt-1 p-2 rounded-full h-fit ${n.isRead ? "bg-white/5" : "bg-brand-primary/10"}`}
                  >
                    <NotificationIcon type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4
                        className={`font-medium truncate pr-6 ${n.isRead ? "text-brand-text-dim" : "text-white"}`}
                      >
                        {n.title}
                      </h4>
                      <span className="text-xs text-brand-text-dim shrink-0 whitespace-nowrap">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p
                      className={`text-sm mt-1 leading-relaxed ${n.isRead ? "text-brand-text-dim/70" : "text-brand-text-light"}`}
                    >
                      {n.message}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(n._id);
                      }}
                      className="p-1.5 rounded-lg text-brand-text-dim hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                      title="Mark as read"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(n._id);
                    }}
                    className="p-1.5 rounded-lg text-brand-text-dim hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
