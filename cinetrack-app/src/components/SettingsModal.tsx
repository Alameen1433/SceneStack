import React, { useRef } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onExport,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-brand-surface rounded-lg shadow-2xl w-full max-w-md p-6 text-brand-text-light"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-brand-text-dim hover:text-white transition-colors text-3xl leading-none"
            aria-label="Close settings"
          >
            &times;
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-brand-primary mb-2">
              Data Storage
            </h3>
            <p className="text-sm text-brand-text-dim">
              By default, your watchlist is stored directly in this browser's
              local storage. This is fast and works offline, but the data is
              tied to this specific browser on this device.
            </p>
            <p className="text-sm text-brand-text-dim mt-2">
              Clearing your browser data{" "}
              <strong className="text-red-400">will permanently delete</strong>{" "}
              your watchlist.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-brand-primary mb-2">
              Backup & Transfer
            </h3>
            <p className="text-sm text-brand-text-dim mb-4">
              Use the options below to save a copy of your watchlist to a file,
              or to load a watchlist from a file. This is useful for backups or
              moving your data to another device.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onExport}
                className="w-full flex-1 py-2 px-4 rounded-lg font-semibold transition-colors bg-brand-primary hover:bg-brand-secondary text-white flex items-center justify-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export Watchlist
              </button>
              <button
                onClick={handleImportClick}
                className="w-full flex-1 py-2 px-4 rounded-lg font-semibold transition-colors bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Import Watchlist
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={onImport}
                accept="application/json,.json"
                className="hidden"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
