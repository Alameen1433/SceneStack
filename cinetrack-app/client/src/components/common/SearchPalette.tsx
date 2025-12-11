import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface SearchPaletteProps {
    onSearch: (query: string) => void;
    isLoading: boolean;
}

export const SearchPalette: React.FC<SearchPaletteProps> = ({
    onSearch,
    isLoading,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Keyboard shortcut handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Open with Cmd/Ctrl + K or /
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === "/" && !isOpen && document.activeElement?.tagName !== "INPUT") {
                e.preventDefault();
                setIsOpen(true);
            }
            // Close with Escape
            if (e.key === "Escape" && isOpen) {
                handleClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setQuery("");
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
            handleClose();
        }
    };

    const handleClear = () => {
        setQuery("");
        onSearch("");
        handleClose();
    };

    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const shortcutKey = isMac ? "⌘" : "Ctrl";

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full max-w-xl flex items-center gap-3 px-4 py-2.5 bg-brand-surface/50 hover:bg-brand-surface border border-white/5 hover:border-brand-primary/30 rounded-lg text-brand-text-dim transition-all duration-200 group"
            >
                <svg
                    className="w-4 h-4 text-brand-text-dim group-hover:text-white transition-colors"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="flex-1 text-left text-sm">Search movies & shows...</span>
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-medium bg-white/10 rounded-md text-brand-text-dim">
                    {shortcutKey} K
                </kbd>
            </button>

            {/* Modal Overlay */}
            {isOpen && createPortal(
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
                    onClick={handleClose}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

                    {/* Modal */}
                    <div
                        className="relative w-full max-w-2xl mx-4 bg-brand-surface/95 backdrop-blur-xl border border-brand-primary/10 rounded-xl shadow-2xl overflow-hidden animate-fadeInUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search Input */}
                        <form onSubmit={handleSearch} className="relative">
                            <div className="flex items-center px-4 border-b border-white/10">
                                <svg
                                    className="w-5 h-5 text-brand-text-dim flex-shrink-0"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search for movies, TV shows, actors..."
                                    className="flex-1 px-3 py-4 bg-transparent text-white text-lg placeholder-brand-text-dim focus:outline-none"
                                />
                                {isLoading ? (
                                    <svg className="animate-spin w-5 h-5 text-brand-primary" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : query && (
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        className="p-1 rounded text-brand-text-dim hover:text-white transition-colors"
                                        aria-label="Clear"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 py-3 bg-black/20 text-xs text-brand-text-dim">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5">
                                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">↵</kbd>
                                    to search
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">esc</kbd>
                                    to close
                                </span>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Animation Styles */}
            <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.15s ease-out;
        }
      `}</style>
        </>
    );
};
