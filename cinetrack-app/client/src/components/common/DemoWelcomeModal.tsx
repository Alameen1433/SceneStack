import React, { useState, useEffect } from "react";
import { FiX, FiClock, FiInfo } from "react-icons/fi";

interface DemoWelcomeModalProps {
    onClose: () => void;
}

const DEMO_WELCOME_SHOWN_KEY = "scenestack_demo_welcome_shown";

export const DemoWelcomeModal: React.FC<DemoWelcomeModalProps> = ({ onClose }) => {
    const handleClose = () => {
        sessionStorage.setItem(DEMO_WELCOME_SHOWN_KEY, "true");
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className="bg-brand-surface border border-brand-primary/30 w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white">Welcome to SceneStack Demo</h2>
                        <p className="text-sm text-brand-text-dim mt-1">Try it out before you leave!</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 text-brand-text-dim hover:text-white transition-colors rounded-lg hover:bg-white/10"
                        aria-label="Close"
                    >
                        <FiX className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <FiClock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-amber-400 font-medium text-sm">Temporary Account</p>
                            <p className="text-xs text-brand-text-dim mt-1">
                                Your demo account and all data will be automatically deleted after a few hours.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl">
                        <FiInfo className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="text-brand-primary font-medium text-sm">Why Invite Codes?</p>
                            <p className="text-xs text-brand-text-dim mt-1">
                                SceneStack is a personal project. Invite codes keep this instance private.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action */}
                <button
                    onClick={handleClose}
                    className="w-full mt-6 py-3 px-4 rounded-xl font-semibold bg-brand-primary hover:bg-brand-secondary text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                    Got it, let's explore!
                </button>
            </div>
        </div>
    );
};

export const useDemoWelcome = (isDemo: boolean | undefined) => {
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        if (isDemo && !sessionStorage.getItem(DEMO_WELCOME_SHOWN_KEY)) {
            setShowWelcome(true);
        }
    }, [isDemo]);

    return {
        showWelcome,
        closeWelcome: () => setShowWelcome(false),
    };
};
