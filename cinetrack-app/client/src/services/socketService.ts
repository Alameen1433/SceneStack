import { io, Socket } from "socket.io-client";
import { getAuthToken } from "../contexts/AuthContext";
import type { WatchlistItem } from "../types/types";

type WatchlistUpdateHandler = (item: WatchlistItem) => void;
type WatchlistDeleteHandler = (data: { id: number }) => void;
type WatchlistSyncHandler = (data: { trigger: string }) => void;
type NotificationSyncHandler = (data: { id?: string }) => void;

class SocketService {
    private socket: Socket | null = null;
    private updateHandlers: WatchlistUpdateHandler[] = [];
    private deleteHandlers: WatchlistDeleteHandler[] = [];
    private syncHandlers: WatchlistSyncHandler[] = [];
    private notificationHandlers: ((notification: unknown) => void)[] = [];
    private notificationReadHandlers: NotificationSyncHandler[] = [];
    private notificationDeleteHandlers: NotificationSyncHandler[] = [];
    private notificationReadAllHandlers: (() => void)[] = [];

    connect() {
        if (this.socket?.connected) return;

        const token = getAuthToken();
        if (!token) {
            console.log("Socket: No auth token, skipping connection");
            return;
        }

        // Connect to the same origin
        this.socket = io({
            auth: { token },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            timeout: 20000,
        });

        this.socket.on("connect", () => {
            console.log("Socket: Connected for real-time sync");
        });

        this.socket.on("disconnect", (reason) => {
            console.log("Socket: Disconnected -", reason);
        });

        this.socket.on("connect_error", (error) => {
            console.error("Socket: Connection error -", error.message);
        });

        this.socket.on("watchlist:update", (item: WatchlistItem) => {
            this.updateHandlers.forEach(handler => handler(item));
        });

        this.socket.on("watchlist:delete", (data: { id: number }) => {
            this.deleteHandlers.forEach(handler => handler(data));
        });

        this.socket.on("watchlist:sync", (data: { trigger: string }) => {
            this.syncHandlers.forEach(handler => handler(data));
        });

        this.socket.on("notification:new", (notification: unknown) => {
            this.notificationHandlers.forEach(handler => handler(notification));
        });

        this.socket.on("notification:read", (data: { id: string }) => {
            this.notificationReadHandlers.forEach(handler => handler(data));
        });

        this.socket.on("notification:delete", (data: { id: string }) => {
            this.notificationDeleteHandlers.forEach(handler => handler(data));
        });

        this.socket.on("notification:read-all", () => {
            this.notificationReadAllHandlers.forEach(handler => handler());
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    onUpdate(handler: WatchlistUpdateHandler) {
        this.updateHandlers.push(handler);
        return () => {
            this.updateHandlers = this.updateHandlers.filter(h => h !== handler);
        };
    }

    onDelete(handler: WatchlistDeleteHandler) {
        this.deleteHandlers.push(handler);
        return () => {
            this.deleteHandlers = this.deleteHandlers.filter(h => h !== handler);
        };
    }

    onSync(handler: WatchlistSyncHandler) {
        this.syncHandlers.push(handler);
        return () => {
            this.syncHandlers = this.syncHandlers.filter(h => h !== handler);
        };
    }

    onNotification(handler: (notification: unknown) => void) {
        this.notificationHandlers.push(handler);
        return () => {
            this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler);
        };
    }

    onNotificationRead(handler: NotificationSyncHandler) {
        this.notificationReadHandlers.push(handler);
        return () => {
            this.notificationReadHandlers = this.notificationReadHandlers.filter(h => h !== handler);
        };
    }

    onNotificationDelete(handler: NotificationSyncHandler) {
        this.notificationDeleteHandlers.push(handler);
        return () => {
            this.notificationDeleteHandlers = this.notificationDeleteHandlers.filter(h => h !== handler);
        };
    }

    onNotificationReadAll(handler: () => void) {
        this.notificationReadAllHandlers.push(handler);
        return () => {
            this.notificationReadAllHandlers = this.notificationReadAllHandlers.filter(h => h !== handler);
        };
    }

    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }
}

// Singleton instance
export const socketService = new SocketService();
