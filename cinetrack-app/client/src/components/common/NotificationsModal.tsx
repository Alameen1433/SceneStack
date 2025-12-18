import React from "react";
import { FiBell, FiX } from "react-icons/fi";

interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
    isOpen,
    onClose,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-brand-text-light"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FiBell className="h-5 w-5 text-brand-primary" />
                        Notifications
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-brand-text-dim hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                        aria-label="Close"
                    >
                        <FiX className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-brand-primary/20 flex items-center justify-center mb-4">
                        <FiBell className="h-8 w-8 text-brand-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Coming Soon</h3>
                    <p className="text-brand-text-dim text-sm max-w-xs">
                        Notifications are not available yet. Work in progress!!
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-4 py-2.5 px-4 rounded-xl font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                    Got it
                </button>
            </div>
        </div>
    );
};
