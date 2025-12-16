import React, { useEffect, useState, useCallback, useRef } from "react";
import { FiBell, FiX, FiCheckCircle, FiTrash2, FiCheck } from "react-icons/fi";
import { getAuthToken } from "../../contexts/AuthContext";
import { useUIContext } from "../../contexts/UIContext";
import { socketService } from "../../services/socketService";

interface Notification {
    _id: string;
    type: "new_episode" | "new_season";
    mediaId: number;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
}

interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SwipeableNotificationProps {
    notification: Notification;
    onMarkRead: (id: string) => void;
    onDelete: (id: string) => void;
    formatDate: (date: string) => string;
}
const SWIPE_THRESHOLD = 80;
const MAX_SWIPE = 100;

const SwipeableNotification: React.FC<SwipeableNotificationProps> = ({
    notification,
    onMarkRead,
    onDelete,
    formatDate,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [translateX, setTranslateX] = useState(0);
    const [startX, setStartX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartX(e.touches[0].clientX);
        setIsSwiping(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        setTranslateX(Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff)));
    };

    const handleTouchEnd = () => {
        setIsSwiping(false);
        if (translateX < -SWIPE_THRESHOLD) {
            onDelete(notification._id);
        } else if (translateX > SWIPE_THRESHOLD && !notification.read) {
            onMarkRead(notification._id);
        }
        setTranslateX(0);
    };

    const deleteProgress = Math.min(1, Math.abs(Math.min(0, translateX)) / SWIPE_THRESHOLD);
    const readProgress = notification.read ? 0 : Math.min(1, Math.max(0, translateX) / SWIPE_THRESHOLD);

    return (
        <div className="relative overflow-hidden rounded-xl">
            {/* Background actions with progress indicators */}
            <div className="absolute inset-0 flex">
                <div
                    className="flex-1 flex items-center pl-4 transition-colors"
                    style={{ backgroundColor: `rgba(34, 197, 94, ${0.3 + readProgress * 0.5})` }}
                >
                    <FiCheck className={`h-5 w-5 text-white transition-transform ${readProgress >= 1 ? 'scale-125' : ''}`} />
                    {readProgress > 0.3 && (
                        <span className="ml-2 text-xs text-white font-medium">Read</span>
                    )}
                </div>
                <div
                    className="flex-1 flex items-center justify-end pr-4 transition-colors"
                    style={{ backgroundColor: `rgba(239, 68, 68, ${0.3 + deleteProgress * 0.5})` }}
                >
                    {deleteProgress > 0.3 && (
                        <span className="mr-2 text-xs text-white font-medium">Delete</span>
                    )}
                    <FiTrash2 className={`h-5 w-5 text-white transition-transform ${deleteProgress >= 1 ? 'scale-125' : ''}`} />
                </div>
            </div>

            {/* Swipeable content */}
            <div
                ref={containerRef}
                className={`relative p-3 rounded-xl transition-transform ${isSwiping ? "" : "duration-200"} ${notification.read
                    ? "bg-[#1a1a2e]"
                    : "bg-[#1f2937] border border-brand-primary/20"
                    }`}
                style={{ transform: `translateX(${translateX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                            {notification.title}
                        </p>
                        <p className="text-sm text-brand-text-dim">
                            {notification.message}
                        </p>
                        <p className="text-xs text-brand-text-dim mt-1">
                            {formatDate(notification.createdAt)}
                        </p>
                    </div>

                    {/* Action buttons (desktop) */}
                    <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                        {!notification.read && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkRead(notification._id);
                                }}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-brand-text-dim hover:text-green-400 transition-colors"
                                title="Mark as read"
                            >
                                <FiCheck className="h-4 w-4" />
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(notification._id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-brand-text-dim hover:text-red-400 transition-colors"
                            title="Delete"
                        >
                            <FiTrash2 className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-brand-primary flex-shrink-0 mt-2 sm:hidden" />
                    )}
                </div>
            </div>
        </div>
    );
};

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { setUnreadNotifications } = useUIContext();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setUnreadNotifications(unreadCount);
    }, [unreadCount, setUnreadNotifications]);

    const fetchNotifications = useCallback(async () => {
        const token = getAuthToken();
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch("/api/watchlist/notifications", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const markAsRead = async (id: string) => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const response = await fetch(`/api/watchlist/notifications/${id}/read`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((n) => (n._id === id ? { ...n, read: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const deleteNotification = async (id: string) => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const response = await fetch(`/api/watchlist/notifications/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const deleted = notifications.find((n) => n._id === id);
                setNotifications((prev) => prev.filter((n) => n._id !== id));
                if (deleted && !deleted.read) {
                    setUnreadCount((prev) => Math.max(0, prev - 1));
                }
            }
        } catch (err) {
            console.error("Failed to delete notification:", err);
        }
    };

    const markAllAsRead = async () => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const response = await fetch("/api/watchlist/notifications/read-all", {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                setUnreadCount(0);
            }
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        const unsubNew = socketService.onNotification((notification) => {
            setNotifications((prev) => [notification as Notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
        });

        const unsubRead = socketService.onNotificationRead((data) => {
            if (data.id) {
                setNotifications((prev) =>
                    prev.map((n) => (n._id === data.id ? { ...n, read: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        });

        const unsubDelete = socketService.onNotificationDelete((data) => {
            if (data.id) {
                setNotifications((prev) => {
                    const deleted = prev.find((n) => n._id === data.id);
                    if (deleted && !deleted.read) {
                        setUnreadCount((c) => Math.max(0, c - 1));
                    }
                    return prev.filter((n) => n._id !== data.id);
                });
            }
        });

        const unsubReadAll = socketService.onNotificationReadAll(() => {
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        });

        return () => {
            unsubNew();
            unsubRead();
            unsubDelete();
            unsubReadAll();
        };
    }, []);

    if (!isOpen) return null;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col text-brand-text-light"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 pb-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FiBell className="h-5 w-5 text-brand-primary" />
                        Notifications
                        {unreadCount > 0 && (
                            <span className="bg-brand-primary text-white text-xs px-2 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </h2>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-brand-text-dim hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg text-xs flex items-center gap-1"
                                title="Mark all as read"
                            >
                                <FiCheckCircle className="h-4 w-4" />
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

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-brand-primary/20 flex items-center justify-center mb-4">
                                <FiBell className="h-8 w-8 text-brand-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">No notifications</h3>
                            <p className="text-brand-text-dim text-sm max-w-xs">
                                You'll be notified when new episodes are available for shows in your watchlist.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* Mobile swipe hint */}
                            <p className="text-xs text-brand-text-dim text-center mb-2 sm:hidden">
                                Swipe right to mark read • Swipe left to delete
                            </p>
                            {notifications.map((notification) => (
                                <SwipeableNotification
                                    key={notification._id}
                                    notification={notification}
                                    onMarkRead={markAsRead}
                                    onDelete={deleteNotification}
                                    formatDate={formatDate}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 pt-2 border-t border-white/10 space-y-3">
                    <p className="text-xs text-brand-text-dim text-center">
                        Read notifications are automatically deleted after 7 days
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 px-4 rounded-xl font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
